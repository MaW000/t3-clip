import { api } from "~/utils/api";
import { EmoteCards } from "~/components";
import type { Term } from "~/types/emote";
import type { SetCardsFunction, Card } from "~/types/commentCard";
export const EmoteCarousel = ({
  videoId,
  setCards,
  cards,
}: {
  cards: Card[];
  videoId: number;
  setCards: SetCardsFunction;
}) => {
  const a = api.emote.getComments.useQuery({ videoId: videoId });
  if (!a) return <h1>Erorr loading Emotes</h1>;
  const terms = a.data as Term[];

  return (
    <div className={`mx-5 flex rounded-b-xl bg-slate-600 pb-2`} id="container">
      <EmoteCards
        terms={terms}
        videoId={videoId}
        cards={cards}
        setCards={setCards}
      />
    </div>
  );
};
