/**
 * Pulls a Twitch VOD id out of whatever the user pasted.
 *
 * Both search bars used to do this inline as `url.match(/\d+/g)` followed by a
 * bare `if (matches[0].length === 10)`. Anything that was not exactly ten
 * digits - a clip url, a legacy VOD, a stray number - fell through with no
 * navigation and no error, so the submit button looked dead.
 *
 * Returns null when there is nothing that could plausibly be a VOD id, which
 * the callers turn into a visible message.
 */
export function parseVodId(input: string): number | null {
  //a real vod url names its id: twitch.tv/videos/2828464112, and /v/ for the
  //older form. Preferred over "first number in the string" so query params and
  //timestamps cannot win.
  const fromPath = /\/(?:videos?|v)\/(\d+)/.exec(input)?.[1];

  //otherwise accept a bare id. 8 digits and up: current ids are 10, legacy VODs
  //are shorter, and the floor keeps short junk like a clip slug's trailing
  //digits from being mistaken for an id.
  const id = fromPath ?? /\d{8,}/.exec(input)?.[0];
  if (!id) return null;

  const parsed = Number(id);
  //ids are ~2.8e9 today, so this only trips on something pathological
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
