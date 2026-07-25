import Image from "next/image";
import Link from "next/link";
import { AiFillHeart } from "react-icons/ai";

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

/**
 * A VOD card. Home lays these out five across, browse two, so the grid belongs
 * to the caller and this only draws the card.
 *
 * The four corner tags sit on the thumbnail rather than beside it, which is
 * what lets the card stay this small without the metadata wrapping.
 */
export const VodThumbnails = ({ videos }: { videos: Videos[] }) => {
  return (
    <>
      {videos?.map((video) => {
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

        const tag =
          "absolute bg-slate-900/85 font-mono text-[10px] font-semibold text-periwinkle-gray-500";

        return (
          <Link
            key={video.videoId}
            href={`/video/${video.videoId}`}
            className="flex flex-col overflow-hidden rounded-[10px] border border-slate-900 bg-slate-800 transition duration-200 hover:-translate-y-0.5 hover:border-purple-600"
          >
            <div className="relative aspect-video bg-slate-900">
              <Image
                src={thumbnail}
                alt={video.title}
                fill={true}
                sizes="(min-width: 1024px) 20vw, 50vw"
                className="object-cover"
              />
              {video.date && (
                <span
                  className={`${tag} top-0 left-0 rounded-br-md px-1.5 py-0.5`}
                >
                  {formattedDate}
                </span>
              )}
              <span
                className={`${tag} top-0 right-0 rounded-bl-md px-1.5 py-0.5`}
              >
                {video.views.toLocaleString()}
              </span>
              <span className="absolute bottom-0 left-0 rounded-tr-md bg-slate-900/85 px-1.5 py-0.75 text-[11px] font-semibold text-purple-400">
                {video.streamer}
              </span>
              <span className="absolute right-0 bottom-0 flex items-center gap-1 rounded-tl-md bg-slate-900/85 px-1.5 py-0.75 font-mono text-[11px] font-semibold text-[#64ffda]">
                <AiFillHeart />
                {video.likes}
              </span>
            </div>
            <span className="text-periwinkle-gray-400 truncate px-2.5 py-2 text-[13px] font-semibold">
              {video.title}
            </span>
          </Link>
        );
      })}
    </>
  );
};
