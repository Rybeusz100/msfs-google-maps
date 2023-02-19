export default function loadGoogleMaps(apiKey: string, callback: () => void) {
    const gMaps = document.createElement('script');
    gMaps.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    gMaps.onload = callback;
    document.head.appendChild(gMaps);
}
