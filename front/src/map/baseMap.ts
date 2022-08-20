import { hexToColor, lerpColor } from '../lib/utils';
import { API_URL, colorAltMap } from '../lib/constants';
import type { IAirport, IResponseRoute } from '../lib/interfaces';
import Position from '../lib/position';

export default abstract class BaseMap {
    position: Position;
    route: Position[];
    followOn: boolean;
    showRouteOn: boolean;
    routeID: string;

    constructor(followOn: boolean, showRouteOn: boolean) {
        this.position = new Position(0, 0, 0, 0);
        this.route = [];
        this.followOn = followOn;
        this.showRouteOn = showRouteOn;
        this.routeID = '';
    }

    removeMap() {
        let map = document.getElementById('map');
        if (map) {
            let parent = map.parentNode;
            if (parent) {
                map.remove();
                let newMap = document.createElement('div');
                newMap.id = 'map';
                parent.appendChild(newMap);
            }
        }
    }

    setFollow(followOn: boolean) {
        this.followOn = followOn;
    }

    setShowRoute(showRouteOn: boolean) {
        this.showRouteOn = showRouteOn;
        this.toggleRoute();
    }

    getAirports(lat: number, lon: number, radius: number, callback: (a: IAirport[]) => void) {
        let req = new XMLHttpRequest();
        try {
            req.open('GET', `${API_URL}/airports/${lat}/${lon}/${radius}`);
            req.onload = () => {
                let airports: IAirport[] = JSON.parse(req.responseText);
                callback(airports);
            };
            req.send(null);
        } catch {}
    }

    getRoutePoints(knownCount: number, callback: (route: IResponseRoute) => void) {
        let req = new XMLHttpRequest();
        try {
            req.open('GET', `${API_URL}/position/${knownCount}`);
            req.onload = () => {
                let response: IResponseRoute = JSON.parse(req.responseText);
                callback(response);
            };
            req.send(null);
        } catch {}
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

        return hexToColor(colorAltMap.at(-1)!.color);
    }

    abstract createMap(): void;
    abstract markAirports(radius: number): void;
    abstract clearAirports(): void;

    abstract update(): void;
    abstract updatePosition(): void;
    abstract updateRoute(): void;
    abstract clearRoute(): void;
    abstract toggleRoute(): void;
}
