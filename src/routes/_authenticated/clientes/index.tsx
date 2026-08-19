import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { CLIENTES } from "@/lib/ces-data";
import { clasificarContrato, resumenContratos } from "@/lib/contratos";
import { Building2, AlertTriangle, ClipboardList, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clientes/")({
    component: ClientesPage,
    head: () => ({ meta: [{ title: "Clientes — CES SIG" }] }),
});

const CLIENTE_LOGO: Record<string, string> = {
    "CONCONCRETO": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Concocreto.png",
    "GRUPO RECORDAR": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Grupo%20Recordar.png",
    "INCOLMOTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Incolmotos.png",
    "INDUPALMA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LOGO_INDUPALMA.png",
    "INGENIO CARMELITA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/carmelita.png",
    "INGENIO RISARALDA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/INGENIORISARALDALOGO.png",
    "LEVAPAN": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LevapanLogo.png",
    "NUTRESA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/NUTRESALOGO.png",
    "PROTELA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/PROTELA.png",
    "SURTIALIMENTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/SURTIALIAMENTOSLOGO.png",
};

function clienteLogo(nombre: string) {
    return CLIENTE_LOGO[String(nombre || "").trim().toUpperCase()];
}

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

    // Un cliente "Activo" con al menos un contrato vencido es una inconsistencia que vale la pena
    // señalar; si TODOS sus contratos están vencidos, "Activo" ya ni siquiera describe la realidad —
    // en ese caso se reemplaza el badge en vez de solo advertir debajo.
    const clientesConAlgunContratoVencido = new Set(
        clientes.filter((c) => c.estado === "Activo" && (c.contratos || []).some((ct) => clasificarContrato(ct) === "vencido")).map((c) => c.id),
    );
    const clientesConTodoVencido = new Set(
        clientes
            .filter((c) => c.estado === "Activo" && (c.contratos || []).length > 0 && (c.contratos || []).every((ct) => clasificarContrato(ct) === "vencido"))
            .map((c) => c.id),
    );

    const slides: CoverflowSlide[] = clientes.map((c, i) => {
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

            <h2 className="mt-10 text-lg font-semibold">Clientes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Arrastra o usa las flechas para recorrerlos — el panel de abajo muestra el detalle del que quede al centro.</p>
            <div className="mt-2">
                <CoverflowCarousel
                    slides={slides}
                    showCaption
                    showPagination
                    showNavigation
                    label="Clientes CES"
                />
            </div>
        </div>
    );
}
