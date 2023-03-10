import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useState } from "react";
const VideoDash: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const videoId = Array.isArray(id) ? id.join("") : id ?? "";

  if (videoId === "") {
    return <div>Invalid video ID</div>;
  }
  const hello = api.example.hello.useQuery({ videoId: videoId });

  const helloo = api.example.deleteAll.useMutation({
    onSuccess: () => console.log("success"),
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      {hello?.data && <h1>{hello.data.greeting}</h1>}
      <button
        onClick={() => helloo.mutate({ videoId: videoId })}
        className="bg-black px-2 text-white"
      >
        Delete Comments
      </button>
    </main>
  );
};

export default VideoDash;
