import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import type { Term } from "~/types/emote";
import type { SetCardsFunction, Card } from "~/types/commentCard";
export const EmoteCards = ({
  terms,
  videoId,
  setCards,
  cards,
}: {
  cards: Card[];
  setCards: SetCardsFunction;
  terms: Term[];
  videoId: number;
}) => {
  const [updatedTerms, setUpdatedTerms] = useState<Term[]>(terms);

  useEffect(() => {
    if (!terms || !cards) return;
    terms.sort((a, b) => b.amount - a.amount);

    const filteredTerms = terms.filter((term) =>
      cards.every((card) => card.keyword !== term.term)
    );
    setUpdatedTerms(filteredTerms);
  }, [terms, cards]);
  const comments = api.comment.getComments.useMutation({
    onSuccess: (data) => {
      if (!data || "message" in data) return;
      const newCards = [...cards, data];
      setCards(newCards);
    },
  });
  const handleTermClick = (clickedTerm: Term) => {
    comments.mutate({ videoId, keyword: clickedTerm.term });
    setUpdatedTerms(
      (prevTerms) =>
        prevTerms.filter((term) => term.emojiId !== clickedTerm.emojiId) // create new array without clicked term
    );
  };

  return (
    <div className={`scrollbar-x mx-5 flex gap-3 overflow-x-auto bg-slate-600`}>
      {updatedTerms?.map((term) => {
        const commas = term.amount
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return (
          <button
            key={term.emojiId}
            onClick={() => handleTermClick(term)}
            className=" mt-2 flex gap-2  rounded-lg p-1 px-2 transition duration-300 hover:border-slate-900 hover:bg-slate-900"
          >
            <div className="relative mt-3 h-10 w-10">
              <Image src={term.url} alt="emote" fill={true} />
            </div>
            <div className="mt-2">
              <div className="relative mb-2">
                <label className=" absolute left-1/2 -top-3.5 -translate-x-1/2 transform text-xs font-semibold text-periwinkle-gray-400 underline">
                  Term
                </label>
                <h1 className="py-1 text-center font-bold text-purple-500 ">
                  {term.term}
                </h1>
              </div>
              <div className="relative">
                <label className="absolute left-1/2 -top-3.5 -translate-x-1/2 transform text-xs font-semibold text-periwinkle-gray-400 underline">
                  Count
                </label>
                <h1 className="py-1 text-center font-bold text-[#64ffda]">
                  {commas}
                </h1>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
