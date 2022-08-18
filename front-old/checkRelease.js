let currentVersion = 'v1.1.0'
let request = new XMLHttpRequest()
request.open('GET', 'https://api.github.com/repos/Rybeusz100/msfs-google-map/releases/latest')
request.onload = function() {
    if(JSON.parse(request.responseText).tag_name != currentVersion) {
        if(window.confirm("There's a new version available! Go to download section?")) {
            window.location.href = 'https://flightsim.to/file/28216/google-map-for-msfs'
        }
    }
}
request.send()