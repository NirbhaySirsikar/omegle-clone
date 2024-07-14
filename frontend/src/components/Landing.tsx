import { useEffect, useRef, useState } from "react";
import { Room } from "./NewRoom";

export const Landing = () => {
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  // const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getCam = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    setLocalStream(stream);
    // const audioTrack = stream.getAudioTracks()[0];
    // const videoTrack = stream.getVideoTracks()[0];
    // setLocalAudioTrack(audioTrack);
    // setlocalVideoTrack(videoTrack);
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = localStream;
    // videoRef.current.srcObject = new MediaStream([videoTrack]);
    videoRef.current.play();
  }

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }

  }, [videoRef]);

  if (!joined) {

    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen p-4">
        <header className="text-center py-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 tracking-tight">
            <span className="inline-block transform hover:scale-110 transition-transform duration-200 ease-in-out">
              📸
            </span>{' '}
            Omegle
            <sup className="text-2xl md:text-3xl text-blue-500 font-semibold ml-1">
              clone
            </sup>
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Connect with strangers around the world
          </p>
        </header>
        <div className="w-full max-w-[50%] aspect-video">
          <video
            className="w-full h-full object-cover rounded-lg shadow-lg"
            autoPlay
            muted
            ref={videoRef}
          ></video>

        </div>
        <p className="mt-4 text-md text-gray-600">
          Please allow camera and microphone permission
        </p>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => { if (localStream) setJoined(true) }}
          >
            Join
          </button>
        </div>
      </div>
    )
  }
  return <Room localStream={localStream} />
}
