import { type NextPage } from "next";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

const VideoDash: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const videoId = Array.isArray(id) ? id.join("") : id ?? "";
 
  if (videoId === "") {
    return <div>Invalid video ID</div>;
  }

  const hello = api.example.hello.useQuery({ videoId: videoId });
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      {hello?.data && <h1>{hello.data.greeting}</h1>}
    </main>
  );
};

export default VideoDash;
