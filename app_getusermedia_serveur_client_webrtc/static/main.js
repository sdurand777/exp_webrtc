
// gesiton pour offer et answer
const socket = io();

// les elements html a remplir et interagir
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startStopButton = document.getElementById('startStopButton');

// connection webrtc
const peerConnection = new RTCPeerConnection();

let localStream = null; // Flux local

// Fonction pour démarrer la capture vidéo
function startLocalMedia() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }) // Désactiver l'audio
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            startStopButton.textContent = 'Stop Video'; // Mettre à jour le texte du bouton
        })
        .catch(error => {
            console.error("Error accessing media devices: ", error);
        });
}

// Fonction pour arrêter la capture vidéo
function stopLocalMedia() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop()); // Arrêter toutes les pistes
        localVideo.srcObject = null;
        localStream = null;
        startStopButton.textContent = 'Start Video'; // Remettre le texte du bouton
    }
}

// Action du bouton pour démarrer/arrêter la vidéo
startStopButton.addEventListener('click', () => {
    if (localStream) {
        stopLocalMedia(); // Arrêter si la vidéo est déjà en cours
    } else {
        startLocalMedia(); // Démarrer la capture sinon
    }
});


// Gestion des candidats ICE
peerConnection.onicecandidate = event => {
    if (event.candidate) {
        socket.emit('signal', { candidate: event.candidate });
    }
};



// Gestion des pistes entrantes
peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.muted = true; // Désactiver le son pour la vidéo distante
};



// Gestion des signaux entrants
socket.on('signal', async data => {
    if (data.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('signal', { sdp: answer });
        }
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});



// Création de l'offre
peerConnection.onnegotiationneeded = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // envoi offer avec sockerio
    socket.emit('signal', { sdp: offer });
};
