import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Link from "next/link";
export const ProgressBar = ({ videoId }: { videoId: number }) => {
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
        <div className="mt-10 flex w-64 select-none flex-col items-center space-y-5 border-2 border-blue-500 pt-20">
          <div>
            <h1 className="mx-10 my-5 text-xl font-semibold text-slate-900">
              Fetching comments this will take a while refresh in a few
              minutes...
            </h1>
            <Link
              className="text-blue-500 underline"
              href={`https://next-clip.herokuapp.com/video/${videoId}`}
            >
              Downloading new videos only works on heroku Click Here to visit!
            </Link>
          </div>
          <h1>{num}</h1>
          <div style={{ width: `${num}%` }} className={`z-10 h-5  bg-black`} />
        </div>
      )}
    </>
  );
};
