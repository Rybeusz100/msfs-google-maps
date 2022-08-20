import BaseMap from './baseMap';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

export default class OpenStreetMap extends BaseMap {
    map?: Map;

    constructor(followOn: boolean, showRouteOn: boolean) {
        super(followOn, showRouteOn);
        this.createMap();
    }

    createMap() {
        this.map = new Map({
            target: 'map',
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 3,
            }),
        });
    }

    markAirports(radius: number) {
        throw new Error('Method not implemented.');
    }

    clearAirports() {
        throw new Error('Method not implemented.');
    }

    update() {
        throw new Error('Method not implemented.');
    }

    updatePosition() {
        throw new Error('Method not implemented.');
    }

    updateRoute() {
        throw new Error('Method not implemented.');
    }

    clearRoute() {
        throw new Error('Method not implemented.');
    }

    toggleRoute() {
        throw new Error('Method not implemented.');
    }
}
