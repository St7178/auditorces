import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hash, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/chat")({
    component: ChatPage,
    head: () => ({ meta: [{ title: "Chat del Equipo — CES HUB" }] }),
});

const CANALES = ["General", "Auditorías", "Riesgos", "Clientes", "Indicadores", "Proveedores"];

const MENSAJES_MOCK: Record<string, { autor: string; texto: string; hora: string }[]> = {
    General: [
        { autor: "Elkin Borja", texto: "Buenos días equipo, recuerden la reunión mensual el viernes.", hora: "08:12" },
        { autor: "Laura Jaramillo", texto: "Perfecto, ya tengo la agenda lista.", hora: "08:15" },
        { autor: "Natalia Gallego", texto: "¿Incluimos el estado de los proyectos activos?", hora: "08:20" },
    ],
    Auditorías: [
        { autor: "Laura Jaramillo", texto: "La auditoría interna del SIG está programada para el 29 de julio.", hora: "09:00" },
        { autor: "Johann Steven Toro", texto: "Voy actualizando la matriz de riesgos esta semana.", hora: "09:05" },
    ],
    Riesgos: [{ autor: "Johann Steven Toro", texto: "Nuevo riesgo identificado en la infraestructura Cloud AWS.", hora: "10:30" }],
    Clientes: [{ autor: "Andrés Cano", texto: "Bancolombia solicita reunión de seguimiento la próxima semana.", hora: "11:15" }],
    Indicadores: [{ autor: "Yuliana", texto: "Ya cargué los indicadores de junio en Power BI.", hora: "14:00" }],
    Proveedores: [{ autor: "Lina Castañeda", texto: "VMware confirmó fecha para la nueva evaluación.", hora: "15:22" }],
};

function ChatPage() {
    const [canal, setCanal] = useState("General");
    const [texto, setTexto] = useState("");
    const [mensajes, setMensajes] = useState(MENSAJES_MOCK);

    const enviar = () => {
        if (!texto.trim()) return;
        setMensajes((m) => ({
            ...m,
            [canal]: [...(m[canal] || []), { autor: "Laura Jaramillo", texto, hora: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) }],
        }));
        setTexto("");
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Colaboración" title="Chat del Equipo CES" description="Canales internos para comunicación del área." />
            <Card className="mt-6 grid h-[600px] grid-cols-[220px_1fr] overflow-hidden border-border/60">
                <div className="border-r bg-muted/30 p-3">
                    <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Canales</div>
                    {CANALES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCanal(c)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${canal === c ? "bg-brand text-white" : "hover:bg-muted"}`}
                        >
                            <Hash className="h-3.5 w-3.5" /> {c}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col">
                    <div className="border-b px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold"><Hash className="h-4 w-4 text-brand" /> {canal}</div>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {(mensajes[canal] || []).map((m, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                                    {m.autor.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold">{m.autor}</span>
                                        <span className="text-[10px] text-muted-foreground">{m.hora}</span>
                                    </div>
                                    <div className="text-sm text-foreground/90">{m.texto}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t p-3">
                        <div className="flex gap-2">
                            <input
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && enviar()}
                                placeholder={`Mensaje en #${canal}`}
                                className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-brand"
                            />
                            <button onClick={enviar} className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand/90">
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
