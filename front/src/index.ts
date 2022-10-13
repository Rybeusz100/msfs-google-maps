import './index.css'
import NoSleep from 'nosleep.js';
import GoogleMap from './map/googleMap';
import loadGoogleMaps from './map/googleMapsLoader';
import { getApiKey, resetRoute, shutdown } from './lib/utils';
import checkRelease from './lib/checkRelease';
import { VERSION } from './lib/constants';
import type BaseMap from './map/baseMap';
import { Mode } from './lib/enums';
import 'ol/ol.css';
import OpenStreetMap from './map/openStreetMap';
import toggleTopnav from './lib/topnav';
import { getMode } from './lib/storage';

checkRelease(VERSION);

const followCheckbox = document.getElementById('follow') as HTMLInputElement;
const noSleepCheckbox = document.getElementById('noSleep') as HTMLInputElement;
const showRouteCheckbox = document.getElementById('showRoute') as HTMLInputElement;
const clearRouteBtn = document.getElementById('clearRoute') as HTMLButtonElement;
const showAirportsBtn = document.getElementById('showAirports') as HTMLButtonElement;
const radiusInput = document.getElementById('radius') as HTMLInputElement;
const shutdownBtn = document.getElementById('shutdown') as HTMLButtonElement;
const changeModeBtn = document.getElementById('changeMode') as HTMLButtonElement;
const settingsGearBtn = document.getElementById('settings-gear') as HTMLElement;

settingsGearBtn.addEventListener('click', toggleTopnav);

showAirportsBtn.setAttribute('shown', 'false');

const noSleep = new NoSleep();

let map: BaseMap;
let mode = getMode();
let googleMapsLoaded = false;

noSleepCheckbox.addEventListener('change', () => {
    noSleepCheckbox.checked ? noSleep.enable() : noSleep.disable();
});

shutdownBtn.addEventListener('click', () => {
    window.confirm('Are you sure you want to shutdown the server?') && shutdown();
});

clearRouteBtn.addEventListener('click', () => {
    window.confirm('Are you sure you want to clear the route?') && resetRoute();
});

changeModeBtn.addEventListener('click', () => {
    changeMode();
});

followCheckbox.addEventListener('change', () => {
    map.setFollow(followCheckbox.checked);
});

showRouteCheckbox.addEventListener('change', () => {
    map.setShowRoute(showRouteCheckbox.checked);
});

showAirportsBtn.addEventListener('click', () => {
    if (showAirportsBtn.getAttribute('shown') === 'false') {
        showAirportsBtn.setAttribute('shown', 'true');
        showAirportsBtn.innerText = 'Hide airports';
        const radius = parseFloat(radiusInput.value);
        map.markAirports(radius);
    } else {
        showAirportsBtn.setAttribute('shown', 'false');
        showAirportsBtn.innerText = 'Show airports';
        map.clearAirports();
    }
});

startApp(mode);

function startApp(mode: Mode) {
    if (mode === Mode.GoogleMaps) {
        if (!googleMapsLoaded) {
            googleMapsLoaded = true;
            const apiKey = getApiKey();

            loadGoogleMaps(apiKey, () => {
                map = new GoogleMap(followCheckbox.checked, showRouteCheckbox.checked);
            });
        } else {
            map = new GoogleMap(followCheckbox.checked, showRouteCheckbox.checked);
        }
    }

    if (mode === Mode.OpenStreetMap) {
        map = new OpenStreetMap(followCheckbox.checked, showRouteCheckbox.checked);
    }
}

function changeMode() {
    showAirportsBtn.setAttribute('shown', 'false');
    showAirportsBtn.innerText = 'Show airports';
    map.removeMap();
    mode = mode === Mode.GoogleMaps ? Mode.OpenStreetMap : Mode.GoogleMaps;
    localStorage.setItem('mode', mode.toString());
    startApp(mode);
}
