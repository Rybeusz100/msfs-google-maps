import BaseMap from './baseMap';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom';
import { Icon, Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import Position from '../lib/position';
import { degToRad } from '../lib/utils';
import LineString from 'ol/geom/LineString';

export default class OpenStreetMap extends BaseMap {
    map!: Map;
    planeMarker!: Feature<Point>;
    planeStyle!: Style;
    routeLayer!: VectorLayer<VectorSource<LineString>>;
    lastSegmentPoints!: number;
    prevFeature!: Feature<LineString>;

    constructor(followOn: boolean, showRouteOn: boolean) {
        super(followOn, showRouteOn);

        this.createMap();
        this.createRouteLayer();
        this.createMarker();

        this.map.on('pointerdrag', () => {
            this.pauseFollow();
        });

        this.updateIntervalID = window.setInterval(() => this.update(), 1000);
    }

    createRouteLayer() {
        this.routeLayer = new VectorLayer({
            source: new VectorSource(),
        });

        this.lastSegmentPoints = 0;

        this.map.addLayer(this.routeLayer);
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

        this.map.addLayer(vectorLayer);
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

            this.planeMarker.getGeometry()?.setCoordinates(fromLonLat([this.position.lon, this.position.lat]));
            this.planeStyle.getImage().setRotation(degToRad(this.position.hdg));

            if (this.followOn && !this.followPaused) {
                this.map.getView().setCenter(fromLonLat([this.position.lon, this.position.lat]));
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
                    this.updateVisualRoute();
                });
                this.updatePosition();
            }
        });
    }

    clearRoute() {
        this.route = [];
        this.routeLayer.getSource()?.forEachFeature((f) => {
            this.routeLayer.getSource()?.removeFeature(f);
        });
    }

    updateVisualRoute() {
        const breakDiff = 300;
        let current = this.route.at(-1)!;
        let routeStyle: any;

        if (this.route.length === 1) {
            this.lastSegmentPoints = 1;
            routeStyle = new Style({
                stroke: new Stroke({
                    width: 5,
                    color: this.getColor(current.alt),
                }),
            });
        } else {
            let previous = this.route.at(-2)!;

            if (Math.floor(previous.alt / breakDiff) === Math.floor(current.alt / breakDiff)) {
                this.lastSegmentPoints += 1;
                routeStyle = this.prevFeature.getStyle();
                this.routeLayer.getSource()?.removeFeature(this.prevFeature);
            } else {
                this.lastSegmentPoints = 2;
                routeStyle = new Style({
                    stroke: new Stroke({
                        width: 5,
                        color: this.getColor(current.alt),
                    }),
                });
            }
        }

        let path = this.route.slice(-this.lastSegmentPoints).map((el) => [el.lon, el.lat]);
        let polyline = new LineString(path);
        polyline.transform('EPSG:4326', 'EPSG:3857');
        let feature = new Feature(polyline);
        feature.setStyle(routeStyle);
        this.prevFeature = feature;
        this.routeLayer.getSource()?.addFeature(feature);
    }

    toggleRoute() {
        this.routeLayer.setVisible(this.showRouteOn ? true : false);
    }
}
