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
