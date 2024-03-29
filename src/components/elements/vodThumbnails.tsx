import Image from "next/image";
import { useRouter } from "next/navigation";

interface Videos {
  streamer: string;
  videoId: number;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  language: string;
  date: string;
}
export const VodThumbnails = ({videos}:  {videos: Videos[]}) => {
  const router = useRouter();

  return (
  <>
      { videos &&  
        videos.map((video, i) => {
          let thumbnail: string;
          if (video.thumbnail.includes("vod-secure")) {
            thumbnail = video.thumbnail
              .replace(/%{width}/, "320")
              .replace(/%{height}/, "180");
          } else {
            thumbnail = video.thumbnail
              .replace(/%{width}/, "480")
              .replace(/%{height}/, "270");
          }
          const date = new Date(video.date);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          return (
            <div
              key={i}
              className={
                "relative w-52 cursor-pointer rounded-md border-4 border-slate-900 bg-slate-700 p-2 drop-shadow-lg"
              }
              onClick={() => router.push(`/video/${video.videoId}`)}
            >
              <div className={"relative"}>
                <Image
                  src={thumbnail}
                  height="270"
                  width={"480"}
                  alt="thumbnail"
                />
                <h1 className="absolute top-0 right-0 rounded-bl-md bg-teal-900 px-1 text-center font-mono text-xs font-semibold leading-4 text-zinc-300">
                  {video.views}
                </h1>
                <h1 className="absolute bottom-0 right-0 rounded-tl-md bg-teal-900 px-1 py-1 text-center font-sans text-xs font-semibold leading-4 text-zinc-300">
                  {video.streamer}
                </h1>
                <h1 className="absolute bottom-0 left-0  rounded-tl-md bg-teal-900 px-1 py-1 text-center font-sans text-xs font-semibold leading-4 text-zinc-300">
                  likes:{video.likes}
                </h1>
                {video.date && (
                  <h1 className="absolute top-0 left-0 rounded-br-md bg-teal-900 px-2 text-xs font-semibold text-zinc-300">
                    {formattedDate}
                  </h1>
                )}
              </div>
              <h1 className="truncate rounded-b-md  bg-slate-900 py-1 pl-1 text-sm font-extrabold text-zinc-300">
                {video.title}
              </h1>
            </div>
          );
        })}
  </>
  );
};
