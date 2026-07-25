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
        " mt-3 flex w-full flex-col items-stretch px-4 sm:flex-row sm:items-start sm:justify-center sm:px-5 lg:space-x-5"
      }
      {...props}
    >
      <div
        className={`flex w-full flex-col text-start sm:w-auto  ${
          error && "border-b-2 border-b-amber-600"
        }`}
      >
        <label className="text-base font-medium text-periwinkle-gray-500">
          TWITCH VOD URL
        </label>
        <input
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.twitch.tv/videos/1749256306"
          className="w-full max-w-full text-base sm:w-[30rem] sm:text-lg"
        />
        {error && (
          <div
            className="mt-1 font-sans text-base font-thin
         text-amber-600 sm:text-lg"
          >
            {error}
          </div>
        )}
      </div>
      <div className={"mt-3 flex flex-row gap-3 sm:mt-0 sm:ml-5"}>

        <button
          className="relative inline-flex w-full justify-center overflow-hidden rounded-lg bg-purple-400 py-2 px-3 text-sm font-semibold text-black outline-2 outline-offset-2 transition-colors before:absolute before:inset-0 before:transition-colors hover:before:bg-white/10 active:bg-purple-600 active:text-white/80 active:before:bg-transparent sm:mt-5 sm:w-auto"
          onClick={handleUrl}
        >
          Submit
        </button>

      </div>
    </div>
  );
};
