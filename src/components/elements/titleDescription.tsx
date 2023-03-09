import React from "react";

export const TitleDescription = () => {
  return (
    <div className="mt-10 flex select-none flex-col items-center space-y-5 pt-20">
      <h1
        // onClick={clickLogo}
        className="text-6xl font-semibold text-purple-400 hover:cursor-pointer md:text-8xl"
      >
        PogInChat
      </h1>
      <p className="text-md px-5 text-center font-medium text-white md:text-lg lg:text-xl">
        Paste in a <span className="text-purple-400">Twitch VOD</span> and find
        the most{" "}
        <span className="font-bold uppercase text-red-500">
          hype moments!!!
        </span>
      </p>
    </div>
  );
};


