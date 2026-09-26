/**
 * The quiz draft and the completed result live in sessionStorage, not in a store: the
 * result is only ever returned by the POST and is never re-fetched, so a direct visit to
 * /result with no session has nothing to show. That is deliberate — see Result's empty
 * state. Private-mode browsers can disable storage entirely, so every access is guarded
 * and the flow still works without it.
 */

/** `falsy -> fallback`, matching the old `JSON.parse(...) || fallback`. */
export const readSession = <T>(key: string, fallback: T): T => {
    try {
        const raw = sessionStorage.getItem(key);
        return (raw === null ? null : (JSON.parse(raw) as T)) || fallback;
    } catch {
        return fallback;
    }
};

export const writeSession = (key: string, value: unknown): void => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* Private browsers can disable storage; the current flow still works. */
    }
};

export const SESSION_KEYS = {
    draft: 'claryeo-quiz',
    result: 'claryeo-result',
} as const;
