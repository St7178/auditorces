import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cultura/conceptos")({
    component: ConceptosPage,
    head: () => ({ meta: [{ title: "Conceptos del SIG — Cultura SIG" }] }),
});

const CONCEPTOS: Array<{ pregunta: string; explicacion: string }> = [
    {
        pregunta: "¿Qué es el SIG?",
        explicacion: "El Sistema Integrado de Gestión: la forma en que Compunet organiza sus procesos, políticas y controles para cumplir a la vez con ISO 9001 (calidad) e ISO/IEC 27001 (seguridad de la información) bajo un mismo marco, en vez de gestionarlos por separado.",
    },
    {
        pregunta: "¿Qué es calidad?",
        explicacion: "El grado en que un producto o servicio cumple los requisitos del cliente y las partes interesadas — no es \"lo mejor posible\", es \"lo que se prometió, de forma consistente\". En CES se materializa en la conformidad del servicio entregado y la satisfacción del cliente.",
    },
    {
        pregunta: "¿Qué es seguridad de la información?",
        explicacion: "La protección de la información contra accesos, usos, divulgaciones, interrupciones o modificaciones no autorizadas — sin importar si esa información está en un sistema, en papel o en una conversación. Se sostiene en tres pilares: confidencialidad, integridad y disponibilidad.",
    },
    {
        pregunta: "¿Qué es confidencialidad?",
        explicacion: "Que la información solo esté disponible para quien está autorizado a verla. Es el pilar que más se asocia con \"seguridad\", pero es solo uno de tres.",
    },
    {
        pregunta: "¿Qué es integridad?",
        explicacion: "Que la información sea exacta y completa, y que no se modifique sin autorización — ni por error ni intencionalmente.",
    },
    {
        pregunta: "¿Qué es disponibilidad?",
        explicacion: "Que la información y los servicios estén accesibles cuando quien está autorizado los necesita. En CES esto se mide directamente con el indicador de Disponibilidad de servicios.",
    },
    {
        pregunta: "¿Qué es una no conformidad?",
        explicacion: "El incumplimiento de un requisito — propio, del cliente, legal o de la norma. No es necesariamente un error grave: es la señal que dispara una acción correctiva para que no se repita.",
    },
    {
        pregunta: "¿Qué es mejora continua?",
        explicacion: "El compromiso de revisar y ajustar procesos de forma constante, no solo cuando algo falla. Es uno de los principios que atraviesa tanto ISO 9001 como ISO/IEC 27001.",
    },
    {
        pregunta: "¿Qué es la Alta Dirección?",
        explicacion: "El nivel de liderazgo que define y respalda las políticas del SIG (como las políticas de Calidad y de Seguridad de la Información) y que debe demostrar compromiso visible con el sistema, no solo aprobarlo en el papel.",
    },
    {
        pregunta: "¿Qué es una parte interesada?",
        explicacion: "Cualquier persona u organización que puede afectar o verse afectada por el SIG: clientes, colaboradores, accionistas, proveedores, la sociedad. Sus necesidades y expectativas son un punto de partida obligatorio al planificar el sistema.",
    },
];

function ConceptosPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Cultura SIG"
                title="📖 Conceptos del SIG"
                description="Vocabulario básico para entender de qué hablan las normas y el resto del portal."
                actions={
                    <Link to="/cultura" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Cultura SIG
                    </Link>
                }
            />

            <Card className="mt-6 border-border/60">
                <CardContent className="p-0">
                    <Accordion type="multiple" className="px-5">
                        {CONCEPTOS.map((c) => (
                            <AccordionItem key={c.pregunta} value={c.pregunta}>
                                <AccordionTrigger>
                                    <span className="font-medium">{c.pregunta}</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground">{c.explicacion}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
