// gesiton pour offer et answer
const socket = io();

// remote video
const remoteVideo = document.getElementById('remoteVideo');

// connection webrtc
const peerConnection = new RTCPeerConnection();
console.log('Created remote peer connection object');

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


// Lorsque le serveur envoie un signal (offre SDP ou candidat ICE)
socket.on('signal', async (data) => {
    if (data.sdp) {
        // Si on reçoit une offre SDP
        if (data.sdp.type === 'offer') {
            // Définir l'offre reçue comme description distante
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

            // Créer une réponse (answer)
            const answer = await peerConnection.createAnswer();

            // Définir la réponse comme description locale
            await peerConnection.setLocalDescription(answer);

            // Envoyer la réponse (answer) à l'émetteur de l'offre
            socket.emit('signal', { sdp: answer });
            console.log('Réponse (answer) envoyée');
        }
    } else if (data.candidate) {
        // Si on reçoit un candidat ICE, l'ajouter au peer connection
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Création de l'offre
peerConnection.onnegotiationneeded = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    // envoi offer avec sockerio
    socket.emit('signal', { sdp: offer });
    console.log('Offre SDP envoyée', offer);
};

peerConnection.oniceconnectionstatechange = () => {
    console.log('État de la connexion ICE (remote) :', peerConnection.iceConnectionState);
};

