import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { CONTRATOS } from "@/lib/ces-data";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/contratos")({
    component: ContratosPage,
    head: () => ({ meta: [{ title: "Contratos — CES HUB" }] }),
});

function estadoTone(e: string) {
    if (e === "Próximo a vencer") return "bg-amber-100 text-amber-700";
    if (e === "Vigente") return "bg-brand-soft text-brand";
    return "bg-secondary text-secondary-foreground";
}

function ContratosPage() {
    const alertas = CONTRATOS.filter((c) => c.estado === "Próximo a vencer").length;
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader eyebrow="Control jurídico y comercial" title="Contratos" description="Solo se controlan fechas y responsables. Los contratos permanecen en los sistemas corporativos." />
            {alertas > 0 && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <div className="font-semibold text-amber-900">Alerta automática</div>
                        <div className="text-amber-800">{alertas} contrato(s) próximos a vencer en los siguientes 60 días.</div>
                    </div>
                </div>
            )}
            <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left">ID</th>
                                <th className="px-4 py-3 text-left">Cliente / Proveedor</th>
                                <th className="px-4 py-3 text-left">Inicio</th>
                                <th className="px-4 py-3 text-left">Vencimiento</th>
                                <th className="px-4 py-3 text-left">Responsable</th>
                                <th className="px-4 py-3 text-left">Estado</th>
                                <th className="px-4 py-3 text-left">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {CONTRATOS.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                                    <td className="px-4 py-3 font-medium">{c.cliente !== "-" ? c.cliente : c.proveedor}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.inicio}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.vencimiento}</td>
                                    <td className="px-4 py-3">{c.responsable}</td>
                                    <td className="px-4 py-3"><Badge className={estadoTone(c.estado)}>{c.estado}</Badge></td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.ubicacion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
