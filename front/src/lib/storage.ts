import { LOCAL_STORAGE_MODE_KEY } from './constants';
import { Mode } from './enums';

export function getMode(): Mode {
    const modeFromStorage = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
    if (modeFromStorage) {
        const mode = parseInt(modeFromStorage);
        if (Object.values(Mode).includes(mode)) {
            return mode;
        }
    }

    return Mode.OpenStreetMap;
}
