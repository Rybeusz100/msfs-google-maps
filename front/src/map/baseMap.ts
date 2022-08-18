import type Position from '../lib/position';

export default abstract class BaseMap {
    position: Position;
    route: Position[];
    followOn: boolean;
    showRouteOn: boolean;

    constructor(position: Position, route: Position[], followOn: boolean, showRouteOn: boolean) {
        this.position = position;
        this.route = route;
        this.followOn = followOn;
        this.showRouteOn = showRouteOn;
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
    }

    abstract createMap(): void;
    abstract markAirports(radius: number): void;
    abstract clearAirports(): void;
}
