
// Initialiser la connexion Socket.IO
const socket = io();

// Initialiser le peer connection
const peerConnection = new RTCPeerConnection();
console.log('Created remote peer connection object');

// Élément vidéo distant
const remoteVideo = document.getElementById('remoteVideo');

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

// Lorsque la connexion ICE est prête
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        // Envoyer le candidat ICE au serveur via Socket.IO
        socket.emit('signal', { candidate: event.candidate });
    }
};

// Lorsque la connexion est établie et qu'un flux vidéo arrive
peerConnection.ontrack = (event) => {
    // Afficher le flux vidéo distant dans l'élément vidéo
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.muted = true;  // Mute la vidéo distante pour éviter l'écho
};

// Créer la connexion WebRTC et commencer la négociation (en cas de besoin)
// Cette étape est plus pertinente pour le client local qui envoie l'offre (voir le code dans `local.js`).
