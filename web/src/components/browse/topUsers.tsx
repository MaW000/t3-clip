import Image from "next/image";

interface User {
  name: string | null;
  likes: number;
  image: string | null;
}

/**
 * The leaderboard. Rank comes from the query's order rather than a stored
 * column, so it is the row index.
 */
export const TopUsers = ({ topUsers }: { topUsers: User[] }) => {
  return (
    <>
      {topUsers?.map((user, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[10px] border border-slate-900 bg-slate-800 px-3 py-2.5"
        >
          <span className="text-periwinkle-gray-900 w-6 shrink-0 font-mono text-[13px]">
            {i + 1}
          </span>

          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Profile Pic"}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-lg bg-slate-900" />
          )}

          <span className="text-periwinkle-gray-400 min-w-0 flex-1 truncate text-sm font-semibold">
            {user.name ?? "anonymous"}
          </span>

          <span className="font-mono text-xs text-[#64ffda]">
            {user.likes.toLocaleString()}
          </span>
        </div>
      ))}
    </>
  );
};
