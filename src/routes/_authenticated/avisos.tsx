import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CoverFlowCarousel, type CarouselItem } from "@/components/ui/3-d-coverflow-carousel";
import { Newspaper, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/avisos")({
    component: AvisosPage,
    head: () => ({ meta: [{ title: "Avisos SIG — CES SIG" }] }),
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

// Páginas reales del boletín del mes, subidas a mano a Vercel Blob (mismo hosting que las demás
// imágenes del dashboard) — la wiki interna no es alcanzable ni desde Vercel ni desde el propio n8n
// de Compunet (ver historial), así que por ahora esto se actualiza manualmente cada mes en vez de
// traerse solo. Cuando llegue el boletín siguiente, basta con reemplazar esta lista.
const IMAGENES_BOLETIN = [
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%281%29.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%282%29.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%283%29.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%284%29.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%285%29.png",
    "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/imagen%20%286%29.png",
];

function AvisosPage() {
    const [sigBoletin, setSigBoletin] = useState<SigBoletin | null>(null);

    useEffect(() => {
        let mounted = true;
        // Boletín mensual "Actualización y Eliminación Información Documentada" — lo recibe el
        // webhook de n8n en /api/sig-actualizaciones, acá solo se lee el más reciente ya guardado.
        // Solo enlaces reales a la wiki: se intentó traer también las imágenes, pero ni Vercel ni el
        // propio n8n de Compunet pueden resolver wiki.grupocnet.com — es un dominio interno solo
        // alcanzable desde una máquina/VPN con acceso real.
        fetch("/api/sig-actualizaciones")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data: SigBoletin | null) => mounted && setSigBoletin(data))
            .catch(() => {
                /* sin fuente real disponible: la tarjeta de enlaces queda vacía */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const fechaBoletin = sigBoletin
        ? new Date(sigBoletin.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
        : null;
    const mesAnio = sigBoletin
        ? new Date(sigBoletin.fecha).toLocaleDateString("es-CO", { month: "long", year: "numeric" }).toUpperCase()
        : "";

    // Sin metadato por imagen (son páginas escaneadas del boletín, no vienen etiquetadas una por
    // una) — se numeran en el orden en que se subieron en vez de adivinar a cuál enlace (Actualización
    // o Eliminación) corresponde cada una.
    const items: CarouselItem[] = IMAGENES_BOLETIN.map((img, i) => ({
        tag: "#Boletín SIG",
        titleLine1: `PÁGINA ${i + 1}`,
        titleLine2: mesAnio || "INFORMACIÓN DOCUMENTADA",
        img,
    }));

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Avisos"
                title="Avisos SIG"
                description="Boletín mensual de Actualización y Eliminación de Información Documentada del Sistema Integrado de Gestión."
            />

            <div className="mt-8">
                <CoverFlowCarousel items={items} sectionLabel={`ACTUALIZACIONES SIG${mesAnio ? ` · ${mesAnio}` : ""}`} />
            </div>

            <div className="mt-6">
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
        </div>
    );
}
