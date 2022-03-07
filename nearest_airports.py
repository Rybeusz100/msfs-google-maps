import json
import haversine as hs

with open('airports.json', 'r', encoding='utf-8') as json_file:
    airports_json = json.load(json_file)

def get_airports(latitude, longitude, count):
    nearest_airports = []
    plane_location = (float(latitude), float(longitude))

    for airport in airports_json:
        airport_location = (float(airport['latitude_deg']), float(airport['longitude_deg']))

        distance = hs.haversine(plane_location, airport_location)
        nearest_airports.append((airport, distance))

    nearest_airports.sort(key=lambda x:x[1])
    nearest_airports = [data[0] for data in nearest_airports]

    if count >= len(nearest_airports):
        return nearest_airports
    else:
        return nearest_airports[:count]