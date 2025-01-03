'use strict';
// pour gerer les websocket
const socket = io();
// recuperer balise html
const localVideo = document.getElementById('localVideo');
// variable global accessible dans la console
let stream;
// la connection pour streamer la video
let pcLocal;

// Délai avant l'envoi de l'offre SDP (en millisecondes)
const SDP_SEND_DELAY = 10000; // 1 seconde

// create stream from local video
function maybeCreateStream() {
    if (stream) {
        return;
    }
    // try captureStream
    if (localVideo.captureStream) {
        // capture stream
        stream = localVideo.captureStream();
        console.log('Captured stream from localVideo with captureStream',
            stream);
        // call to create the connection
    // firefox attempt
    } else if (localVideo.mozCaptureStream) {
        stream = localVideo.mozCaptureStream();
        console.log('Captured stream from localVideo with mozCaptureStream()',
            stream);
        // call to create the connection
    } else {
        console.log('captureStream() not supported');
    }

    // // Créer l'instance de RTCPeerConnection
    // pcLocal = new RTCPeerConnection();
    // Créer l'instance de RTCPeerConnection avec un serveur STUN
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' } // Serveur STUN public
        ]
    };
    pcLocal = new RTCPeerConnection(configuration);
    console.log('Created local peer connection object');

    // Ajouter chaque piste du flux à RTCPeerConnection
    stream.getTracks().forEach(track => {
        pcLocal.addTrack(track, stream);
    });

    console.log('Stream ajouté au RTCPeerConnection', stream);

    // Vous pouvez également ajouter des gestionnaires pour la connexion ICE, etc.
    pcLocal.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', { candidate: event.candidate });
        }
    };

    console.log(`ICE candidate: ${event.candidate ?
        event.candidate.candidate : '(null)'}`);

    // Lorsque la négociation est nécessaire, créer une offre SDP
    pcLocal.onnegotiationneeded = async () => {
        try {
            // Créer une offre
            const offer = await pcLocal.createOffer();

            // Définir l'offre en tant que description locale
            await pcLocal.setLocalDescription(offer);

            // Utiliser un délai avant d'envoyer l'offre SDP
            setTimeout(() => {
                socket.emit('signal', { sdp: offer });
                console.log('Offre SDP envoyée avec délai', offer);
            }, SDP_SEND_DELAY); // Délai défini

            // // Envoyer l'offre via Socket.IO
            // socket.emit('signal', { sdp: offer });
            // console.log('Offre SDP envoyée', offer);
        } catch (error) {
            console.error('Erreur lors de la création de l\'offre SDP', error);
        }
    };

}




// Gestion des signaux reçus
socket.on('signal', async (data) => {
    // Si une réponse SDP est reçue
    if (data.sdp && data.sdp.type === 'answer') {
        console.log('Réponse SDP reçue par local.js:', data.sdp);
        try {
            await pcLocal.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('Remote description configurée dans local.js');
        } catch (error) {
            console.error('Erreur lors de la configuration de Remote Description:', error);
        }
    }
    // Si un candidat ICE est reçu
    else if (data.candidate) {
        console.log('Candidat ICE reçu par local.js:', data.candidate);
        try {
            await pcLocal.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('Candidat ICE ajouté dans local.js');
        } catch (error) {
            console.error('Erreur lors de l\'ajout du candidat ICE:', error);
        }
    }
});





// Video tag capture must be set up after video tracks are enumerated.
localVideo.oncanplay = maybeCreateStream;
if (localVideo.readyState >= 3) { // HAVE_FUTURE_DATA
  // Video is already ready to play, call maybeCreateStream in case oncanplay
  // fired before we registered the event handler.
  maybeCreateStream();
}
// play vidoe
localVideo.play();



