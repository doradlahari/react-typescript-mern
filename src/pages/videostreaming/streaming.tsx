import React, { useRef, useEffect } from "react";

interface VideoStreamingProps {
  videoId: string;
}

const VideoStreaming: React.FC<VideoStreamingProps> = ({ videoId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = `http://localhost:5000/videos/${videoId}`;
    }
  }, [videoId]);

  return (
    <div>
      <video
        ref={videoRef}
        style={{
          height: "100vh",
          width: "100vw",
        }}
        controls
        autoPlay
      >
        <source
          src={`http://localhost:5000/videos/${videoId}`}
          type="video/mp4"
        />
        Your browser doesn't support the video tag
      </video>
    </div>
  );
};

export default VideoStreaming;
