import { API_URL } from './constants';
import { ManagementCommand } from './enums';

export async function getApiKey() {
    try {
        const response = await fetch(API_URL + '/api_key');
        if (response.ok) {
            return response.text();
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        console.error('Error retrieving API key:', error);
    }
    return null;
}

export function management(command: ManagementCommand) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            command: command,
        }),
    };

    fetch(API_URL + '/management', options);
}

export async function getMaptilerConfig(): Promise<MaptilerConfig> {
    try {
        const response = await fetch(API_URL + '/maptiler_config');
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        console.error('Error retrieving Maptiler config:', error);
    }
    return {};
}

export interface MaptilerConfig {
    apiKey?: string;
    styleId?: string;
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

export function createElementWithId<T extends keyof HTMLElementTagNameMap>(type: T, id: string) {
    const el = document.createElement(type);
    el.id = id;
    return el;
}
