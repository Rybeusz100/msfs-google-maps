import { API_URL } from './constants';

enum Status {
    SimConnected = 'hidden',
    SimNotConnected = 'warning fa-triangle-exclamation',
    Error = 'error fa-circle-exclamation',
}

export async function checkConnection() {
    fetch(API_URL + '/status')
        .then(async (response) => {
            if ((await response.json())['SimConnected'] === 'true') {
                updateConnectionIcon(Status.SimConnected);
            } else {
                updateConnectionIcon(Status.SimNotConnected);
            }
        })
        .catch(() => {
            updateConnectionIcon(Status.Error);
        })
        .finally(() => {
            window.setTimeout(checkConnection, 2000);
        });
}

function updateConnectionIcon(status: Status) {
    const statusIcon = document.getElementById('status-icon') as HTMLElement;
    statusIcon.className = 'fa ' + status;
}
