import BaseMap from './baseMap';
import { Feature, Map, MapBrowserEvent, Overlay, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom';
import { Icon, Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { createElementWithId, degToRad } from '../lib/utils';
import LineString from 'ol/geom/LineString';

export default class OpenStreetMap extends BaseMap {
    map!: Map;
    planeMarker!: Feature<Point>;
    planeStyle!: Style;
    airportsLayer!: VectorLayer<VectorSource<Point>>;
    routeLayer!: VectorLayer<VectorSource<LineString>>;
    lastSegmentPoints!: number;
    prevFeature!: Feature<LineString>;
    popup!: Overlay;
    hitTolerance: number = 7;

    constructor(followOn: boolean, showRouteOn: boolean) {
        super(followOn, showRouteOn);

        this.createMap();
        this.createRouteLayer();
        this.createAirportsLayer();
        this.createMarker();
        this.createPopup();

        this.map.on('pointerdrag', () => {
            this.pauseFollow();
        });

        this.map.on('click', (e) => this.displayPopup(e));
        this.map.on('pointermove', (e) => this.onPointerMove(e));

        this.updateIntervalID = window.setInterval(() => this.updateRoute(), 1000);
    }

    createAirportsLayer() {
        this.airportsLayer = new VectorLayer({
            source: new VectorSource(),
        });
        this.map.addLayer(this.airportsLayer);
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

    createPopup() {
        const osmPopup = createElementWithId('div', 'OSM-popup');
        const osmPopupClose = createElementWithId('button', 'OSM-popup-close');
        osmPopupClose.innerText = 'x';
        osmPopupClose.onclick = () => this.hidePopup();
        const osmPopupData = createElementWithId('div', 'OSM-popup-data');
        osmPopup.appendChild(osmPopupClose);
        osmPopup.appendChild(osmPopupData);

        document.getElementById('map')!.appendChild(osmPopup);

        this.popup = new Overlay({
            element: document.getElementById('OSM-popup')!,
            positioning: 'bottom-center',
            stopEvent: true,
        });
        this.map.addOverlay(this.popup);
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
        this.clearAirports();
        this.getAirports(this.position.lat, this.position.lon, radius, (airports) => {
            airports.forEach((airport) => {
                const marker = new Feature({
                    geometry: new Point(fromLonLat([airport.longitude_deg, airport.latitude_deg])),
                    name: `<h2>${airport.name}</h2><b>${
                        airport.ident
                    }<br>${airport.type.replace('_', ' ')}<div id="dynamic-airport-data"></div></b>`,
                    airport: airport,
                });
                const markerStyle = new Style({
                    image: new Icon({
                        scale: 0.7,
                        src: `/images/${airport.type}.png`,
                    }),
                });
                marker.setStyle(markerStyle);

                this.airportsLayer.getSource()?.addFeature(marker);
            });
        });
    }

    clearAirports() {
        this.airportsLayer.getSource()?.forEachFeature((f) => {
            this.airportsLayer.getSource()?.removeFeature(f);
        });
        this.hidePopup();
    }

    displayPopup(e: MapBrowserEvent<any>) {
        const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f, {
            hitTolerance: this.hitTolerance,
        });
        if (feature && feature.getGeometry()?.getType() === 'Point' && feature.getProperties().name) {
            this.popup.setPosition((feature.getGeometry() as Point).getCoordinates());
            this.updatePopupData(feature.getProperties().name);
            this.popup.getElement()!.style.display = '';
            this.selectedAirport = feature.getProperties().airport;
            this.updateSelectedAirportData();
        }
    }

    onPointerMove(e: MapBrowserEvent<any>) {
        const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f, {
            hitTolerance: this.hitTolerance,
        });
        document.getElementById('map')!.style.cursor = feature?.getProperties().name ? 'pointer' : '';
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

    clearRoute() {
        this.route = [];
        this.routeLayer.getSource()?.forEachFeature((f) => {
            this.routeLayer.getSource()?.removeFeature(f);
        });
    }

    updateVisualRoute() {
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

            if (Math.floor(previous.alt / this.colorBreakDiff) === Math.floor(current.alt / this.colorBreakDiff)) {
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

    updateSelectedAirportDisplayedData(toReplace: string) {
        (document.getElementById('dynamic-airport-data') as HTMLDivElement).innerHTML = toReplace;
    }

    updatePopupData(toReplace: string) {
        (document.getElementById('OSM-popup-data') as HTMLDivElement).innerHTML = toReplace;
    }

    hidePopup() {
        this.popup.getElement()!.style.display = 'none';
    }
}
