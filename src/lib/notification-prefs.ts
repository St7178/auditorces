export type NotifTipo = "contrato" | "riesgo" | "documento" | "hallazgo";

const STORAGE_KEY = "ces-notif-prefs";
const DEFAULT_PREFS: Record<NotifTipo, boolean> = { contrato: true, riesgo: true, documento: true, hallazgo: true };
export const PREFS_CHANGED_EVENT = "ces-notif-prefs-changed";

export function getNotifPrefs(): Record<NotifTipo, boolean> {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
        return DEFAULT_PREFS;
    }
}

export function setNotifPref(tipo: NotifTipo, enabled: boolean) {
    const prefs = { ...getNotifPrefs(), [tipo]: enabled };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event(PREFS_CHANGED_EVENT));
}

// Notificaciones leídas: los ids son deterministas (derivados del dato real, ej. "riesgo-R-01"), así
// que una vez marcada como leída se mantiene así entre visitas mientras esa notificación exista.
const READ_STORAGE_KEY = "ces-notif-read";
export const READ_CHANGED_EVENT = "ces-notif-read-changed";

export function getReadNotifIds(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
        const raw = window.localStorage.getItem(READ_STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

export function markNotifRead(id: string) {
    const ids = getReadNotifIds();
    if (ids.has(id)) return;
    ids.add(id);
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new Event(READ_CHANGED_EVENT));
}
