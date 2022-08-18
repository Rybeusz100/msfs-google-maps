export default class Position {
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
