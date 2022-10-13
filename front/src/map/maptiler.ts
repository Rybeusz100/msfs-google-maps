import BaseMap from './baseMap';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import {
    config,
    GeoJSONSource,
    GeoJSONSourceSpecification,
    IControl,
    Language,
    Map,
    Marker,
    Popup,
} from '@maptiler/sdk';
import { Map as MaplibreMap } from 'maplibre-gl';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { IAirport } from '../lib/interfaces';
import { MaptilerConfig } from '../lib/utils';

const routeSourceId = 'route';
const routeLayerId = 'route';
const contourLayerIds = ['contour_index', 'contour', 'contour_label', 'contour_label-glacier'];

export default class Maptiler extends BaseMap {
    private readonly map: Map;
    private readonly planeMarker: Marker;
    private readonly routeFeatureCollection: FeatureCollection<LineString> = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {},
                geometry: {
                    coordinates: [],
                    type: 'LineString',
                },
            },
        ],
    };

    private airportPopup: Popup | undefined;

    constructor(followOn: boolean, showRouteOn: boolean, maptilerConfig: MaptilerConfig) {
        super(followOn, showRouteOn);

        checkConfig(maptilerConfig);

        this.map = new Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/${maptilerConfig.styleId}/style.json`,
            center: [0, 0],
            zoom: this.initialZoom,
            terrain: false,
            terrainControl: false,
            geolocateControl: false,
            language: Language.LATIN,
        });

        this.loadImages(this.map);

        this.map.addControl(new ToggleContourControl(), 'top-right');

        this.map.on('drag', () => {
            this.pauseFollow();
        });

        // add layers
        this.map.onLoadAsync().then((map) => {
            this.addRouteLayer(map);
            this.addAirportsLayer(map);

            // must only be called after layers are initialized
            this.updateRoute();
        });

        // add plane marker
        const planeMarkerElement = document.createElement('div');
        planeMarkerElement.id = 'maptiler-plane';
        document.getElementById('map')?.appendChild(planeMarkerElement);

        this.planeMarker = new Marker(planeMarkerElement)
            .setLngLat([0, 0])
            .setPitchAlignment('map')
            .setRotationAlignment('map')
            .addTo(this.map);
    }

    private addRouteLayer(map: Map) {
        map.addSource(routeSourceId, {
            type: 'geojson',
            lineMetrics: true,
            data: this.routeFeatureCollection,
        } as GeoJSONSourceSpecification);

        map.addLayer({
            type: 'line',
            source: routeSourceId,
            id: routeLayerId,
            paint: {
                'line-color': 'red',
                'line-width': 5,
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
        });
    }

    private addAirportsLayer(map: Map) {
        map.addSource('airports', {
            type: 'geojson',
            data: createAirportsFeatureCollection([]),
        } as GeoJSONSourceSpecification);

        map.addLayer({
            type: 'symbol',
            source: 'airports',
            id: 'airports',
            paint: {},
            layout: {
                'icon-image': ['get', 'type'],
                'icon-size': 0.7,
                'icon-overlap': 'always',
                'icon-allow-overlap': true,
            },
        });

        map.on('click', 'airports', (e) => {
            const feature: undefined | Feature<Point, IAirport> =
                e.features && (e.features[0] as Feature<Point, IAirport>);
            if (feature) {
                const coordinates = feature.geometry.coordinates.slice();
                const airport = feature.properties;
                this.selectedAirport = airport;
                this.updateSelectedAirportData();

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                this.airportPopup = new Popup()
                    .setLngLat({ lng: coordinates[0], lat: coordinates[1] })
                    .setHTML(
                        `<h2>${airport.name}</h2><b>${airport.ident}<br>${airport.type.replace(
                            '_',
                            ' ',
                        )}<div id="dynamic-airport-data"></div></b>`,
                    )
                    .addTo(this.map);
            }
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'airports', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'airports', () => {
            map.getCanvas().style.cursor = '';
        });
    }

    private loadImages(map: Map) {
        function loadAirportImage(type: string) {
            map.loadImage(`/images/${type}.png`, async function (error, image) {
                if (error) throw error;
                if (image) {
                    map.addImage(type, image);
                }
            });
        }

        loadAirportImage('balloonport');
        loadAirportImage('closed');
        loadAirportImage('heliport');
        loadAirportImage('large_airport');
        loadAirportImage('medium_airport');
        loadAirportImage('seaplane_base');
        loadAirportImage('small_airport');
    }

    clearAirports(): void {
        const source = this.map.getSource('airports') as GeoJSONSource | undefined;
        if (source) {
            source.setData(createAirportsFeatureCollection([]));
        }

        if (this.airportPopup) {
            this.airportPopup.remove();
            this.airportPopup = undefined;
        }
    }

    clearRoute(): void {
        this.route = [];
        this.routeFeatureCollection.features[0].geometry.coordinates = [];
        const source = this.map.getSource(routeSourceId) as GeoJSONSource | undefined;
        if (source) {
            source.setData(this.routeFeatureCollection);
        }
    }

    markAirports(radius: number): void {
        this.clearAirports();
        this.getAirports(this.position.lat, this.position.lon, radius, (airports) => {
            const source = this.map.getSource('airports') as GeoJSONSource | undefined;
            if (source) {
                source.setData(createAirportsFeatureCollection(airports));
            }
        });
    }

    toggleRoute(): void {
        const routeLayer = this.map.getLayer(routeLayerId);
        if (routeLayer) {
            routeLayer.visibility = this.showRouteOn ? 'visible' : 'none';
        }
    }

    updatePosition(): void {
        const lastRouteLocation = this.route.at(-1);
        if (lastRouteLocation) {
            this.position = lastRouteLocation;

            this.planeMarker.setLngLat({ lng: this.position.lon, lat: this.position.lat });
            this.planeMarker.setRotation(this.position.hdg);

            if (this.followOn && !this.followPaused) {
                this.map.panTo({ lng: this.position.lon, lat: this.position.lat });
            }
        }
    }

    updateSelectedAirportDisplayedData(toReplace: string) {
        if (this.airportPopup && this.airportPopup.isOpen()) {
            const currentInfo = this.airportPopup.getElement().innerHTML;
            this.airportPopup.getElement().innerHTML = currentInfo
                ?.toString()
                .replace(/<div id="dynamic-airport-data">[\s\S]*?<\/div>/, toReplace);
        }
    }

    updateVisualRoute(): void {
        const current = this.route.at(-1);

        if (current) {
            this.routeFeatureCollection.features[0].geometry.coordinates.push([current.lon, current.lat, current.alt]);
            const source = this.map.getSource(routeSourceId) as GeoJSONSource | undefined;
            if (source) {
                source.setData(this.routeFeatureCollection);
            }
        }
    }
}

class ToggleContourControl implements IControl {
    private _container: HTMLElement | undefined;

    onAdd(map: MaplibreMap): HTMLElement {
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        const button = document.createElement('button');
        this._container.appendChild(button);
        button.className = 'maplibregl-ctrl-terrain';
        button.title = 'Toggle altitude lines';
        button.type = 'button';

        const span = document.createElement('span');
        button.appendChild(span);
        span.className = 'maplibregl-ctrl-icon';
        span.ariaHidden = 'true';

        button.onclick = () => {
            const visibility =
                map.getLayoutProperty(contourLayerIds[0], 'visibility') === 'visible' ? 'none' : 'visible';

            contourLayerIds.forEach((layerId) => {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            });
        };

        return this._container;
    }

    onRemove(): void {
        this._container?.parentNode?.removeChild(this._container);
        this._container = undefined;
    }
}

function createAirportsFeatureCollection(airports: IAirport[]): FeatureCollection<Point, IAirport> {
    const features: Feature[] = airports.map((it) => ({
        type: 'Feature',
        properties: it,
        geometry: {
            coordinates: [it.longitude_deg, it.latitude_deg],
            type: 'Point',
        },
    }));

    return {
        type: 'FeatureCollection',
        features: features,
    } as FeatureCollection<Point, IAirport>;
}

function checkConfig(maptilerConfig: MaptilerConfig) {
    function showWarningMessage(message: string) {
        const warning = document.createElement('div');
        warning.textContent = message;
        warning.setAttribute('style', 'text-align: center; font-size: xxx-large; margin-top: 40px;');
        document.getElementById('map')?.appendChild(warning);
    }

    if (maptilerConfig.apiKey && maptilerConfig.apiKey !== 'REPLACEME') {
        config.apiKey = maptilerConfig.apiKey;
    } else {
        showWarningMessage('Maptiler API key is missing!');
    }

    if (!maptilerConfig.styleId) {
        showWarningMessage('Maptiler style ID is missing!');
    }
}
