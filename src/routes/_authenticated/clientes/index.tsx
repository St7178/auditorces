import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card3D } from "@/components/ui/animated-3d-card";
import { CLIENTES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos, type Contrato } from "@/lib/contratos";
import { clienteLogo } from "@/lib/cliente-logos";
import { normalizeName } from "@/lib/normalize-name";
import { Building2, AlertTriangle, ClipboardList, ArrowUpRight, Users, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes/")({
    component: ClientesPage,
    validateSearch: (search: Record<string, unknown>): { responsable?: string } => ({
        responsable: typeof search.responsable === "string" ? search.responsable : undefined,
    }),
    head: () => ({ meta: [{ title: "Clientes — CES SIG" }] }),
});

type Cliente = (typeof CLIENTES)[number];

// Color de cada estado de contrato — el mismo criterio (verde=vigente, ámbar=próximo,
// rojo=vencido) que ya usa el resumen de Contratos en el Dashboard.
function colorEstadoContrato(ct: Contrato, sobreRojo: boolean) {
    const clasif = clasificarContrato(ct);
    if (clasif === "vencido") return sobreRojo ? "text-white font-bold" : "text-red-600 font-bold";
    if (clasif === "proximo") return sobreRojo ? "text-amber-100 font-semibold" : "text-amber-600 font-semibold";
    return sobreRojo ? "text-emerald-100 font-semibold" : "text-brand font-semibold";
}

function ClienteCard({ c, todoVencido, algunVencido }: { c: Cliente; todoVencido: boolean; algunVencido: boolean }) {
    const logo = clienteLogo(c.nombre);
    const mut = todoVencido ? "text-white/75" : "text-muted-foreground";
    const divider = todoVencido ? "border-white/20" : "border-border/60";

    return (
        <Card3D variant={todoVencido ? "red" : "white"}>
            <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5">
                    {logo ? (
                        <img src={logo} alt={c.nombre} className="h-full w-full object-contain" />
                    ) : (
                        <Building2 className="h-6 w-6 text-slate-700" />
                    )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                    <div className="truncate text-lg font-bold leading-tight">{c.nombre}</div>
                    <div className={`text-xs ${mut}`}>Responsable · {c.responsable}</div>
                </div>
                <span
                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${todoVencido ? "bg-white" : c.estado === "Activo" ? "bg-emerald-500" : "bg-amber-500"}`}
                />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        todoVencido
                            ? "bg-white/15 text-white"
                            : c.estado === "Activo"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                    }`}
                >
                    {todoVencido ? "Contratos vencidos" : c.estado}
                </span>
                {algunVencido && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                        ⚠ Contrato(s) vencido(s)
                    </span>
                )}
            </div>

            {c.servicios && c.servicios.length > 0 && (
                <div className={`mt-3 text-xs leading-relaxed ${mut}`}>
                    <span className={`font-semibold ${todoVencido ? "text-white" : "text-foreground"}`}>Servicios: </span>
                    {c.servicios.join(", ")}
                </div>
            )}

            {c.contratos && c.contratos.length > 0 && (
                <div className={`mt-3 space-y-1.5 border-t pt-3 text-[11px] ${divider}`}>
                    {c.contratos.map((ct) => (
                        <div key={ct.id} className="flex items-center justify-between gap-3">
                            <span className={mut}>{ct.id}</span>
                            <span className={colorEstadoContrato(ct, todoVencido)}>
                                {ct.estado} · {ct.inicio} → {ct.fin}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card3D>
    );
}

function ClientesPage() {
    const { responsable } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const [clientes, setClientes] = useState(CLIENTES);

    useEffect(() => {
        let mounted = true;
        fetch("/api/sync/clientes")
            .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
            .then((data) => mounted && setClientes(data))
            .catch(() => {
                /* fallback kept */
            });
        return () => {
            mounted = false;
        };
    }, []);

    const resumen = resumenContratos(clientes.flatMap((c) => c.contratos || []));

    // Responsables distintos para el select — a partir de los datos reales ya sincronizados, no de
    // un listado aparte que se podría desincronizar.
    const responsables = [...new Set(clientes.map((c) => c.responsable).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));

    // Comparación normalizada (sin tildes/mayúsculas) porque el filtro puede llegar desde /equipo con
    // el nombre tal como lo fusiona Entra ID, que no siempre calza carácter a carácter con el
    // "responsable" tal como está escrito en el archivo sincronizado de clientes.
    const clientesFiltrados = responsable
        ? clientes.filter((c) => normalizeName(c.responsable) === normalizeName(responsable))
        : clientes;

    // Un cliente "Activo" con al menos un contrato vencido es una inconsistencia que vale la pena
    // señalar; si TODOS sus contratos están vencidos, "Activo" ya ni siquiera describe la realidad —
    // en ese caso la tarjeta completa pasa a rojo en vez de solo advertir con un badge.
    const clientesConAlgunContratoVencido = new Set(
        clientesFiltrados.filter((c) => c.estado === "Activo" && (c.contratos || []).some((ct) => clasificarContrato(ct) === "vencido")).map((c) => c.id),
    );
    const clientesConTodoVencido = new Set(
        clientesFiltrados
            .filter((c) => c.estado === "Activo" && (c.contratos || []).length > 0 && (c.contratos || []).every((ct) => clasificarContrato(ct) === "vencido"))
            .map((c) => c.id),
    );

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                eyebrow="Relacionamiento"
                title="Clientes"
                description="Clientes activos con contratos asociados gestionados por el equipo CES."
                actions={
                    <Link to="/clientes/documentacion" className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">
                        <ClipboardList className="h-3.5 w-3.5" /> Documentación <ArrowUpRight className="h-3 w-3" />
                    </Link>
                }
            />

            {(resumen.proximos > 0 || resumen.vencidos > 0) && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm">
                        <div className="font-semibold text-amber-900">Alerta de contratos</div>
                        <div className="text-amber-800">
                            {resumen.proximos > 0 && <>{resumen.proximos} contrato(s) próximo(s) a vencer en los siguientes 60 días. </>}
                            {resumen.vencidos > 0 && <>{resumen.vencidos} contrato(s) ya vencido(s).</>}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Clientes</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{clientesFiltrados.length} cliente{clientesFiltrados.length === 1 ? "" : "s"}.</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <select
                        value={responsable ?? ""}
                        onChange={(e) => navigate({ search: { responsable: e.target.value || undefined } })}
                        className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand"
                    >
                        <option value="">Todos los responsables</option>
                        {responsables.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    {responsable && (
                        <button
                            onClick={() => navigate({ search: {} })}
                            className="flex items-center gap-1 rounded-lg border bg-card px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                        >
                            <X className="h-3 w-3" /> Quitar filtro
                        </button>
                    )}
                </div>
            </div>
            {clientesFiltrados.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Ningún cliente sincronizado tiene a "{responsable}" como responsable todavía.
                </div>
            ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1500px" }}>
                    {clientesFiltrados.map((c) => (
                        <ClienteCard
                            key={c.id}
                            c={c}
                            todoVencido={clientesConTodoVencido.has(c.id)}
                            algunVencido={clientesConAlgunContratoVencido.has(c.id) && !clientesConTodoVencido.has(c.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
