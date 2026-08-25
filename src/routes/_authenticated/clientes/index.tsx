import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { CLIENTES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos } from "@/lib/contratos";
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

// Cara de cada tarjeta del carrusel: el fondo sigue siendo sólido oscuro/claro (nada de fotos de
// stock), pero el logo real del cliente sí se muestra — en una placa clara para que se lea igual de
// bien sobre cualquiera de los dos tonos — con el ícono genérico como respaldo si no hay logo.
function ClienteFace({ nombre, badgeLabel, logo, light }: { nombre: string; badgeLabel: string; logo?: string; light: boolean }) {
    const chip = light ? "bg-slate-900/8" : "bg-white/12";
    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                {logo ? (
                    <img src={logo} alt={nombre} className="h-full w-full object-contain" />
                ) : (
                    <Building2 className="h-7 w-7 text-slate-900" />
                )}
            </div>
            <div className="px-2 text-base font-semibold leading-tight">{nombre}</div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${chip}`}>{badgeLabel}</span>
        </div>
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
    // en ese caso se reemplaza el badge en vez de solo advertir debajo.
    const clientesConAlgunContratoVencido = new Set(
        clientesFiltrados.filter((c) => c.estado === "Activo" && (c.contratos || []).some((ct) => clasificarContrato(ct) === "vencido")).map((c) => c.id),
    );
    const clientesConTodoVencido = new Set(
        clientesFiltrados
            .filter((c) => c.estado === "Activo" && (c.contratos || []).length > 0 && (c.contratos || []).every((ct) => clasificarContrato(ct) === "vencido"))
            .map((c) => c.id),
    );

    const slides: CoverflowSlide[] = clientesFiltrados.map((c, i) => {
        const todoVencido = clientesConTodoVencido.has(c.id);
        const algunVencido = clientesConAlgunContratoVencido.has(c.id) && !todoVencido;
        const badgeLabel = todoVencido ? "Contratos vencidos" : c.estado;
        const light = i % 2 === 0;
        const tone: CoverflowSlide["tone"] = todoVencido ? "danger" : light ? "light" : "dark";

        const meta: { label: string; value: string }[] = [
            { label: "Responsable", value: c.responsable },
            { label: "Estado", value: badgeLabel },
        ];
        if (algunVencido) meta.push({ label: "⚠ Atención", value: "Tiene contrato(s) vencido(s)" });
        if (c.servicios?.length) meta.push({ label: "Servicios", value: c.servicios.join(", ") });
        for (const ct of c.contratos ?? []) {
            meta.push({ label: ct.id, value: `${ct.estado} · ${ct.inicio} → ${ct.fin}` });
        }

        return {
            face: <ClienteFace nombre={c.nombre} badgeLabel={badgeLabel} logo={clienteLogo(c.nombre)} light={light && !todoVencido} />,
            tone,
            title: c.nombre,
            subtitle: `Responsable · ${c.responsable}`,
            meta,
        };
    });

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
                    <p className="mt-1 text-sm text-muted-foreground">Arrastra o usa las flechas para recorrerlos — el panel de abajo muestra el detalle del que quede al centro.</p>
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
                <div className="mt-2">
                    <CoverflowCarousel
                        slides={slides}
                        showCaption
                        showPagination
                        showNavigation
                        label="Clientes CES"
                    />
                </div>
            )}
        </div>
    );
}
