import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
export const HeaderSearch = () => {
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
  return (
    <div className={`col-span-9 col-start-1 row-span-full  ml-5`}>
      <Link
        href="/"
        className="relative inline-block w-[15%] rounded-l-lg bg-[black] py-2  text-center  text-xl font-semibold text-purple-400 transition duration-300 hover:bg-purple-600 hover:text-white hover:shadow-lg"
      >
        NextClip
        <div className="absolute bottom-2  left-1/2 flex h-1 w-1/2 -translate-x-1/2  items-center justify-center bg-purple-400" />
      </Link>
      <input
        className="w-[75%] py-2 indent-2 text-xl"
        placeholder="Vod url / Id"
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={handleUrl}
        className="no-de w-[9%] rounded-r-lg bg-purple-600 py-2 text-lg font-semibold text-white ring-purple-400 transition duration-300 hover:ring-2"
      >
        Search
      </button>
    </div>
  );
};
