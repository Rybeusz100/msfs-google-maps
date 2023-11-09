export {};

declare global {
    interface Window {
        GoogleMapsLoadedCallback: () => void;
    }
}
