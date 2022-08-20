export interface IAirport {
    wikipedia_link: string;
    type: string;
    scheduled_service: string;
    name: string;
    municipality: string;
    longitude_deg: number;
    local_code: string;
    latitude_deg: number;
    keywords: string;
    iso_region: string;
    iso_country: string;
    ident: string;
    id: number;
    iata_code: string;
    home_link: string;
    gps_code: string;
    elevation_ft: number;
    continent: string;
}

export interface IPosition {
    lat: number;
    lon: number;
    alt: number;
    hdg: number;
}

export interface IResponseRoute {
    id: string;
    points: IPosition[];
}

export interface ISVGMarker {
    path: string;
    fillColor: string;
    fillOpacity: number;
    strokeWeight: number;
    rotation: number;
    scale: number;
    anchor: google.maps.Point;
}

export interface IColorAlt {
    color: number;
    alt: number;
}
