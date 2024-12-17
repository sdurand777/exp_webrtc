
from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# Route principale qui sert le fichier index.html
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

# Route pour servir des fichiers statiques (comme les JS, CSS, images, etc.)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.getcwd(), path)

if __name__ == '__main__':
    # Démarre le serveur sur le port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
