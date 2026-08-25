// Sin quitar tildes, "Andrés Cano" y "Andres Cano" no calzan y un cruce por nombre falla en
// silencio (ver /equipo y el filtro por responsable en /clientes).
export function normalizeName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}
