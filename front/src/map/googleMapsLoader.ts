import { getApiKey } from '../lib/utils';

const GoogleMapsLoadedEvent = new Event('GoogleMapsLoaded');

window.GoogleMapsLoadedCallback = () => {
    window.dispatchEvent(GoogleMapsLoadedEvent);
};

export default async function loadGoogleMaps() {
    const apiKey = (await getApiKey()) || '';
    const gMaps = document.createElement('script');
    gMaps.async = true;
    gMaps.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&callback=GoogleMapsLoadedCallback`;
    document.head.appendChild(gMaps);

    return new Promise<void>((resolve) => {
        window.addEventListener(GoogleMapsLoadedEvent.type, () => {
            resolve();
        });
    });
}
