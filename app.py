from flask import Flask, render_template, jsonify
from time import sleep
import simconnect
import atexit

app = Flask(__name__)

sim_connection = simconnect.Connection()

atexit.register(sim_connection.disconnect)

if not sim_connection.connect():
    print('Connection failed, retrying. The app will start as soon as the connection is established.')
    while not sim_connection.connect():
        sleep(0.5)
print('Connected to the simulator')

@app.route('/')
def index():
    try:
        with open('api_key.txt', 'r') as key_file:
            api_key = key_file.read()
    except FileNotFoundError:
        api_key = ''
    return render_template('index.html', api_key = api_key)

@app.route('/position')
def position():
    position = sim_connection.get_position()

    print(position)
    return jsonify(position)
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8054)