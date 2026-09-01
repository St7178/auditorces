import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ScrollText, Target, BookOpenText, ChevronRight, Newspaper, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/")({
    component: CulturaPage,
    head: () => ({ meta: [{ title: "Cultura SIG — CES SIG" }] }),
});

type TipoActualizacion = "actualizacion" | "eliminacion" | "otro";
type EnlaceBoletin = { titulo: string; url: string; tipo: TipoActualizacion };
type SigBoletin = { id: string; asunto: string; fecha: string; enlaces: EnlaceBoletin[] };

// Mismo criterio visual que el resto de la app: verde para lo positivo/nuevo (actualización), rojo
// para lo que se elimina, gris neutral para cualquier otro aviso.
const TIPO_CHIP: Record<TipoActualizacion, string> = {
    actualizacion: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    eliminacion: "bg-red-100 text-red-700 hover:bg-red-200",
    otro: "bg-muted text-muted-foreground hover:bg-accent",
};

const SECCIONES = [
    {
        url: "/cultura/politicas",
        icon: ScrollText,
        emoji: "📜",
        titulo: "Políticas",
        descripcion: "Política SIG, Política de Calidad y Política de Seguridad de la Información.",
    },
    {
        url: "/cultura/objetivos",
        icon: Target,
        emoji: "🎯",
        titulo: "Objetivos de Calidad",
        descripcion: "Objetivos del Sistema de Gestión de Calidad (SGC) y de Seguridad de la Información (SGSI).",
    },
    {
        url: "/cultura/conceptos",
        icon: BookOpenText,
        emoji: "📖",
        titulo: "Conceptos del SIG",
        descripcion: "Qué es el SIG, calidad, seguridad de la información y otros conceptos base de las normas.",
    },
];

function CulturaPage() {
    const [sigBoletin, setSigBoletin] = useState<SigBoletin | null>(null);

    useEffect(() => {
        let mounted = true;
        // Boletín mensual "Actualización y Eliminación Información Documentada" — lo recibe el
        // webhook de n8n en /api/sig-actualizaciones, acá solo se lee el más reciente ya guardado.
        // Solo enlaces reales a la wiki (ver ese archivo): se intentó traer también las imágenes,
        // pero ni Vercel ni el propio n8n de Compunet pueden resolver wiki.grupocnet.com — es un
        // dominio interno solo alcanzable desde una máquina/VPN con acceso real.
        fetch("/api/sig-actualizaciones")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: SigBoletin | null) => mounted && setSigBoletin(data))
            .catch(() => {
                /* sin fuente real disponible: la tarjeta de Actualizaciones SIG queda vacía */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const fechaBoletin = sigBoletin
        ? new Date(sigBoletin.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
        : null;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Conocimiento"
                title="Cultura SIG"
                description="La identidad del Sistema Integrado de Gestión de Compunet: qué defendemos, hacia dónde vamos y el vocabulario que lo sostiene."
            />

            {/* Boletín real de Laura/SIG (Actualización y Eliminación de Información Documentada) —
                ver /api/sig-actualizaciones y sig-actualizaciones-storage.ts. Solo enlaces reales a
                la wiki, sin imágenes automáticas (ver nota arriba). */}
            <div className="mt-8">
                {sigBoletin ? (
                    <Card className="border-brand/30 bg-gradient-to-br from-brand-soft to-secondary">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                                    <Newspaper className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-brand">Actualizaciones SIG</div>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {sigBoletin.asunto}
                                        {fechaBoletin && <> · {fechaBoletin}</>}
                                    </p>
                                </div>
                            </div>

                            {sigBoletin.enlaces.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {sigBoletin.enlaces.map((e) => (
                                        <a
                                            key={e.url}
                                            href={e.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${TIPO_CHIP[e.tipo]}`}
                                        >
                                            <Link2 className="h-3.5 w-3.5" /> {e.titulo}
                                        </a>
                                    ))}
                                </div>
                            )}

                            <p className="mt-3 text-[11px] text-muted-foreground">Requiere iniciar sesión en CnetWiki con tu usuario de dominio Cnet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <Newspaper className="h-6 w-6" />
                        Sin boletines de actualización/eliminación de información documentada por ahora.
                    </div>
                )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {SECCIONES.map((s) => (
                    <Link key={s.url} to={s.url} className="block">
                        <Card className="h-full border-border/60 transition hover:border-brand hover:shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 font-semibold">
                                    <span>{s.emoji}</span> {s.titulo}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{s.descripcion}</p>
                                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
                                    Ver más <ChevronRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
