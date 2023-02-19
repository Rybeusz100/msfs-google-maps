export default function checkRelease(version: string) {
    const req = new XMLHttpRequest();
    req.open('GET', 'https://api.github.com/repos/Rybeusz100/msfs-google-map/releases/latest');
    req.onload = () => {
        if (JSON.parse(req.responseText).tag_name !== version) {
            if (window.confirm('New version available.\nDo you want to update?')) {
                window.location.href = 'https://flightsim.to/file/28216/google-map-for-msfs';
            }
        }
    };

    req.send(null);
}
