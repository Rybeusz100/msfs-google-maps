let map;
let svgMarker;
let planeMarker;
let follow = true;
let followTimeoutID;
let routesArray = [];
let airports = [];
let latitude = 0;
let longitude = 0;
let airportsShown = false;

// altitude categories in feet loosely inspired by https://www.flightradar24.com/faq
const GROUND_ALT = 328 // 100 meters
const GROUND_ALT_COLOR = "#ffffff"
const LOW_ALT = 1000
const LOW_ALT_COLOR = "#ffff00"
const MID_ALT = 8200 // 2500 meters
const MID_ALT_COLOR = "#00ff00"
const HIGH_ALT = 20000
const HIGH_ALT_COLOR = "#00ffff"
const VERY_HIGH_ALT = 40000
const VERY_HIGH_ALT_COLOR = "#0000ff"
// above 40 000 feet
const MAX_ALT_COLOR = "#ff0000"

let infoWindow

function initMap() {
  // init
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 3,
    center: { lat: 0, lng: 0 },
    mapTypeId: "terrain",
  });

  svgMarker = {
    path: "M 247.51404,152.40266 139.05781,71.800946 c 0.80268,-12.451845 1.32473,-40.256266 0.85468,-45.417599 -3.94034,-43.266462 -31.23018,-24.6301193 -31.48335,-5.320367 -0.0693,5.281361 -1.01502,32.598388 -1.10471,50.836622 L 0.2842717,154.37562 0,180.19575 l 110.50058,-50.48239 3.99332,80.29163 -32.042567,22.93816 -0.203845,16.89693 42.271772,-11.59566 0.008,0.1395 42.71311,10.91879 -0.50929,-16.88213 -32.45374,-22.39903 2.61132,-80.35205 111.35995,48.50611 -0.73494,-25.77295 z",
    fillColor: "black",
    fillOpacity: 1,
    strokeWeight: 0,
    rotation: 0,
    scale: 0.15,
    anchor: new google.maps.Point(120, 100),
  };

  planeMarker = new google.maps.Marker({
    position: new google.maps.LatLng(0, 0),
    map: map,
    icon: svgMarker,
  });

  infoWindow = new google.maps.InfoWindow()

  // add listeners
  map.addListener("drag", disableFollow)

  document.getElementById("follow").addEventListener('change', function() {
    if(this.checked) {
      follow = true
      if(followTimeoutID != null) {
        clearTimeout(followTimeoutID)
      }
    }
  })

  document.getElementById("showRoute").addEventListener('change', function() {
    if(this.checked) {
      for (const route of routesArray) {
        route.setMap(map)
      }
    }
    else {
      for (const route of routesArray) {
        route.setMap(null)
      }
    }
  })

  document.getElementById("clearRoute").addEventListener('click', function() {
    for (const route of routesArray) {
      route.setMap(null)
    }
    routesArray = []
  })

  document.getElementById("showAirports").addEventListener('click', function() {
    if(airportsShown) {
      this.innerHTML = "Show airports"
      airportsShown = false
      clearAirports()
    }
    else {
      this.innerHTML = "Hide airports"
      airportsShown = true
      markAirports()
    }
  })

  setTimeout(updatePosition, 1000)
}

function disableFollow() {
  follow = false
  if(followTimeoutID != null) {
    clearTimeout(followTimeoutID)
  }
  followTimeoutID = setTimeout(enableFollow, 10000)
}

function enableFollow() {
  follow = true;
}

function updatePosition() {
    let request = new XMLHttpRequest()
    request.open('GET', './position')
    request.onload = function() {
      // get position
      let position = JSON.parse(request.responseText)
      console.log(position)
      if(position.latitude == null || position.longitude == null) {
        return
      }

      // update heading
      if(position.heading != null) {
        svgMarker.rotation = position.heading
        planeMarker.setIcon(svgMarker)
      }
      
      // update position
      let newLatLng = new google.maps.LatLng(position.latitude, position.longitude)

      planeMarker.setPosition(newLatLng)

      latitude = position.latitude
      longitude = position.longitude

      // add route point
      let color
      if(position.alt_above_ground < GROUND_ALT) {
        color = GROUND_ALT_COLOR
      }
      else if (position.alt_above_ground < LOW_ALT) {
        color = LOW_ALT_COLOR
      }
      else if (position.alt_above_ground < MID_ALT) {
        color = MID_ALT_COLOR
      }
      else if (position.alt_above_ground < HIGH_ALT) {
        color = HIGH_ALT_COLOR
      }
      else if (position.alt_above_ground < VERY_HIGH_ALT) {
        color = VERY_HIGH_ALT_COLOR
      }
      else {
        color = MAX_ALT_COLOR
      }

      if(routesArray.length == 0) {
        let flightRoute = new google.maps.Polyline({
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 5,
        });
        if(document.getElementById("showRoute").checked) {
          flightRoute.setMap(map)
        }
        routesArray.push(flightRoute)
      }

      const path = routesArray[routesArray.length - 1].getPath()
      path.push(newLatLng)

      if(color != routesArray[routesArray.length - 1].strokeColor) {
        let flightRoute = new google.maps.Polyline({
          strokeColor: color,
          strokeOpacity: 1.0,
          strokeWeight: 5,
        });
        flightRoute.setMap(map)
        routesArray.push(flightRoute)

        const path = routesArray[routesArray.length - 1].getPath()
        path.push(newLatLng)
      }

      // update map center
      if(document.getElementById("follow").checked && follow) {
        map.setCenter({
          lat: position.latitude,
          lng: position.longitude
        })
      }
    }
    request.send()

    setTimeout(updatePosition, 1000)
}

function clearAirports() {
  for (const marker of airports) {
    marker.setMap(null)
  }
  airports = []
}

function markAirports() {
  let request = new XMLHttpRequest()
  request.open('GET', `./airports/${latitude}/${longitude}/${document.getElementById("distance").value}`)
  request.onload = function() {
      let json_data = JSON.parse(request.responseText)
      for (const entry of json_data) {
        let marker = new google.maps.Marker({
          position: new google.maps.LatLng(entry.latitude_deg, entry.longitude_deg),
          map,
          icon: "./images/" + entry.type + ".png",
          title: `<h2>${entry.name}</h2><b>type: ${entry.type.replace("_", " ")}`,
        })

        marker.addListener('click', () => {
          infoWindow.close()
          infoWindow.setContent(marker.getTitle())
          infoWindow.open(marker.getMap(), marker)
        })

        airports.push(marker)
      }
  }

  clearAirports()

  request.send()
}