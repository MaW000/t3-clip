import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
export const ProgressBar = ({ videoId }: { videoId: number }) => {
  const [num, setNum] = useState(0);

  useEffect(() => {
    const pusher = new Pusher("40e81c6fead48e0b15a8", {
      cluster: "us2",
    });

    const channel = pusher.subscribe(`${videoId}`);
    channel.bind("update", (data: number) => {
      setNum(Math.ceil(data));
    });
    if (num === 100) {
      channel.unbind_all();
      channel.unsubscribe();
      setNum(0);
    }
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [videoId, num]);
  return (
    <>
      {num > 0 && (
        <div className="mt-10 flex w-64 select-none flex-col items-center space-y-5 border-2 border-blue-500 pt-20">
          <h1>{num}</h1>
          <div style={{ width: `${num}%` }} className={`z-10 h-5  bg-black`} />
        </div>
      )}
    </>
  );
};
