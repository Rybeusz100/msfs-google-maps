import { API_URL } from './constants';

export function getApiKey() {
    let req = new XMLHttpRequest();
    try {
        req.open('GET', API_URL + '/api_key', false);
        req.send(null);
        if (req.status === 200) {
            return req.responseText;
        } else {
            return '';
        }
    } catch {
        return '';
    }
}

export function shutdown() {
    let req = new XMLHttpRequest();
    try {
        req.open('GET', API_URL + '/shutdown', false);
        req.send(null);
    } catch {}
}

export function resetRoute() {
    let req = new XMLHttpRequest();
    try {
        req.open('GET', `${API_URL}/reset`);
        req.send(null);
    } catch {}
}

export function lerpColor(a: number, b: number, amount: number) {
    const ar = (a & 0xff0000) >> 16,
        ag = (a & 0x00ff00) >> 8,
        ab = a & 0x0000ff,
        br = (b & 0xff0000) >> 16,
        bg = (b & 0x00ff00) >> 8,
        bb = b & 0x0000ff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return (rr << 16) + (rg << 8) + (rb | 0);
}

export function hexToColor(a: number) {
    return `#${a.toString(16).padStart(6, '0').slice(-6)}`;
}

export function degToRad(deg: number) {
    return deg * (Math.PI / 180.0);
}

export function createElementWithId(type: string, id: string) {
    const el = document.createElement(type);
    el.id = id;
    return el;
}
