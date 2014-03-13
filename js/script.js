var localStream, localPeerConnection, remotePeerConnection;

var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");
var discussionButton = document.getElementById("discussionButton");
var enddiscussionButton = document.getElementById("enddiscussionButton");
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;
discussionButton.disabled = true;
enddiscussionButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;
discussionButton.onclick = addblur;
enddiscussionButton.onclick = remblur;

function trace(text) {
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function gotStream(stream){
  trace("Received local stream");
  localVideo.src = URL.createObjectURL(stream);
  localStream = stream;
  callButton.disabled = false;
}

function start() {
  trace("Requesting local stream");
  startButton.disabled = true;
  getUserMedia({audio:true, video:true}, gotStream,
    function(error) {
      trace("getUserMedia error: ", error);
    });
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  discussionButton.disabled = false;
  trace("Starting call");

  if (localStream.getVideoTracks().length > 0) {
    trace('Using video device: ' + localStream.getVideoTracks()[0].label);
  }
  if (localStream.getAudioTracks().length > 0) {
    trace('Using audio device: ' + localStream.getAudioTracks()[0].label);
  }

  
  var servers = null;

  localPeerConnection = new RTCPeerConnection(servers);
  trace("Created local peer connection object localPeerConnection");
  localPeerConnection.onicecandidate = gotLocalIceCandidate;

  remotePeerConnection = new RTCPeerConnection(servers);
  trace("Created remote peer connection object remotePeerConnection");
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.onaddstream = gotRemoteStream;

  localPeerConnection.addStream(localStream);
  trace("Added localStream to localPeerConnection");
  localPeerConnection.createOffer(gotLocalDescription,handleError);
}

function addblur() {
    remoteVideo.setAttribute("style","-webkit-filter:blur(10px)");
    discussionButton.disabled = true;
    enddiscussionButton.disabled = false;
}

function remblur() {
    remoteVideo.setAttribute("style","-webkit-filter:blur(0px)");
    enddiscussionButton.disabled = true;
    discussionButton.disabled = false;
}

function gotLocalDescription(description){
  localPeerConnection.setLocalDescription(description);
  trace("Offer from localPeerConnection: \n" + description.sdp);
  remotePeerConnection.setRemoteDescription(description);
  remotePeerConnection.createAnswer(gotRemoteDescription,handleError);
}

function gotRemoteDescription(description){
  remotePeerConnection.setLocalDescription(description);
  trace("Answer from remotePeerConnection: \n" + description.sdp);
  localPeerConnection.setRemoteDescription(description);
}

function hangup() {
  trace("Ending call");
  localPeerConnection.close();
  remotePeerConnection.close();

  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  discussionButton.disabled = true;
  enddiscussionButton.disabled = true;
  remoteVideo.parentNode.removeChild(remoteVideo);
}

function gotRemoteStream(event){
  remoteVideo.src = URL.createObjectURL(event.stream);
  trace("Received remote stream");
}

function gotLocalIceCandidate(event){
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Local ICE candidate: \n" + event.candidate.candidate);
  }
}

function gotRemoteIceCandidate(event){
  if (event.candidate) {
    localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Remote ICE candidate: \n " + event.candidate.candidate);
  }
}

function handleError(){}