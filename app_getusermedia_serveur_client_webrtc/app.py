
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)

# bonne pratique securite
#app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app)

@app.route('/')
def index():
    # Récupérer l'IP du client à chaque connexion
    client_ip = request.remote_addr
    print(f"Connexion depuis l'IP: {client_ip}")
    return render_template('index.html')

@socketio.on('signal')
def handle_signal(data):
    emit('signal', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
