import React, { useState } from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import VideoStreaming from "../videostreaming/streaming";

const DashBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const email = localStorage.getItem("email");
  const emailData = email?.split("@")[0];
  const [videoId, setVideoId] = useState<string>("");

  const playVideoHandler = (videoId: string) => {
    setVideoId(videoId);
  };

  return (
    <div>
      <h1> Welcome to Dash Board Page - {emailData} </h1>
      <Button
        type="primary"
        size="large"
        onClick={() => {
          navigate("/");
        }}
      >
        Logout
      </Button>
      {videoId && <VideoStreaming videoId={videoId} />}
      <button onClick={() => playVideoHandler("cdn")}>video1</button>
      <button onClick={() => playVideoHandler("generate-pass")}>video2</button>
      <button onClick={() => playVideoHandler("get-post")}>video3</button>
      <button onClick={() => playVideoHandler("index-video")}>video4</button>
      <button onClick={() => playVideoHandler("cricket")}>video5</button>
    </div>
  );
};

export default DashBoardPage;
