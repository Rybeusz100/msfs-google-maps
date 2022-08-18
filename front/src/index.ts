import NoSleep from 'nosleep.js';
import GoogleMap from './map/googleMap';
import loadGoogleMaps from './map/googleMapsLoader';
import { getApiKey, shutdown } from './lib/utils';
import checkRelease from './lib/checkRelease';
import { VERSION } from './lib/constants';
import Position from './lib/position';

checkRelease(VERSION);

const followCheckbox = document.getElementById('follow') as HTMLInputElement;
const noSleepCheckbox = document.getElementById('noSleep') as HTMLInputElement;
const showRouteCheckbox = document.getElementById('showRoute') as HTMLInputElement;
const clearRouteBtn = document.getElementById('clearRoute') as HTMLButtonElement;
const showAirportsBtn = document.getElementById('showAirports') as HTMLButtonElement;
const radiusInput = document.getElementById('radius') as HTMLInputElement;
const shutdownBtn = document.getElementById('shutdown') as HTMLButtonElement;

showAirportsBtn.setAttribute('shown', 'false');

const noSleep = new NoSleep();

noSleepCheckbox.addEventListener('change', () => {
    noSleepCheckbox.checked ? noSleep.enable() : noSleep.disable();
});

shutdownBtn.addEventListener('click', () => {
    window.confirm('Are you sure you want to shutdown the server?') && shutdown();
});

const apiKey = getApiKey();

loadGoogleMaps(apiKey, () => {
    let map = new GoogleMap(new Position(0, 0, 0, 0), [], followCheckbox.checked, showRouteCheckbox.checked);

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
});
