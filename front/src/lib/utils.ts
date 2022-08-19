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
