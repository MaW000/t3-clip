"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
export const HeaderMain = ({ toggleSearch }: { toggleSearch: boolean }) => {
  const { data: sessionData } = useSession();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleUrl() {
    const matches = url.match(/\d+/g);
    if (matches === null) {
      setError("Please enter a valid VideoID");
    } else if (matches[0].length === 10) {
      router.push(`/video/${matches[0]}`);
    }
  }
  const name = sessionData?.user?.name?.split(' ')
  return (
    <header className=" flex flex-wrap items-center gap-3 px-4 py-4 md:grid md:grid-cols-12 md:gap-0 md:px-0 md:py-5 ">
      {/* search bar that shows on pages other than main */}
      <div
        className={`order-2 flex w-full md:order-none md:col-span-9 md:col-start-1 md:row-span-full ${
          toggleSearch ? "" : "hidden"
        }  md:ml-5 md:mr-5`}
      >
        <Link
          href="/"
          className="relative h-12 w-24 shrink-0 rounded-l-lg bg-purple-400 py-2 text-center font-mono text-sm  font-bold leading-none text-purple-600  transition duration-300 hover:bg-purple-600 hover:text-white hover:shadow-lg md:w-[15%] md:text-2xl"
        >
          NextClip
          <div className="absolute bottom-1  left-1/2 flex h-1 w-1/2 -translate-x-1/2  items-center justify-center bg-purple-400" />
        </Link>
        <input
          className="h-12 w-full min-w-0 flex-1 py-2 indent-2 text-base leading-none md:text-xl"
          placeholder="Vod url / Id"
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleUrl}
          className="group relative h-12 w-20 shrink-0 rounded-r-lg bg-purple-600 py-2 text-xs font-semibold text-white ring-purple-400 transition duration-300 hover:ring-2 md:w-[9%]"
        >
          Search
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-1/2 -translate-x-1/2 transform bg-white opacity-0 group-hover:opacity-100 group-hover:duration-500" />
        </button>
      </div>
      {/* login bar */}
      {error && (
        <h1 className="order-3 w-full text-sm text-amber-600 md:col-span-full">
          {error}
        </h1>
      )}
      {!sessionData ? (
        <div className=" order-1 ml-auto flex items-center justify-end gap-3 md:order-none md:ml-0 md:gap-10 md:col-start-11 md:col-end-13    ">
          <Link href="/browse" className=" py-3 px-5  bg-white/10 rounded-full   leading-none font-semibold text-white no-underline transition hover:bg-white/20">
            Browse
          </Link>
          <button
            className=" rounded-full py-3 px-6 md:px-10  bg-white/10 font-semibold text-white no-underline transition hover:bg-white/20"
            onClick={() => void signIn()}
          >
           Sign In
          </button>
        </div>
      ) : (
        <div className="order-1 ml-auto flex items-center overflow-hidden rounded-lg bg-gray-500 md:order-none md:col-start-10 md:-ml-9 md:col-end-13 md:mr-10 md:justify-end  ">
          <button
            className="  px-2 py-3  font-semibold leading-none text-sm text-white no-underline transition "
            onClick={() => void signOut()}
            >
          Sign Out
          </button>
          <Link href="/browse" className="py-[1.05rem] text-sm px-1 leading-none font-semibold text-white no-underline transition ">
            Browse
          </Link>
          {name?.[0] && <h1 className="py-3 px-1 hidden">{name[0]}</h1>}
            <div className="shrink-0">
              {sessionData.user.image && <Image className="rounded-r-lg" src={sessionData.user.image} alt="Profile Pic" height={50} width={50} />}
            </div>
        </div>
      )}
    </header>
  );
};
