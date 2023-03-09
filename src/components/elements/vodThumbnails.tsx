import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export const VodThumbnails = ({}) => {
  const [videos, setVideos] = useState([]);
  const router = useRouter();
  //   useEffect(() => {
  //     const endpoint = `/api/video/data`;
  //     fetch(endpoint, {
  //       method: "GET",
  //      headers: {
  //         "Content-Type": "application/json",
  //       },
  //     })
  //       .then(async (res) => await res.json())
  //       .then((res) => {
  //         setVideos(res.data);
  //       });
  //   }, []);
  return (
    <div
      className={`mx-auto mt-10 flex gap-4 rounded-lg bg-slate-500 p-2 ${
        videos ? "" : "hidden"
      }`}
    >
      {/* {videos.length >= 1 &&
        videos.map((video, i) => {
          return (
            <div
              key={i}
              className={
                "relative w-56 cursor-pointer rounded-md border-4 border-slate-900 bg-slate-700 p-2 drop-shadow-lg"
              }
              onClick={() => router.push(`/video/${video.videoId}`)}
            >
              <div className={"relative"}>
                <Image
                  src={video.thumbnail}
                  height="270"
                  width={"480"}
                  alt="thumbnail"
                />
                <h1 className="absolute top-0 right-0 rounded-bl-md bg-teal-900 px-1 text-center font-mono text-xs font-semibold leading-4 text-zinc-300">
                  {video.views}
                </h1>
                <h1 className="font- absolute bottom-0 right-0 rounded-tl-md bg-teal-900 px-1 text-center font-sans text-xs font-semibold leading-4 text-zinc-300">
                  {video.streamer}
                </h1>
                {video.date && (
                  <h1 className="absolute top-0 left-0 rounded-br-md bg-teal-900 px-2 text-xs font-semibold text-zinc-300">
                    {video.date}
                  </h1>
                )}
              </div>
              <h1 className="truncate rounded-b-md  bg-slate-900 py-1 pl-1 text-xs font-extrabold text-zinc-300">
                {video.title}
              </h1>
            </div>
          );
        })} */}
    </div>
  );
};
