import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom"
import { Socket, io } from "socket.io-client";

const URL = 'http://localhost:3000';

export const Room = ({
  name, localAudioTrack, localVideoTrack
}: {
  name: string,
  localAudioTrack: MediaStreamTrack | null,
  localVideoTrack: MediaStreamTrack | null
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lobby, setLobby] = useState(true);
  const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [receiving, setReceivingPc] = useState<null | RTCPeerConnection>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteMediaSteam, setRemoteMediaStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>();
  const localVideoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    const socket = io(URL, {
      autoConnect: true
    });

    socket.on('send-offer', async ({ roomId }) => {
      setLobby(false);
      const pc = new RTCPeerConnection();
      setSendingPc(pc);
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
      }

      if (localAudioTrack) {
        pc.addTrack(localAudioTrack);
      }
      pc.onicecandidate = async (e) => {
        if (e.candidate)
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId: roomId
          });
      }
      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer();
        // @ts-ignore
        pc.setLocalDescription(sdp)
        socket.emit("offer", {
          sdp,
          roomId
        })
      }
    })

    socket.on('offer', async ({ roomId, sdp: remoteSdp }) => {
      setLobby(false);
      const pc = new RTCPeerConnection();
      pc.setRemoteDescription(remoteSdp);
      const sdp = await pc.createAnswer();
      // @ts-ignore
      pc.setLocalDescription(sdp);
      const stream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setRemoteMediaStream(stream);
      setReceivingPc(pc);

      pc.onicecandidate = async (e) => {
        if (e.candidate)
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId
          });
      }

      pc.ontrack = (({ track, type }) => {
        if (type == "audio") {
          // @ts-ignore
          remoteVideoRef?.current?.srcObject?.addTrack(track);
        } else {
          // @ts-ignore
          remoteVideoRef?.current?.srcObject?.addTrack(track);
        }
        remoteVideoRef.current?.play();
      })
      socket.emit("answer", {
        roomId,
        sdp
      })
    })

    socket.on('answer', ({ roomId, sdp: remoteSdp }) => {
      setLobby(false);
      setSendingPc(pc => {
        pc?.setRemoteDescription(remoteSdp)
        return pc;
      })
    })

    socket.on("lobby", () => {
      setLobby(true);
    })

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (type == "sender") {
        setReceivingPc(pc => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setSendingPc(pc => {
          pc?.addIceCandidate(candidate);
          return pc;
        })
      }

    });
    setSocket(socket);
  }, [name]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoRef) {

        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
        localVideoRef.current.play();
      }
    }
  }, [localVideoRef])

  return (
    <div>
      Room {name}
      <video autoPlay width={400} height={400} ref={localVideoRef} />
      {lobby ? "Waiting for someone to connect" : null}
      <video autoPlay width={400} height={400} ref={remoteVideoRef} />
    </div>
  )
} 
