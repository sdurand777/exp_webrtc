
const socket = io();

// Éléments HTML pour la vidéo
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startStopButton = document.getElementById('startStopButton');

// Éléments HTML pour le chat
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

// WebRTC connections
const peerConnection = new RTCPeerConnection();
let localStream = null;
let dataChannel; // DataChannel pour le chat

// Fonction pour démarrer la capture vidéo
function startLocalMedia() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            startStopButton.textContent = 'Stop Video';
        })
        .catch(error => console.error("Error accessing media devices: ", error));
}

// Fonction pour arrêter la capture vidéo
function stopLocalMedia() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        localStream = null;
        startStopButton.textContent = 'Start Video';
    }
}

// Action du bouton pour démarrer/arrêter la vidéo
startStopButton.addEventListener('click', () => {
    if (localStream) {
        stopLocalMedia();
    } else {
        startLocalMedia();
    }
});

// Création du DataChannel
peerConnection.ondatachannel = event => {
    const receiveChannel = event.channel;
    receiveChannel.onmessage = event => appendMessage(`Remote: ${event.data}`);
};

function createDataChannel() {
    dataChannel = peerConnection.createDataChannel('chat');
    dataChannel.onopen = () => console.log("DataChannel is open");
    dataChannel.onclose = () => console.log("DataChannel is closed");
}

// Gestion des signaux entrants
socket.on('signal', async data => {
    if (data.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
            createDataChannel(); // Créer le DataChannel côté answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { sdp: answer });
        }
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Gestion des candidats ICE
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        socket.emit('signal', { candidate: event.candidate });
    }
};

// Gestion des pistes vidéo entrantes
peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.muted = true;
};

// Création de l'offre
peerConnection.onnegotiationneeded = async () => {
    createDataChannel(); // Créer le DataChannel côté offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { sdp: offer });
};

// Gestion du formulaire de chat
chatForm.addEventListener('submit', event => {
    event.preventDefault(); // Empêcher le rechargement de la page
    const message = chatInput.value.trim();
    if (message && dataChannel.readyState === "open") {
        dataChannel.send(message); // Envoyer le message via DataChannel
        appendMessage(`You: ${message}`); // Afficher localement
        chatInput.value = ''; // Réinitialiser le champ
    }
});

// Fonction pour afficher un message dans le chat
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Faire défiler vers le bas
}
