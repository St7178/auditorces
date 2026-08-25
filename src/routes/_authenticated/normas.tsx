import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/normas")({
    component: NormasPage,
    head: () => ({ meta: [{ title: "Normas CES — CES SIG" }] }),
});

// Los PDF viven en /public/normas — cualquiera con sesión en el portal puede descargarlos
// directamente, sin pasar por ninguna API (son archivos estáticos servidos por Vercel).
const NORMAS = [
    {
        titulo: "ISO 9001:2015",
        descripcion: "Sistemas de gestión de la calidad — Requisitos (traducción oficial ISO).",
        archivo: "/normas/ISO-9001-2015.pdf",
    },
    {
        titulo: "NTC-ISO-IEC 27001:2013",
        descripcion: "Sistemas de gestión de la seguridad de la información — Requisitos (norma técnica colombiana ICONTEC).",
        archivo: "/normas/NTC-ISO-IEC-27001-2013.pdf",
    },
];

function NormasPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Conocimiento"
                title="Normas CES"
                description="Normas de referencia del Sistema Integrado de Gestión, disponibles para consulta y descarga."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {NORMAS.map((n) => (
                    <Card key={n.archivo} className="border-border/60 transition hover:shadow-md">
                        <CardContent className="flex items-start gap-4 p-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{n.titulo}</div>
                                <p className="mt-1 text-xs text-muted-foreground">{n.descripcion}</p>
                                <a
                                    href={n.archivo}
                                    download
                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                                >
                                    <Download className="h-3.5 w-3.5" /> Descargar PDF
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
