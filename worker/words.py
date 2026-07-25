"""Most-typed words in a VOD's chat, with stretched and spammed spellings of
the same word folded together.

Normalisation runs in three stages, each doing exactly one job:

  1. squeeze - runs of 3+ identical characters collapse to one, so "wwwww"
     becomes "w" and "slayyyy" becomes "slay". A run of exactly two is left
     alone on purpose: collapsing it turns "cool" into "col" and "too" into
     "to", merging words that are genuinely different.
  2. deloop  - a token that is one short string repeated collapses to the base,
     so "hahaha" becomes "ha" and "ww" becomes "w". This is what catches
     laughter, which has no repeated *character* to squeeze.
  3. alias   - the synonyms, which cannot be derived from spelling and need a
     curated map: "lmao" and "kek" are "lol".

The label stored for a group is the most common real spelling in it, not the
normalised key, so the key "col" is shown to the user as "cool".
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from typing import Any, Iterable

#Apostrophes stay so "don't" is one token; underscores stay because emote names
#use them.
TOKEN = re.compile(r"[a-z0-9_']+")

RUN = re.compile(r"(.)\1{2,}")

#a token that is one short string repeated: hahaha, xdxd, ww
LOOP = re.compile(r"^(.{1,3}?)\1{1,}$")

#Safe to apply to any token - nobody types "lmfao" meaning something else.
ALIASES = {
    "lmao": "lol",
    "lmfao": "lol",
    "lol": "lol",
    "kek": "lol",
    "lul": "lol",
    "rofl": "lol",
    "omegalul": "lol",
    "xd": "lol",
}

#Applied only when the token was a repeated loop, so "hehe" and "hahaha" fold
#into laughter while the pronoun "he" and the noun "ha" are left alone. These
#belong in ALIASES only if you want every "he" counted as a laugh.
LOOP_ALIASES = {"ha": "lol", "he": "lol", "hu": "lol", "ja": "lol", "xd": "lol"}

#Chat is mostly filler; without this the top of the list is "the", "a", "is".
#Single letters are deliberately absent - "w" and "l" are real chat words.
STOPWORDS = {
    "the", "a", "an", "is", "it", "to", "of", "and", "in", "i", "you", "for",
    "on", "that", "this", "he", "she", "they", "was", "are", "be", "with",
    "at", "so", "my", "me", "we", "but", "not", "have", "has", "do", "does",
    "just", "like", "what", "why", "how", "when", "if", "or", "as", "im",
    "its", "his", "her", "them", "there", "then", "than", "can", "get", "got",
    "am", "been", "were", "will", "would", "could", "should", "up", "out",
    "all", "no", "yes", "yeah", "one", "about", "from", "your", "our", "their",
}


def looks_like_emote(term: str) -> bool:
    """Whether a registered emote name is a real emote or just a word.

    Mirrors isPlainWord in the emote router. Genuine emotes are odd
    constructions - CamelCase, digits, punctuation, or long run-together
    combos: "TwitchConHYPE", "StreamerU2026", "bratchat", "<3". Channels also
    register plain words and slang ("LOL", "LUL", "WW"), and those are words,
    not emotes, so they belong in the keyword list where their spellings fold
    together.
    """
    if not term.isalpha():
        return True

    one_case = term == term.lower() or term == term.upper()
    return not (one_case and len(term) <= 5)


def normalise(token: str) -> str:
    """Fold one token to the key its group is counted under."""
    key = RUN.sub(r"\1", token)

    looped = LOOP.match(key)
    if looped:
        base = looped.group(1)
        key = LOOP_ALIASES.get(base, base)

    return ALIASES.get(key, key)


class WordCounter:
    """Accumulates word counts across a VOD's messages.

    Tracks the surface forms behind every key as well as the totals, because
    both the display label and the variant list the web app matches on are
    derived from them.
    """

    def __init__(self) -> None:
        self._totals: Counter[str] = Counter()
        self._surfaces: defaultdict[str, Counter[str]] = defaultdict(Counter)

    def add(self, message: str) -> None:
        for token in TOKEN.findall(message.lower()):
            key = normalise(token)
            if key in STOPWORDS or not key:
                continue
            self._totals[key] += 1
            self._surfaces[key][token] += 1

    def top(
        self,
        limit: int,
        *,
        exclude: Iterable[str] = (),
        min_count: int = 2,
    ) -> list[dict[str, Any]]:
        """The most-typed groups, ready to be written to the keywords table.

        `exclude` drops keys outright - the web app uses it to keep channel
        emotes out of the word list, since they already have their own carousel.
        """
        blocked = {normalise(word.lower()) for word in exclude}

        rows: list[dict[str, Any]] = []
        for key, total in self._totals.most_common():
            if len(rows) >= limit:
                break
            if key in blocked or total < min_count:
                continue

            surfaces = self._surfaces[key]
            rows.append(
                {
                    "key": key,
                    "label": surfaces.most_common(1)[0][0],
                    #most common first, and capped: a stretched word like
                    #"yoooo" can have hundreds of one-off spellings and the
                    #whole list ends up in a regex on the read side
                    "variants": [form for form, _ in surfaces.most_common(25)],
                    "amount": total,
                }
            )
        return rows
