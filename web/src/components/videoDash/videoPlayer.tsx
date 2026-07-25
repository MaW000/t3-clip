"use client";

import { useEffect, useState } from "react";
import type { Card, Selection, Timestamp } from "@/types/commentCard";
import { VodSide, EmoteCarousel, CommentPanel } from "@/components";
import { api } from "@/trpc/react";

interface Twitch {
  seek(time: number): void | null;
  destroy(): void | null;
}
interface TwitchObject {
  Player?: new (elementId: string, options: PlayerOptions) => Twitch;
}
interface PlayerOptions {
  width: string;
  height: string;
  video: number;
  time: string;
}
interface MyWindow extends Window {
  Twitch?: TwitchObject;
}

/**
 * The video dashboard: timestamps on the left, the VOD and its channel emotes
 * in the middle, the chat inside the selected block on the right.
 *
 * This owns the two things the three columns share - the cards built for this
 * VOD, and which timestamp block is selected - so the chat can be read in its
 * own panel rather than unfolding inside the card it came from.
 *
 * `indexing` is owned by VideoPageView so the job is queued whether or not the
 * Twitch embed script ever loads; `playerReady` says that script has landed.
 */
export const VideoDash = ({
  videoId,
  indexing,
  playerReady,
}: {
  videoId: number;
  indexing: boolean | undefined;
  playerReady: boolean;
}) => {
  const [player, setPlayer] = useState<Twitch | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Selection | null>(null);

  const { data: queryData } = api.card.getCards.useQuery({ videoId });

  //this query is invalidated as the worker makes progress, so merge rather
  //than replace: a card's timestamps and sort order are client-only state and
  //a plain reset would collapse every open card mid-run.
  useEffect(() => {
    if (!queryData) return;
    setCards((prev) =>
      queryData.map((fresh): Card => {
        const held = prev.find((card) => card.id === fresh.id);
        return held
          ? { ...fresh, timestamps: held.timestamps, sort: held.sort }
          : fresh;
      }),
    );
  }, [queryData]);

  //The embed fills the 16:9 box below, so nothing is measured here and there is
  //no re-init on resize - percentages let the iframe follow its column.
  useEffect(() => {
    if (!playerReady) return;
    const twitch: TwitchObject = (window as MyWindow).Twitch ?? {};
    if (!twitch.Player) return;

    const options: PlayerOptions = {
      width: "100%",
      height: "100%",
      video: videoId,
      time: "0h0m1s",
    };
    const initPlayer: Twitch = new twitch.Player("player", options);
    setPlayer(initPlayer);

    return () => {
      setPlayer(null);
      initPlayer.destroy();
    };
  }, [videoId, playerReady]);

  const loadMessages = api.card.getCardComments.useMutation({
    onSuccess: (data) => {
      const first = data[0];
      if (!first) return;
      setCards((prev) =>
        prev.map((card): Card => {
          if (card.id !== first.cardId) return card;
          return {
            ...card,
            timestamps: card.timestamps?.map((timestamp) =>
              timestamp.timestamp === first.timestamp
                ? { ...timestamp, messages: first.messages }
                : timestamp,
            ),
          };
        }),
      );
    },
  });

  //`seek` is false for the MSGS button, which only fills the chat panel, and
  //true for the timestamp itself, which also moves the VOD to that block
  const selectTimestamp = (card: Card, timestamp: Timestamp, seek: boolean) => {
    setSelected({ cardId: card.id, tsId: timestamp.id });
    if (seek) player?.seek(timestamp.contentOffsetSeconds);
    if (!timestamp.messages?.length) {
      loadMessages.mutate({ cardId: card.id, timestamp: timestamp.timestamp });
    }
  };

  //looked up every render, so collapsing the card holding the selection empties
  //the panel instead of leaving a stale block on screen
  const selectedCard =
    cards.find((card) => card.id === selected?.cardId) ?? null;
  const selectedTimestamp =
    selectedCard?.timestamps?.find(
      (timestamp) => timestamp.id === selected?.tsId,
    ) ?? null;

  return (
    <div className="grid grid-cols-1 items-start gap-3 px-4 xl:grid-cols-[minmax(0,0.5fr)_minmax(0,1.4fr)_minmax(0,0.7fr)]">
      <VodSide
        cards={cards}
        setCards={setCards}
        videoId={videoId}
        indexing={indexing}
        selected={selected}
        onSelect={selectTimestamp}
      />

      <section className="flex flex-col gap-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div
            id="player"
            className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full"
          />
          {/* stand-in until the embed script has built the player */}
          {!player && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[linear-gradient(160deg,#1a1b2e,#0b0c16)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-400/15">
                <div className="ml-1.5 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-purple-400" />
              </div>
              <div className="text-periwinkle-gray-800 font-mono text-xs tracking-[.12em]">
                TWITCH EMBED
              </div>
            </div>
          )}
        </div>

        <EmoteCarousel videoId={videoId} cards={cards} setCards={setCards} />
      </section>

      <CommentPanel
        card={selectedCard}
        timestamp={selectedTimestamp}
        loading={loadMessages.isPending}
      />
    </div>
  );
};
