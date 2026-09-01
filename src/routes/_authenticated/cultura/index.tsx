import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ScrollText, Target, BookOpenText, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/")({
    component: CulturaPage,
    head: () => ({ meta: [{ title: "Cultura SIG — CES SIG" }] }),
});

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
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Conocimiento"
                title="Cultura SIG"
                description="La identidad del Sistema Integrado de Gestión de Compunet: qué defendemos, hacia dónde vamos y el vocabulario que lo sostiene."
            />

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
