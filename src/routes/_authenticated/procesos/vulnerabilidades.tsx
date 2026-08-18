import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ShieldAlert, Link2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/procesos/vulnerabilidades")({
    component: VulnerabilidadesPage,
    head: () => ({ meta: [{ title: "Vulnerabilidades CES — CES SIG" }] }),
});

function VulnerabilidadesPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Procesos CES"
                title="Vulnerabilidades CES"
                description="Qué es una vulnerabilidad y dónde consultar el registro real del área."
                actions={
                    <Link to="/procesos" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Procesos CES
                    </Link>
                }
            />

            <Card className="mt-6 border-border/60">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold">¿Qué es una vulnerabilidad?</div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Es una debilidad en un proceso, sistema o control que una amenaza puede aprovechar para materializarse. En
                                seguridad de la información, identificar vulnerabilidades es la base de la valoración de riesgos (numeral
                                6.1.2 de ISO/IEC 27001).
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-6 border-brand/30 bg-gradient-to-br from-brand-soft to-secondary">
                <CardContent className="p-5">
                    <div className="font-semibold text-brand">Registro de vulnerabilidades</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        CES SIG no almacena el registro de vulnerabilidades — se consulta directamente en CnetWiki, donde se les hace
                        seguimiento como planes de acción a vencerse.
                    </p>
                    <a
                        href="https://wiki.grupocnet.com/index.php/PLANES_DE_ACCI%C3%93N_A_VENCERSE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
                    >
                        <Link2 className="h-3.5 w-3.5" /> Ver vulnerabilidades en la Wiki
                    </a>
                    <p className="mt-2 text-[11px] text-muted-foreground">Requiere iniciar sesión en CnetWiki con tu usuario de dominio Cnet.</p>
                </CardContent>
            </Card>
        </div>
    );
}
