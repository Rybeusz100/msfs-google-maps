let map;
let svgMarker;
let planeMarker;
let follow = true;
let followTimeoutID;

function initMap() {

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
    anchor: new google.maps.Point(100, 100),
  };

  planeMarker = new google.maps.Marker({
    position: new google.maps.LatLng(0, 0),
    map: map,
    icon: svgMarker,
  });

  map.addListener("drag", disableFollow)

  document.getElementById("follow").addEventListener('change', function() {
    if(this.checked) {
      follow = true
      if(followTimeoutID != null) {
        clearTimeout(followTimeoutID)
      }
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
      let position = JSON.parse(request.responseText)
      console.log(position)
      if(position.latitude == null || position.longitude == null) {
        return
      }
      
      if(position.heading != null) {
        svgMarker.rotation = position.heading
        planeMarker.setIcon(svgMarker)
      }

      planeMarker.setPosition(new google.maps.LatLng(position.latitude, position.longitude))

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
