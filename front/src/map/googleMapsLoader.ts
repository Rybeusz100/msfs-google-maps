import { getApiKey } from '../lib/utils';

export default async function loadGoogleMaps(callback: () => void) {
    const apiKey = (await getApiKey()) || '';
    const gMaps = document.createElement('script');
    gMaps.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    gMaps.onload = callback;
    document.head.appendChild(gMaps);
}
