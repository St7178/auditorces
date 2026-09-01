import { Agent, fetch as undiciFetch } from "undici";
import * as cheerio from "cheerio";

// El boletín mensual de "Actualización y Eliminación Información Documentada" enlaza a páginas
// reales de la wiki interna que EN SÍ son las imágenes del boletín (páginas escaneadas). El correo
// solo trae referencias internas (cid:) que no se pueden resolver fuera de Outlook, así que las
// imágenes reales se sacan de la wiki — mismo mecanismo de sesión (login por cookies + action API
// de MediaWiki) que ya usa scripts/ingest-wiki.mjs. Se reimplementa acá en vez de importarlo porque
// ese script es una herramienta CLI aparte (npm run ingest:wiki), no pensada para correr dentro de
// una función serverless — pero se replica el mismo comportamiento ya probado en producción,
// incluido el bypass de TLS que requieren las wikis internas de grupocnet.
const insecureAgent = new Agent({ connect: { rejectUnauthorized: false } });

class WikiSession {
    private cookies = new Map<string, string>();
    private base: string;

    constructor(base: string) {
        this.base = base;
    }

    private cookieHeader() {
        return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    }

    private captureCookies(res: any) {
        const setCookies: string[] = res.headers.getSetCookie
            ? res.headers.getSetCookie()
            : res.headers.get("set-cookie")
                ? [res.headers.get("set-cookie")]
                : [];
        for (const raw of setCookies) {
            const [pair] = raw.split(";");
            const idx = pair.indexOf("=");
            if (idx > 0) this.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
        }
    }

    private async apiGet(params: Record<string, string>) {
        const url = new URL("/api.php", this.base);
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
        const res: any = await undiciFetch(url as any, {
            headers: { Cookie: this.cookieHeader(), "User-Agent": "CesSigDashboard/1.0" },
            dispatcher: insecureAgent,
        } as any);
        this.captureCookies(res);
        return res.json();
    }

    private async apiPost(params: Record<string, string>) {
        const url = new URL("/api.php", this.base);
        const body = new URLSearchParams(params);
        const res: any = await undiciFetch(url as any, {
            method: "POST",
            headers: { Cookie: this.cookieHeader(), "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "CesSigDashboard/1.0" },
            body,
            dispatcher: insecureAgent,
        } as any);
        this.captureCookies(res);
        return res.json();
    }

    async login(username: string, password: string) {
        const tokenRes: any = await this.apiGet({ action: "query", meta: "tokens", type: "login", format: "json" });
        const loginToken = tokenRes?.query?.tokens?.logintoken;
        if (!loginToken) throw new Error("No se pudo obtener el login token de MediaWiki");
        const loginRes: any = await this.apiPost({ action: "login", lgname: username, lgpassword: password, lgtoken: loginToken, format: "json" });
        const status = loginRes?.login?.result;
        if (status !== "Success" && status !== "SuccessWithTwoFactor") {
            throw new Error(`Login fallido: ${status}`);
        }
    }

    async fetchPageHtml(title: string): Promise<string> {
        const normTitle = (title || "").trim().replace(/ /g, "_");
        const json: any = await this.apiGet({ action: "parse", page: normTitle, prop: "text", redirects: "1", format: "json" });
        if (json.error) throw new Error(JSON.stringify(json.error));
        return json.parse.text["*"];
    }

    async descargarImagen(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
        try {
            const res: any = await undiciFetch(url as any, { headers: { Cookie: this.cookieHeader() }, dispatcher: insecureAgent } as any);
            if (!res.ok) return null;
            const buffer = Buffer.from(await res.arrayBuffer());
            const contentType = res.headers.get("content-type") || "image/jpeg";
            return { buffer, contentType };
        } catch {
            return null;
        }
    }
}

// Extrae las URL de imagen realmente embebidas en el contenido de la página (el boletín publica
// sus páginas como imágenes, no como texto). Solo se excluyen los íconos propios del skin de
// MediaWiki — todo lo demás dentro del contenido se conserva a propósito: mejor mostrar de más que
// perder una página real del boletín por un filtro demasiado agresivo.
function extraerImagenesDeHtml(html: string, origin: string): string[] {
    const $ = cheerio.load(html);
    const $contenido = $("div.mw-parser-output").first().length ? $("div.mw-parser-output").first() : $("body");
    const urls: string[] = [];
    const vistos = new Set<string>();
    $contenido.find("img").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        if (src.includes("/skins/") || src.toLowerCase().includes("icon")) return;
        const absoluta = src.startsWith("http") ? src : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
        if (!vistos.has(absoluta)) {
            vistos.add(absoluta);
            urls.push(absoluta);
        }
    });
    return urls;
}

export type ImagenDescargada = { buffer: Buffer; contentType: string; nombre: string };

// Login + fetch + descarga de todas las páginas de un mismo boletín (ej. "Actualizaciones_Julio_2026"
// y "Eliminaciones_Julio_2026") en una sola sesión — no tiene sentido loguearse dos veces para dos
// páginas de la misma wiki. Si faltan credenciales (WIKI_USERNAME/WIKI_PASSWORD) o algo falla, se
// devuelve [] sin lanzar error: el boletín igual se guarda con su título y enlaces, solo queda sin
// imágenes hasta que se pueda reintentar.
export async function obtenerImagenesDeBoletin(pageUrls: string[]): Promise<ImagenDescargada[]> {
    const username = process.env.WIKI_USERNAME;
    const password = process.env.WIKI_PASSWORD;
    if (!username || !password || pageUrls.length === 0) return [];

    try {
        const origin = new URL(pageUrls[0]).origin;
        const session = new WikiSession(origin);
        await session.login(username, password);

        const imagenes: ImagenDescargada[] = [];
        for (const pageUrl of pageUrls) {
            const title = decodeURIComponent(pageUrl.split("/index.php/")[1] ?? "");
            if (!title) continue;
            const html = await session.fetchPageHtml(title);
            const urls = extraerImagenesDeHtml(html, origin);
            for (const url of urls) {
                const descargada = await session.descargarImagen(url);
                if (descargada) imagenes.push({ ...descargada, nombre: url.split("/").pop() || "imagen.jpg" });
            }
        }
        return imagenes;
    } catch (err) {
        console.error("No se pudieron obtener las imágenes de la wiki para el boletín:", err);
        return [];
    }
}
