import { hexToColor, lerpColor } from '../lib/utils';
import { API_URL, colorAltMap } from '../lib/constants';
import type { IAirport, IResponseRoute } from '../lib/interfaces';
import Position from '../lib/position';
import { headingDistanceTo } from 'geolocation-utils';

export default abstract class BaseMap {
    readonly initialZoom = 10;
    mapElement: HTMLDivElement;
    position: Position;
    route: Position[];
    followOn: boolean;
    followPaused: boolean;
    followResumeTimeoutID?: number;
    showRouteOn: boolean;
    routeID: string;
    updateTimeoutID?: number;
    colorBreakDiff = 300;
    selectedAirport?: IAirport;

    constructor(followOn: boolean, showRouteOn: boolean) {
        this.mapElement = document.getElementById('map') as HTMLDivElement;
        this.position = new Position(0, 0, 0, 0);
        this.route = [];
        this.followOn = followOn;
        this.followPaused = false;
        this.showRouteOn = showRouteOn;
        this.routeID = '';
    }

    removeMap() {
        window.clearTimeout(this.updateTimeoutID);
        window.clearTimeout(this.followResumeTimeoutID);
        const map = document.getElementById('map');
        if (map) {
            const parent = map.parentNode;
            if (parent) {
                map.remove();
                const newMap = document.createElement('div');
                newMap.id = 'map';
                parent.appendChild(newMap);
            }
        }
    }

    setFollow(followOn: boolean) {
        this.followOn = followOn;
        if (followOn) {
            this.followPaused = false;
        }
    }

    setShowRoute(showRouteOn: boolean) {
        this.showRouteOn = showRouteOn;
        this.toggleRoute();
    }

    getAirports(lat: number, lon: number, radius: number, callback: (a: IAirport[]) => void) {
        fetch(API_URL + `/airports/${lat}/${lon}/${radius}`)
            .then(async (response) => {
                if (response.ok) {
                    const airports: IAirport[] = await response.json();
                    callback(airports);
                }
            })
            .catch(() => {
                /* empty */
            });
    }

    getColor(alt: number): string {
        for (const [i, el] of colorAltMap.entries()) {
            if (alt < el.alt) {
                if (i === 0) {
                    return hexToColor(el.color);
                }
                return hexToColor(
                    lerpColor(
                        colorAltMap[i - 1].color,
                        el.color,
                        (alt - colorAltMap[i - 1].alt) / (el.alt - colorAltMap[i - 1].alt),
                    ),
                );
            }
        }

        return hexToColor(colorAltMap[colorAltMap.length - 1].color);
    }

    pauseFollow() {
        this.followPaused = true;
        window.clearTimeout(this.followResumeTimeoutID);
        this.followResumeTimeoutID = window.setTimeout(() => {
            this.followPaused = false;
        }, 5000);
    }

    updateRoute() {
        fetch(API_URL + `/position/${this.route.length}`)
            .then(async (response) => {
                if (response.ok) {
                    const route: IResponseRoute = await response.json();
                    if (this.routeID !== route.id) {
                        this.routeID = route.id;
                        this.clearRoute();
                    }
                    route.points.forEach((point) => {
                        const pos = new Position(point.lat, point.lon, point.alt, point.hdg);
                        this.route.push(pos);

                        this.updateVisualRoute();
                    });
                    this.updatePosition();
                    this.updateSelectedAirportData();
                }
            })
            .catch(() => {
                /* empty */
            })
            .finally(() => {
                this.updateTimeoutID = setTimeout(() => this.updateRoute(), 500);
            });
    }

    updateSelectedAirportData() {
        if (!this.selectedAirport) return;
        const data = headingDistanceTo(this.position, {
            lat: this.selectedAirport.latitude_deg,
            lon: this.selectedAirport.longitude_deg,
        });
        const heading = data.heading < 0 ? data.heading + 360 : data.heading;
        const distance = data.distance / 1000;
        const toReplace = `heading: ${Math.floor(heading)}°
        <br>distance: ${distance.toFixed(3)} km`;
        this.updateSelectedAirportDisplayedData(toReplace);
    }

    updateSelectedAirportDisplayedData(toReplace: string) {
        const el = document.getElementById('dynamic-airport-data');
        if (el) {
            el.innerHTML = toReplace;
        }
    }

    abstract markAirports(radius: number): void;
    abstract clearAirports(): void;

    abstract updatePosition(): void;
    abstract updateVisualRoute(): void;
    abstract clearRoute(): void;
    abstract toggleRoute(): void;
}
