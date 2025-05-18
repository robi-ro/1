const APP_ID = 'ec2b46f1083046f18396e623aa1c06b3'; // 🔐 Replace with your Agora App ID
const CHANNEL = 'test'; // Can be any string
const TOKEN = null;     // Use null for testing (no token)

let client;
let localTracks = [];
let remoteUsers = {};

async function startCall() {
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

  // Join the channel
  const UID = await client.join(APP_ID, CHANNEL, TOKEN || null, null);
  console.log(`Joined channel ${CHANNEL} with UID ${UID}`);

  // Create audio and video tracks
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  // Play local video
  const localContainer = document.getElementById('local-video');
  localContainer.innerHTML = '';
  localTracks[1].play('local-video');

  // Publish local tracks
  await client.publish(localTracks);
  console.log('Local tracks published');

  // Listen for remote users
  client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      const remoteContainer = document.getElementById('remote-video');
      remoteContainer.innerHTML = '';
      user.videoTrack.play('remote-video');
    }

    if (mediaType === 'audio') {
      user.audioTrack.play();
    }

    remoteUsers[user.uid] = user;
  });

  client.on('user-unpublished', (user) => {
    delete remoteUsers[user.uid];
    document.getElementById('remote-video').innerHTML = '';
    console.log(`User ${user.uid} left`);
  });
}

async function leaveCall() {
  // Stop local tracks
  localTracks.forEach(track => {
    track.stop();
    track.close();
  });

  // Leave the channel
  await client.leave();

  // Clear UI
  document.getElementById('local-video').innerHTML = '';
  document.getElementById('remote-video').innerHTML = '';

  console.log('Call ended and left channel');
}
