import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/politicas")({
    component: PoliticasPage,
    head: () => ({ meta: [{ title: "Políticas — Cultura SIG" }] }),
});

function PoliticasPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Cultura SIG"
                title="📜 Políticas"
                description="Los compromisos formales de la Alta Dirección de Compunet con la calidad y la seguridad de la información."
                actions={
                    <Link to="/cultura" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Cultura SIG
                    </Link>
                }
            />

            <Card className="mt-6 border-border/60">
                <CardContent className="p-6">
                    <img
                        src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/185px-Pol%C3%ADtica_SIG.png"
                        alt="Política SIG"
                        className="mx-auto h-auto max-h-40"
                    />
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        Dentro de su sistema de gestión integral de seguridad de la información y de calidad, basado en la ISO/IEC 27001
                        e ISO 9001, la Alta Dirección de Compunet S.A., consciente de la importancia tanto de la seguridad de la
                        información en su solución myE-Invoice como la calidad de sus Servicios Especializados, deben contar el total
                        compromiso para su diseño, implementación, mantenimiento y mejora continua de sus sistemas Gestión de Seguridad
                        de la Información y Gestión de Calidad, por esta razón define las siguientes políticas haciendo alusión a cada
                        uno de los sistemas pero sin perder su integralidad.
                    </p>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <img
                            src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/185px-Pol%C3%ADtica_de_Calidad.png"
                            alt="Política de Calidad"
                            className="mx-auto h-auto max-h-40"
                        />
                        <h2 className="mt-4 text-base font-semibold">Política de Calidad</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Compunet, como líder en brindar soluciones integradas de negocio basadas en tecnología informática, se
                            compromete a apoyar la transformación organizacional de sus clientes hacia una economía digital, mediante la
                            alineación de su plan estratégico con nuestra propuesta de valor y basándose en las mejores prácticas de la
                            industria de TI.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Las alianzas estratégicas, el personal competente, el cumplimiento de los requisitos establecidos por las
                            partes interesadas, los precios competitivos y la mejora, son elementos claves para la consecución de la
                            satisfacción de sus clientes y el aumento de la rentabilidad de la compañía.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardContent className="p-6">
                        <img
                            src="https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/185px-Pol%C3%ADtica_de_Seguridad_de_la_Informaci%C3%B3n.png"
                            alt="Política de Seguridad de la Información"
                            className="mx-auto h-auto max-h-40"
                        />
                        <h2 className="mt-4 text-base font-semibold">Política de Seguridad de la Información</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            La Alta Dirección de Compunet S.A. se compromete con las partes interesadas a liderar la protección de la
                            confidencialidad, integridad, disponibilidad y privacidad de la información, con base en principios de
                            ciberseguridad y gestión de riesgos.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Este compromiso se sustenta en el fortalecimiento del gobierno de seguridad de la información, la gestión
                            proactiva de amenazas y vulnerabilidades, y la adopción de tecnologías alineadas con las necesidades de
                            seguridad informática de la organización.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Compunet S.A. promueve una cultura de ciberseguridad, fortaleciendo la conciencia entre sus colaboradores,
                            permitiendo el cumplimiento de los requisitos legales, reglamentarios, contractuales y normativos
                            aplicables. Este compromiso se apoya en un talento humano competente, orientado al mejoramiento continuo de
                            los procesos organizacionales, para contribuir a la generación de valor en la operación.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
