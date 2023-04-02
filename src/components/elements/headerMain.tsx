import { signIn, signOut, useSession } from "next-auth/react";
// import { api } from "~/utils/api";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
export const HeaderMain = ({ toggleSearch }: { toggleSearch: boolean }) => {
  const { data: sessionData } = useSession();

  // const { data: secretMessage } = api.video.getSecretMessage.useQuery(
  //   undefined,
  //   { enabled: sessionData?.user !== undefined }
  // );
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
    <header className=" grid grid-cols-12 py-5">
      {/* search bar that shows on pages other than main */}
      <div
        className={`col-span-9 col-start-1 row-span-full ${
          toggleSearch ? "" : "hidden"
        }  ml-5 mr-5`}
      >
        <Link
          href="/"
          className="relative inline-block h-12 w-[15%]  rounded-l-lg bg-purple-400 py-2 text-center  font-mono  text-3xl  font-bold leading-none text-purple-600  transition duration-300 hover:bg-purple-600 hover:text-white hover:shadow-lg"
        >
          NextClip
          <div className="absolute bottom-1  left-1/2 flex h-1 w-1/2 -translate-x-1/2  items-center justify-center bg-purple-400" />
        </Link>
        <input
          className="h-12 w-[72%] py-2 indent-2 align-top text-xl leading-none"
          placeholder="Vod url / Id"
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleUrl}
          className="group relative inline-block h-12 w-[9%] rounded-r-lg bg-purple-600 py-2 align-top font-semibold text-white ring-purple-400 transition duration-300 hover:ring-2"
        >
          Search
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-1/2 -translate-x-1/2 transform bg-white opacity-0 group-hover:opacity-100 group-hover:duration-500" />
        </button>
      </div>
      {/* login bar */}
      {error && <h1>{error}</h1>}
      {!sessionData ? (
        <div className=" col-end-13    ">
          <button
            className="mr-0 -ml-2  rounded-full  bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            onClick={() => void signIn()}
          >
           Sign In
          </button>
        </div>
      ) : (
        <div className="col-start-10 -ml-11 col-end-13 rounded-lg mr-10 flex bg-gray-500 justify-end  ">
          <button
            className="  px-10 py-3  font-semibold text-white no-underline transition "
            onClick={() => void signIn()}
            >
          Sign Out
          </button>
          <Link href="/browse" className="py-3 px-10 font-semibold text-white no-underline transition ">
            Browse
          </Link>
          {name && name[0] && <h1 className="py-3 px-5">{name[0]}</h1>}
            <div >
              {sessionData.user.image && <Image className="rounded-r-lg" src={sessionData.user.image} alt="Profile Pic" height={50} width={50} />}
            </div>
        </div>
      )}
    </header>
  );
};
