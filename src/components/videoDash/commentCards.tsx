import type { Twitch, Card, SetCardsFunction } from "~/types/commentCard";
import { CardEle, Timestamps, Comments, TimestampFilter } from "./Cards";
export const CommentCards = ({
  playerRef,
  cards,
  setCards,
  player,
}: {
  player: Twitch | null;
  videoId: number;
  cards: Card[];
  setCards: SetCardsFunction;
  playerRef: React.RefObject<HTMLDivElement>;
}) => {
  if (!playerRef.current?.clientWidth) return <h1>Loading...</h1>;

  return (
    <div className="my-2 mr-2 flex flex-col gap-2 ">
      {cards?.map((card: Card) => {
        if (!card.url) return;

        if (!card.timestamps) {
          return (
            <CardEle
              toggle={true}
              key={card.id}
              card={card}
              cards={cards}
              setCards={setCards}
            />
          );
        } else {
          return (
            <div key={card.id}>
              <CardEle
                toggle={false}
                key={card.id}
                card={card}
                cards={cards}
                setCards={setCards}
              />
              <div className="scrollbar-x max-h-96 overflow-y-scroll rounded-b-xl bg-slate-900">
                <TimestampFilter
                  timestamps={card.timestamps}
                  cards={cards}
                  setCards={setCards}
                  card={card}
                />
                {card.timestamps?.map((timestamp) => {
                  if (!timestamp.messages) {
                    return (
                      <Timestamps
                        hide={true}
                        timestamp={timestamp}
                        key={timestamp.id}
                        cards={cards}
                        setCards={setCards}
                        player={player}
                        card={card}
                      />
                    );
                  } else {
                    return (
                      <div
                        key={timestamp.id}
                        className=" border border-slate-600 py-1 text-periwinkle-gray-500"
                      >
                        <Timestamps
                          hide={false}
                          timestamp={timestamp}
                          key={timestamp.id}
                          cards={cards}
                          setCards={setCards}
                          player={player}
                          card={card}
                        />
                        <div className="-mt-2 border-t-4 border-slate-800">
                          {timestamp.messages.map((message) => {
                            return (
                              <Comments message={message} key={message.id} />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
};
