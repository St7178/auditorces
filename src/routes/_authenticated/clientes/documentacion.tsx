import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { CHECKLIST_DOCUMENTACION_CLIENTES } from "@/lib/ces-data";
import { ArrowLeft, ClipboardCheck, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes/documentacion")({
    component: DocumentacionPage,
    head: () => ({ meta: [{ title: "Documentación de Clientes — CES SIG" }] }),
});

type ChecklistItem = { id: string; codigo: string; nombre: string };

function ChecklistCard({
    titulo, icon: Icon, items, completados, onToggle,
}: {
    titulo: string;
    icon: typeof ClipboardCheck;
    items: ChecklistItem[];
    completados: Record<string, boolean>;
    onToggle: (id: string, completado: boolean) => void;
}) {
    const listos = items.filter((it) => completados[it.id]).length;
    return (
        <Card className="border-border/60">
            <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b p-4">
                    <Icon className="h-4 w-4 text-brand" />
                    <span className="font-semibold">{titulo}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">{listos}/{items.length} listos</Badge>
                </div>
                {items.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground">Sin documentos sincronizados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="w-8 px-4 py-2 text-left">Listo</th>
                                    <th className="px-4 py-2 text-left">Código</th>
                                    <th className="px-4 py-2 text-left">Nombre</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((it) => {
                                    const listo = Boolean(completados[it.id]);
                                    return (
                                        <tr key={it.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-2">
                                                <Checkbox checked={listo} onCheckedChange={(v) => onToggle(it.id, v === true)} />
                                            </td>
                                            <td className="px-4 py-2 font-mono text-muted-foreground">{it.codigo}</td>
                                            <td className={`px-4 py-2 font-medium ${listo ? "text-muted-foreground line-through" : ""}`}>{it.nombre}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DocumentacionPage() {
    const [checklist, setChecklist] = useState(CHECKLIST_DOCUMENTACION_CLIENTES);
    const [completados, setCompletados] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/checklist-clientes")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setChecklist(data))
            .catch(() => {
                /* fallback kept */
            });
        fetch("/api/checklist-clientes-estado")
            .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
            .then((data) => mounted && setCompletados(data))
            .catch(() => {
                /* queda todo sin marcar si falla */
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Optimista: se marca de inmediato en pantalla y se persiste en segundo plano; si falla, se revierte.
    const toggleChecklistItem = (id: string, completado: boolean) => {
        setCompletados((prev) => ({ ...prev, [id]: completado }));
        fetch("/api/checklist-clientes-estado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, completado }),
        }).then((r) => {
            if (!r.ok) throw new Error(r.statusText);
        }).catch(() => {
            setCompletados((prev) => ({ ...prev, [id]: !completado }));
        });
    };

    const todosLosItems = [...checklist.cliente, ...checklist.interna];
    const totalListos = todosLosItems.filter((it) => completados[it.id]).length;
    const progreso = todosLosItems.length > 0 ? Math.round((totalListos / todosLosItems.length) * 100) : 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Clientes CES"
                title="Checklist de entrega de documentación"
                description="Documentos estándar que deben entregarse al cierre de la implementación de un cliente CES (fuente: Control_Entrega_Documentación_Clientes.xlsx)."
                actions={
                    <Link to="/clientes" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ArrowLeft className="h-3.5 w-3.5" /> Clientes CES
                    </Link>
                }
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <ChecklistCard titulo="Documentación para el Cliente" icon={ClipboardCheck} items={checklist.cliente} completados={completados} onToggle={toggleChecklistItem} />
                <ChecklistCard titulo="Documentación Interna" icon={ClipboardList} items={checklist.interna} completados={completados} onToggle={toggleChecklistItem} />
            </div>

            <Card className="mt-4 border-border/60">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">Progreso general del checklist</span>
                        <span className="text-muted-foreground">{totalListos}/{todosLosItems.length} documentos listos · {progreso}%</span>
                    </div>
                    <Progress value={progreso} className="mt-2 h-2" />
                </CardContent>
            </Card>
        </div>
    );
}
