import { api } from "~/utils/api";
import { EmoteCards } from "@/elements";
import type { Term } from "~/types/emote";
export const EmoteCarousel = ({ videoId }: { videoId: number }) => {
  // const videoSaveRes = api.video.getVideo.useQuery({ videoId: videoId });
  // console.log(videoSaveRes);
  const a = api.emote.getComments.useQuery({ videoId: videoId });
  if (!a) return <h1>Erorr loading Emotes</h1>;
  const terms = a.data as Term[];

  return (
    <div className={`mx-5 flex rounded-b-xl bg-slate-600 pb-2`} id="container">
      <EmoteCards terms={terms} videoId={videoId} />
    </div>
  );
};
