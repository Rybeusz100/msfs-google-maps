import type { IColorAlt } from './interfaces';

export const API_URL = import.meta.env.MODE === 'development' ? 'http://localhost:8054' : '.';
export const VERSION = 'v1.1.0';

export const colorAltMap: IColorAlt[] = [
    { color: 0xffffff, alt: 328 },
    { color: 0xffff00, alt: 1000 },
    { color: 0x00ff00, alt: 8200 },
    { color: 0x00ffff, alt: 20000 },
    { color: 0x0000ff, alt: 40000 },
    { color: 0xff0000, alt: 50000 },
];
