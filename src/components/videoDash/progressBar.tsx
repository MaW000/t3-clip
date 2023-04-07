import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Link from "next/link";
export const ProgressBar = ({ videoId,  }: { videoId: number }) => {
  const [num, setNum] = useState(0);
  const [connectionClosed, setConnectionClosed] = useState(false);
  
  useEffect(() => {
    const pusher = new Pusher("40e81c6fead48e0b15a8", {
      cluster: "us2",
    });

    const channel = pusher.subscribe(`${videoId}`);
    channel.bind("update", (data: number) => {
      setNum(Math.ceil(data));
    });
    channel.bind("closeVod", (bool: boolean) => {
      setConnectionClosed(bool);
    });
  }, [videoId, num]);
  return (
    <>
      {!connectionClosed && (
        <div className=" mx-auto    select-none space-y-5  px-5 pt-10 align-middle">
          <h1 className="-mb-5 text-4xl">{num}%</h1>
          <div
            style={{ width: `${num}%` }}
            className={`z-10  h-10 rounded-3xl bg-black`}
          />
          <Link
            className="text-blue-500 underline"
            href={`https://next-clip.herokuapp.com/video/${videoId}`}
          >
            Downloading new videos only works on heroku Click Here to visit!
          </Link>
        </div>
      )}
    </>
  );
};
