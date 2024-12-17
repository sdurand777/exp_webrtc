
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)

socketio = SocketIO(app)

@app.route('/')
def index():
    # Récupérer l'IP du client à chaque connexion
    client_ip = request.remote_addr
    print(f"Connexion depuis l'IP: {client_ip}")
    return render_template('local.html')

@app.route('/remote')
def remote():
    # Page pour le deuxième client (remote.html)
    client_ip = request.remote_addr
    print(f"Connexion à remote depuis l'IP: {client_ip}")
    return render_template('remote.html')


# @socketio.on('signal')
# def handle_signal(data):
#     print("Signal reçu : ", data)
#     emit('signal', data, broadcast=True, include_self=False)

pending_sdp = None

@socketio.on('signal')
def handle_signal(data):
    global pending_sdp
    if 'sdp' in data:
        pending_sdp = data  # Stocker l'offre SDP
        print("SDP stockée : ", pending_sdp)
    emit('signal', data, broadcast=True, include_self=False)

@socketio.on('connect')
def handle_connect():
    global pending_sdp
    if pending_sdp:  # Si une offre SDP existe déjà
        emit('signal', pending_sdp)  # L'envoyer au nouveau client
        print("SDP envoyée au nouveau client :", pending_sdp)



if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
