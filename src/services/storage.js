const SCOPED_KEYS = [
    'visited',
    'discovered',
    'chat_history',
    'solved_riddle'
];

export function getScopedKey(name, mode = 'visitor') {
    const allowedModes = new Set(['demo', 'visitor', 'admin']);
    const safeMode = allowedModes.has(mode) ? mode : 'visitor';
    return `jejak_${safeMode}_${name}`;
}

export function readScopedJSON(name, fallback, mode) {
    try {
        const raw = localStorage.getItem(getScopedKey(name, mode));
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeScopedJSON(name, value, mode) {
    localStorage.setItem(getScopedKey(name, mode), JSON.stringify(value));
}

export function readScopedNumber(name, fallback, mode) {
    const raw = localStorage.getItem(getScopedKey(name, mode));
    const parsed = Number.parseInt(raw || '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function writeScopedNumber(name, value, mode) {
    localStorage.setItem(getScopedKey(name, mode), String(value));
}

export function readScopedString(name, fallback, mode) {
    return localStorage.getItem(getScopedKey(name, mode)) || fallback;
}

export function writeScopedString(name, value, mode) {
    localStorage.setItem(getScopedKey(name, mode), String(value));
}

export function clearScopedProgress(mode = 'demo') {
    SCOPED_KEYS.forEach(name => localStorage.removeItem(getScopedKey(name, mode)));
}
