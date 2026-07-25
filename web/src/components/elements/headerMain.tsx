"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { parseVodId } from "@/lib/vodId";

/**
 * Two headers in one: the home page is just the pills on the right, every other
 * page puts the logo and the vod search in front of them.
 */
export const HeaderMain = ({ toggleSearch }: { toggleSearch: boolean }) => {
  const { data: sessionData } = useSession();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleUrl() {
    const videoId = parseVodId(url);

    if (videoId === null) {
      setError("Please enter a valid Twitch VOD url or id");
      return;
    }

    setError("");
    router.push(`/video/${videoId}`);
  }

  const pill =
    "rounded-full bg-white/10 px-5 py-3 text-[15px] leading-none font-semibold text-white no-underline transition hover:bg-white/20 hover:text-white";

  return (
    <header
      className={`flex flex-wrap items-center gap-4 py-5 ${
        toggleSearch ? "px-6 md:grid md:grid-cols-12" : "px-6 md:px-10"
      }`}
    >
      {/* search bar that shows on pages other than main */}
      {toggleSearch && (
        <div className="order-2 flex w-full md:order-0 md:col-span-8 md:col-start-1 md:row-span-full">
          <Link
            href="/"
            className="h-12 w-32 shrink-0 rounded-l-lg bg-purple-400 text-center font-mono text-lg leading-12 font-bold text-purple-600 transition duration-300 hover:bg-purple-600 hover:text-white md:w-38 md:text-xl"
          >
            NextClip
          </Link>
          {/* not the shared `field` utility: its `border` shorthand would put a
              hairline down both sides of the group. Top and bottom only. */}
          <input
            className="border-periwinkle-gray-800 placeholder:text-periwinkle-gray-900 h-12 w-full min-w-0 flex-1 border-y bg-[#1f2030] px-3.5 py-2 text-base text-white outline-none focus:border-purple-400"
            placeholder="Vod url / Id"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrl()}
          />
          <button
            onClick={handleUrl}
            className="h-12 w-26 shrink-0 cursor-pointer rounded-r-lg bg-purple-600 text-sm font-semibold text-white ring-purple-400 transition duration-300 hover:ring-2"
          >
            Search
          </button>
        </div>
      )}

      {error && (
        <p className="order-3 w-full text-sm text-amber-600 md:col-span-full">
          {error}
        </p>
      )}

      {/* login bar */}
      <div
        className={`order-1 ml-auto flex items-center justify-end gap-3 md:order-0 ${
          toggleSearch ? "md:col-start-10 md:col-end-13 md:ml-0" : ""
        }`}
      >
        <Link href="/browse" className={pill}>
          Browse
        </Link>
        {!sessionData ? (
          <button
            className={`${pill} cursor-pointer px-7`}
            onClick={() => void signIn()}
          >
            Sign In
          </button>
        ) : (
          <>
            <button
              className={`${pill} cursor-pointer`}
              onClick={() => void signOut()}
            >
              Sign Out
            </button>
            {sessionData.user.image && (
              <Image
                className="shrink-0 rounded-lg"
                src={sessionData.user.image}
                alt="Profile Pic"
                height={44}
                width={44}
              />
            )}
          </>
        )}
      </div>
    </header>
  );
};
