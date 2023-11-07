import { API_URL } from './constants';

interface StatusInfo {
    className: string;
    hint: string;
}

const Status = {
    SimConnected: {
        className: 'hidden',
        hint: '',
    },
    SimNotConnected: {
        className: 'warning fa-triangle-exclamation',
        hint: "Server is running, but it can't connect to simulator. Check if simulator is running.",
    },
    Error: {
        className: 'error fa-circle-exclamation',
        hint: "Couldn't connect to server. Check if server is running.",
    },
};

export async function checkConnection() {
    const setErrorTimeoutId = window.setTimeout(() => updateConnectionIcon(Status.Error), 1000);

    fetch(API_URL + '/status')
        .then((response) => response.json())
        .then((result) => {
            window.clearTimeout(setErrorTimeoutId);
            if (result.SimConnected === 'true') {
                updateConnectionIcon(Status.SimConnected);
            } else {
                updateConnectionIcon(Status.SimNotConnected);
            }
        })
        .catch(() => {
            /* empty */
        })
        .finally(() => {
            window.setTimeout(checkConnection, 2000);
        });
}

function updateConnectionIcon(status: StatusInfo) {
    const statusIcon = document.getElementById('status-icon') as HTMLElement;
    statusIcon.className = 'fa ' + status.className;
    statusIcon.onclick = () => window.alert(status.hint);
}
