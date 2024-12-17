
// Initialiser la connexion Socket.IO
const socket = io();

// Initialiser le peer connection
//
// const peerConnection = new RTCPeerConnection();
// console.log('Created remote peer connection object');

// Créer l'instance de RTCPeerConnection avec un serveur STUN
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Serveur STUN public
    ]
};
const peerConnection = new RTCPeerConnection(configuration);
console.log('Created remote peer connection object with STUN server');


// Élément vidéo distant
const remoteVideo = document.getElementById('remoteVideo');
console.log('Get element video');

// Lorsque le serveur envoie un signal (offre SDP ou candidat ICE)
socket.on('signal', async (data) => {

    console.log('Signal reçu par le client distant :', data);

    if (data.sdp) {

        console.log('Offre SDP reçue :', data.sdp);

        // Si on reçoit une offre SDP
        if (data.sdp.type === 'offer') {
            // Définir l'offre reçue comme description distante
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Description distante définie avec succès');

            // Créer une réponse (answer)
            const answer = await peerConnection.createAnswer();

            // Définir la réponse comme description locale
            await peerConnection.setLocalDescription(answer);

            // Envoyer la réponse (answer) à l'émetteur de l'offre
            socket.emit('signal', { sdp: answer });
            console.log('Réponse (answer) envoyée');
        }
    } else if (data.candidate) {
        console.log('Candidat ICE reçu :', data.candidate);
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
            console.error('Erreur lors de l\'ajout du candidat ICE :', error);
        }
        // // Si on reçoit un candidat ICE, l'ajouter au peer connection
        // await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
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
