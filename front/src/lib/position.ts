import type { IPosition } from './interfaces';

export default class Position implements IPosition {
    lat: number;
    lon: number;
    alt: number;
    hdg: number;

    constructor(lat: number, lon: number, alt: number, hdg: number) {
        this.lat = lat;
        this.lon = lon;
        this.alt = alt;
        this.hdg = hdg;
    }
}
