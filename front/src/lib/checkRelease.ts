export default function checkRelease(version: string) {
    fetch('https://api.github.com/repos/Rybeusz100/msfs-google-map/releases/latest')
        .then(async (response) => {
            if (
                response.ok &&
                (await response.json()).tag_name !== version &&
                window.confirm('New version available.\nDo you want to update?')
            ) {
                window.location.href = 'https://flightsim.to/file/28216/google-map-for-msfs';
            }
        })
        .catch(() => {
            /* empty */
        });
}
