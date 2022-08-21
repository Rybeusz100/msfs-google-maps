import type { Mode } from './enums';

export function getMode() {
    let mode: Mode = parseInt(localStorage.getItem('mode') || '0');

    if (isNaN(mode) || mode < 0 || mode > 1) {
        mode = 0;
    }

    return mode;
}
