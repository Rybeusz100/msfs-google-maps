from flask import Flask, render_template, jsonify, send_file
from time import sleep
import simconnect
import win32api
import nearest_airports

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

sim_connection = simconnect.Connection()

# set on_exit
def on_exit(sig, func=None):
    sim_connection.disconnect()

win32api.SetConsoleCtrlHandler(on_exit, True)

# connect to simulator
if not sim_connection.connect():
    print('Connection failed, retrying. The app will start as soon as the connection is established.')
    while not sim_connection.connect():
        sleep(0.5)
print('Connected to the simulator')

# load api key
api_key = ''
try:
    with open('api_key.txt', 'r') as key_file:
        api_key = key_file.read()
except FileNotFoundError:
    api_key = ''


# app routes
@app.route('/')
def index():
    return render_template('index.html', api_key = api_key)

@app.route('/position')
def position():
    position = sim_connection.get_position()

    print(position)
    return jsonify(position)

@app.route('/airports/<latitude>/<longitude>/<distance>')
def airports(latitude, longitude, distance):
    airports = nearest_airports.get_airports(latitude, longitude, int(distance))
    print(f"returned {len(airports)} airports")
    return jsonify(airports)

@app.route('/images/<image_name>')
def images(image_name):
    return send_file(f"static/images/{image_name}", mimetype="image/png")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8054)