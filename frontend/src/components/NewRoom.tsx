import { useEffect, useRef, useState, useCallback } from "react";
import { Socket, io } from "socket.io-client";

const URL = 'http://localhost:3000';

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:global.stun.twilio.com:3478",
      ],
    },
  ],
};

export const Room = ({
  localAudioTrack,
  localVideoTrack,
  localStream
}: {
  localAudioTrack: MediaStreamTrack | null,
  localVideoTrack: MediaStreamTrack | null,
  localStream: MediaStream | null
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState(true);
  const [roomId, setRoomId] = useState<string>("");
  const [pc, setPC] = useState<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [refresh, setRefresh] = useState(false);

  const initializePeerConnection = useCallback(() => {
    const newPc = new RTCPeerConnection(servers);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        newPc.addTrack(track, localStream);
      });
    }

    newPc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    setPC(newPc);
    return newPc;
  }, [localStream, refresh]);

  const nextUser = () => {
    if (socket) {
      socket.emit('next-user', { roomId });
      console.log('NEXT USER');
      setLobby(true);
    }
  }

  useEffect(() => {
    const socket = io(URL, { autoConnect: true });
    setSocket(socket);

    const peerConnection = initializePeerConnection();

    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    socket.on('send-offer', async ({ roomId }) => {
      setLobby(false);
      setRoomId(roomId);
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log("ICE CANDIDATE: ", event.candidate);
          socket.emit("add-ice-candidate", {
            candidate: event.candidate,
            roomId: roomId
          });
        }
      };
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("1. Offer done: ", offer);
      socket.emit('offer', { sdp: offer, roomId });
    });

    socket.on('offer', async ({ sdp, roomId }) => {
      setLobby(false);
      setRoomId(roomId);
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('Adding answer candidate...:', event.candidate);
          socket.emit("add-ice-candidate", {
            candidate: event.candidate,
            roomId: roomId
          });
        }
      };
      await peerConnection.setRemoteDescription(sdp);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', { sdp: answer, roomId });
      console.log("2. Answer done: ", answer);
    });

    socket.on('answer', async ({ sdp }) => {
      console.log("2. Answer received");
      await peerConnection.setRemoteDescription(sdp);
    });

    socket.on("add-ice-candidate", ({ candidate }) => {
      peerConnection.addIceCandidate(candidate);
    });

    return () => {
      socket.disconnect();
      peerConnection.close();
    };
  }, [initializePeerConnection, refresh]);

  return (<div className="flex flex-col ms:flex-row h-screen bg-gray-100">
    <div className="flex-1 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <video
            muted
            autoPlay
            playsInline
            ref={localVideoRef}
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">You</p>
        </div>
        <div className="relative">
          <video
            autoPlay
            playsInline
            ref={remoteVideoRef}
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <p className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">Remote</p>
        </div>
      </div>
      {lobby && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Waiting for someone to connect...
        </div>
      )}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => { setRefresh(!refresh); setLobby(true) }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Play Remote Video
        </button>
      </div>
    </div>
    <div className="w-full lg:w-1/4 bg-white p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Chat</h2>
      <p className="text-gray-500">Chat functionality coming soon...</p>
    </div>
  </div>
  );
};
