# Google map for Microsoft Flight Simulator 2020
[flightsim.to page](https://flightsim.to/file/28216/google-map-for-msfs)

## Description
A web app that allows to monitor your flight on an interactive map from any device with a web browser.  
  
![alt text](https://cdn.flightsim.to/images/22/google-map-for-msfs-jYHQP.jpg?width=1400&auto_optimize=medium)

## Technologies used
- Python 3.10
- Flask
- C++14 with SimConnect SDK and Pybind11
- Javascript with Google Maps API

# Usage guide
1. Download the [latest release](https://github.com/Rybeusz100/msfs-google-map/releases).
1. Unzip downloaded file.
1. Double click on the ```install.bat``` file.
1. Double click on the ```run.bat``` file.
1. Start Microsoft Flight Simulator.

## Monitoring flight on the same machine that runs MSFS
1. Navigate to ```localhost:8054``` in your browser.
1. As soon as the MSFS loads, you should see a map with your aircraft's position.

## Monitoring flight on other machine
1. Navigate to ```YOUR_LOCAL_IP_ADDRESS:8054```, you can see your IP address in the messages displayed on screen after the server starts.

## Troubleshooting
If you see a message like this:  
![alt text](https://i.stack.imgur.com/maCMs.png)  
you'll need to provide a Google Maps API key, you can get a free trial [here](https://developers.google.com/maps). After you've obtained your key, you can simply put it into ```api_key.txt``` file and place it in the same directory as the ```app.py``` file.
