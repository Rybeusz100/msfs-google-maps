import BaseMap from './baseMap';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import Position from '../lib/position';
import { degToRad } from '../lib/utils';

export default class OpenStreetMap extends BaseMap {
    map?: Map;
    planeMarker?: Feature<Point>;
    planeStyle?: Style;

    constructor(followOn: boolean, showRouteOn: boolean) {
        super(followOn, showRouteOn);

        this.createMap();
        this.createMarker();

        this.map?.on('pointerdrag', () => {
            this.pauseFollow();
        });

        this.updateIntervalID = window.setInterval(() => this.update(), 1000);
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

    createMarker() {
        this.planeMarker = new Feature({
            geometry: new Point(fromLonLat([0, 0])),
        });

        this.planeStyle = new Style({
            image: new Icon({
                scale: 0.2,
                src: '/images/plane.png',
                rotateWithView: true,
            }),
        });

        this.planeMarker.setStyle(this.planeStyle);

        const vectorSource = new VectorSource({
            features: [this.planeMarker],
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
        });

        this.map?.addLayer(vectorLayer);
    }

    markAirports(radius: number) {
        throw new Error('Method not implemented.');
    }

    clearAirports() {
        throw new Error('Method not implemented.');
    }

    update() {
        this.updateRoute();
    }

    updatePosition() {
        if (typeof this.route.at(-1) !== 'undefined') {
            this.position = this.route.at(-1)!;

            this.planeMarker?.getGeometry()?.setCoordinates(fromLonLat([this.position.lon, this.position.lat]));
            this.planeStyle?.getImage().setRotation(degToRad(this.position.hdg));

            if (this.followOn && !this.followPaused) {
                this.map?.getView().setCenter(fromLonLat([this.position.lon, this.position.lat]));
            }
        }
    }

    updateRoute() {
        this.getRoutePoints(this.route.length, (resRoute) => {
            if (this.routeID !== resRoute.id) {
                this.routeID = resRoute.id;
                this.clearRoute();
            } else {
                resRoute.points.forEach((point) => {
                    let pos = new Position(point.lat, point.lon, point.alt, point.hdg);
                    this.route.push(pos);
                });
                this.updatePosition();
            }
        });
    }

    clearRoute() {
        this.route = [];
    }

    toggleRoute() {
        throw new Error('Method not implemented.');
    }
}
