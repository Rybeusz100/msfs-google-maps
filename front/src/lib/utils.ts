import { API_URL } from './constants';
import type { Airport } from './interfaces';

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

export function getAirports(lat: number, lon: number, radius: number, callback: (a: Airport[]) => void) {
    let req = new XMLHttpRequest();
    try {
        req.open('GET', `${API_URL}/airports/${lat}/${lon}/${radius}`);
        req.onload = () => {
            let airports: Airport[] = JSON.parse(req.responseText);
            callback(airports);
        };
        req.send(null);
    } catch {
        callback([]);
    }
}
