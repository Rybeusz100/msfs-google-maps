import json
import haversine as hs

with open('airports.json', 'r', encoding='utf-8') as json_file:
    airports_json = json.load(json_file)

def get_airports(latitude, longitude, distance_km):
    nearest_airports = []
    plane_location = (float(latitude), float(longitude))

    for airport in airports_json:
        airport_location = (float(airport['latitude_deg']), float(airport['longitude_deg']))

        distance = hs.haversine(plane_location, airport_location)

        if distance <= distance_km:
            nearest_airports.append(airport)

    return nearest_airports