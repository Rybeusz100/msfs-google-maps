import type Position from '../lib/position';
import { getAirports } from '../lib/utils';
import BaseMap from './baseMap';

export default class GoogleMap extends BaseMap {
    map?: google.maps.Map;
    planeMarker?: google.maps.Marker;
    airports: google.maps.Marker[];
    infoWindow: google.maps.InfoWindow;

    constructor(position: Position, route: Position[], followOn: boolean, showRouteOn: boolean) {
        super(position, route, followOn, showRouteOn);
        this.createMap();
        this.createMarker();
        this.airports = [];
        this.infoWindow = new google.maps.InfoWindow();
    }

    createMap() {
        const mapOptions = {
            center: {
                lat: 0,
                lng: 0,
            },
            zoom: 3,
            mapTypeId: 'terrain',
        };
        this.map = new google.maps.Map(document.getElementById('map')!, mapOptions);
    }

    createMarker() {
        const svgMarker = {
            path: 'M 247.51404,152.40266 139.05781,71.800946 c 0.80268,-12.451845 1.32473,-40.256266 0.85468,-45.417599 -3.94034,-43.266462 -31.23018,-24.6301193 -31.48335,-5.320367 -0.0693,5.281361 -1.01502,32.598388 -1.10471,50.836622 L 0.2842717,154.37562 0,180.19575 l 110.50058,-50.48239 3.99332,80.29163 -32.042567,22.93816 -0.203845,16.89693 42.271772,-11.59566 0.008,0.1395 42.71311,10.91879 -0.50929,-16.88213 -32.45374,-22.39903 2.61132,-80.35205 111.35995,48.50611 -0.73494,-25.77295 z',
            fillColor: 'black',
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 0.15,
            anchor: new google.maps.Point(120, 100),
        };

        this.planeMarker = new google.maps.Marker({
            position: new google.maps.LatLng(0, 0),
            map: this.map,
            icon: svgMarker,
        });
    }

    markAirports(radius: number) {
        this.clearAirports();
        getAirports(this.position.lat, this.position.lon, radius, (airports) => {
            airports.forEach((airport) => {
                let marker = new google.maps.Marker({
                    position: new google.maps.LatLng(airport.latitude_deg, airport.longitude_deg),
                    map: this.map,
                    icon: './images/' + airport.type + '.png',
                    title: `<h2>${airport.name}</h2><b>type: ${airport.type.replace('_', ' ')}`,
                });

                marker.addListener('click', () => {
                    this.infoWindow.close();
                    this.infoWindow.setContent(marker.getTitle());
                    this.infoWindow.open(marker.getMap(), marker);
                });

                this.airports.push(marker);
            });
        });
    }

    clearAirports() {
        this.airports.forEach((marker) => {
            marker.setMap(null);
        });
        this.airports = [];
    }
}
