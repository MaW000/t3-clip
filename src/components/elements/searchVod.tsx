import { useState } from "react";
import { useRouter } from "next/navigation";

export const SearchVod = ({ ...props }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  function handleUrl() {
    const matches = url.match(/\d+/g);

    if (matches === null) {
      setError("Please enter a valid VideoID");
    } else {
      if (matches[0].length === 10) {
        router.push(`/video/${matches[0]}`);
      }
    }
  }

  return (
    <div
      className={
        " mt-3 ml-5  flex flex-col justify-center md:ml-7 lg:ml-0 lg:flex-row lg:space-x-5"
      }
      {...props}
    >
      <div
        className={`flex flex-col text-start  ${
          error && "border-b-2 border-b-amber-600"
        }`}
      >
        <label className="text-xs font-medium text-periwinkle-gray-500">
          TWITCH VOD URL
        </label>
        <input
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.twitch.tv/videos/1749256306"
          className="w-[40rem]"
        />
      </div>
      {error && (
        <div
          className="absolute bottom-[-2rem] left-[32rem] font-sans
         text-lg font-thin text-amber-600"
        >
          {error}
        </div>
      )}
      <div className={"mt-2 flex flex-row gap-3 lg:mt-0"}>
        {/* <Link href={`/videos/${url}`}> */}
        <button
          className="relative mt-3 inline-flex justify-center overflow-hidden rounded-lg bg-purple-400 py-2 px-3 text-sm font-semibold text-black outline-2 outline-offset-2 transition-colors before:absolute before:inset-0 before:transition-colors hover:before:bg-white/10 active:bg-purple-600 active:text-white/80 active:before:bg-transparent"
          onClick={handleUrl}
        >
          Submit
        </button>
        {/* </Link> */}
      </div>
    </div>
  );
};
