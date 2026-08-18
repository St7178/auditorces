import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/objetivos")({
    component: ObjetivosPage,
    head: () => ({ meta: [{ title: "Objetivos de Calidad — Cultura SIG" }] }),
});

function ObjetivosPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Cultura SIG"
                title="🎯 Objetivos de Calidad"
                description="Los objetivos que guían al Sistema de Gestión de Calidad (SGC) y al Sistema de Gestión de Seguridad de la Información (SGSI)."
                actions={
                    <Link to="/cultura" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Cultura SIG
                    </Link>
                }
            />

            <div className="mt-8 space-y-6">
                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-base font-semibold">Objetivos SGC — Sistema de Gestión de Calidad</h2>
                        <img
                            src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Objetivos_de_Calidad.jpg"
                            alt="Objetivos de Calidad"
                            className="mx-auto mt-4 h-auto w-full max-w-2xl rounded-lg border"
                        />
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <h2 className="text-base font-semibold">Objetivos SGSI — Sistema de Gestión de Seguridad de la Información</h2>
                        <img
                            src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/889px-Objetivos_Sistema_de_Gesti%C3%B3n_de_Seguridad_de_la_Informaci%C3%B3n.jpg"
                            alt="Objetivos Sistema de Gestión de Seguridad de la Información"
                            className="mx-auto mt-4 h-auto w-full max-w-2xl rounded-lg border"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
