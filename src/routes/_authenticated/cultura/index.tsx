import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CoverFlowCarousel, type CarouselItem } from "@/components/ui/3-d-coverflow-carousel";
import { ScrollText, Target, BookOpenText, ChevronRight, Newspaper } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/")({
    component: CulturaPage,
    head: () => ({ meta: [{ title: "Cultura SIG — CES SIG" }] }),
});

type TipoActualizacion = "actualizacion" | "eliminacion" | "otro";
type ImagenBoletin = { url: string; tipo: TipoActualizacion; pagina: string };
type SigBoletin = { id: string; asunto: string; fecha: string; imagenes: ImagenBoletin[] };

const TITULO_POR_TIPO: Record<TipoActualizacion, { tag: string; linea1: string; linea2: string }> = {
    actualizacion: { tag: "#Actualización", linea1: "DOCUMENTOS", linea2: "ACTUALIZADOS" },
    eliminacion: { tag: "#Eliminación", linea1: "DOCUMENTOS", linea2: "ELIMINADOS" },
    otro: { tag: "#Aviso SIG", linea1: "AVISO", linea2: "INFORMACIÓN DOCUMENTADA" },
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
        // webhook de n8n en /api/sig-actualizaciones, acá solo se lee el más reciente ya guardado
        // (con sus imágenes ya re-alojadas en Vercel Blob).
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

    const mesAnio = sigBoletin
        ? new Date(sigBoletin.fecha).toLocaleDateString("es-CO", { month: "long", year: "numeric" }).toUpperCase()
        : "";

    // Cada imagen es una página real del boletín (sacada de la wiki, ver wiki-images.ts) — se arma
    // un slide por imagen, con el tag/título según si esa página venía de Actualizaciones o
    // Eliminaciones, y el CTA apunta a la página real de la wiki de la que salió esa imagen puntual.
    const items: CarouselItem[] = (sigBoletin?.imagenes ?? []).map((img) => {
        const info = TITULO_POR_TIPO[img.tipo];
        return {
            tag: info.tag,
            titleLine1: info.linea1,
            titleLine2: mesAnio ? `${info.linea2} · ${mesAnio}` : info.linea2,
            img: img.url,
            ctaText: "Ver en la wiki",
            ctaUrl: img.pagina,
        };
    });

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Conocimiento"
                title="Cultura SIG"
                description="La identidad del Sistema Integrado de Gestión de Compunet: qué defendemos, hacia dónde vamos y el vocabulario que lo sostiene."
            />

            {/* Boletín real de Laura/SIG (Actualización y Eliminación de Información Documentada) —
                ver /api/sig-actualizaciones, sig-actualizaciones-storage.ts y wiki-images.ts. Las
                imágenes son las páginas reales del boletín (sacadas de la wiki, no inventadas); si
                el webhook de n8n todavía no está conectado (o no hay imágenes por otra razón), se
                muestra un estado vacío propio en vez del carrusel oscuro sin nada adentro. */}
            <div className="mt-8">
                {items.length > 0 ? (
                    <CoverFlowCarousel items={items} sectionLabel={`ACTUALIZACIONES SIG${mesAnio ? ` · ${mesAnio}` : ""}`} />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
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
