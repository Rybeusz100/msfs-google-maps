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
    popupElement!: HTMLDivElement;
    popupCloseElement!: HTMLButtonElement;
    popupDataElement!: HTMLDivElement;

    hitTolerance = 7;

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
                zoom: this.initialZoom,
            }),
        });
    }

    createPopup() {
        this.popupElement = createElementWithId('div', 'OSM-popup');

        this.popupCloseElement = createElementWithId('button', 'OSM-popup-close');
        this.popupCloseElement.innerText = 'x';
        this.popupCloseElement.onclick = () => this.hidePopup();

        this.popupDataElement = createElementWithId('div', 'OSM-popup-data');

        this.popupElement.appendChild(this.popupCloseElement);
        this.popupElement.appendChild(this.popupDataElement);

        document.getElementById('map')?.appendChild(this.popupElement);

        this.popup = new Overlay({
            element: this.popupElement,
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
                    name: `<h2>${airport.name}</h2><b>${airport.ident}<br>${airport.type.replace(
                        '_',
                        ' ',
                    )}<div id="dynamic-airport-data"></div></b>`,
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

    displayPopup(e: MapBrowserEvent<UIEvent>) {
        const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f, {
            hitTolerance: this.hitTolerance,
        });
        if (feature && feature.getGeometry()?.getType() === 'Point' && feature.getProperties().name) {
            this.popup.setPosition((feature.getGeometry() as Point).getCoordinates());
            this.updatePopupData(feature.getProperties().name);
            this.popupElement.style.display = '';
            this.selectedAirport = feature.getProperties().airport;
            this.updateSelectedAirportData();
        }
    }

    onPointerMove(e: MapBrowserEvent<UIEvent>) {
        const feature = this.map.forEachFeatureAtPixel(e.pixel, (f) => f, {
            hitTolerance: this.hitTolerance,
        });
        this.mapElement.style.cursor = feature?.getProperties().name ? 'pointer' : '';
    }

    updatePosition() {
        const pos = this.route.at(-1);
        if (!pos) {
            return;
        }

        this.position = pos;

        this.planeMarker.getGeometry()?.setCoordinates(fromLonLat([this.position.lon, this.position.lat]));
        this.planeStyle.getImage().setRotation(degToRad(this.position.hdg));

        if (this.followOn && !this.followPaused) {
            this.map.getView().setCenter(fromLonLat([this.position.lon, this.position.lat]));
        }
    }

    clearRoute() {
        this.route = [];
        this.routeLayer.getSource()?.forEachFeature((f) => {
            this.routeLayer.getSource()?.removeFeature(f);
        });
    }

    updateVisualRoute() {
        const current = this.route.at(-1);
        if (!current) {
            return;
        }
        let routeStyle: Style;

        if (this.route.length === 1) {
            this.lastSegmentPoints = 1;
            routeStyle = new Style({
                stroke: new Stroke({
                    width: 5,
                    color: this.getColor(current.alt),
                }),
            });
        } else {
            const previous = this.route.at(-2);
            if (!previous) {
                return;
            }

            if (Math.floor(previous.alt / this.colorBreakDiff) === Math.floor(current.alt / this.colorBreakDiff)) {
                this.lastSegmentPoints += 1;
                routeStyle = this.prevFeature.getStyle() as Style;
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

        const path = this.route.slice(-this.lastSegmentPoints).map((el) => [el.lon, el.lat]);
        const polyline = new LineString(path);
        polyline.transform('EPSG:4326', 'EPSG:3857');
        const feature = new Feature(polyline);
        feature.setStyle(routeStyle);
        this.prevFeature = feature;
        this.routeLayer.getSource()?.addFeature(feature);
    }

    toggleRoute() {
        this.routeLayer.setVisible(this.showRouteOn ? true : false);
    }

    updatePopupData(toReplace: string) {
        this.popupDataElement.innerHTML = toReplace;
    }

    hidePopup() {
        this.popupElement.style.display = 'none';
    }
}
