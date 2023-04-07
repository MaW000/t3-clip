import Image from "next/image";
interface User {
    name: string | null;
    likes: number;
    image: string | null;
  }


export const TopUsers = ({topUsers}: {topUsers: User[]}) => {
 

  return (
  <>
      { topUsers &&  
        topUsers.map((user, i) => {
          const subname = user?.name?.substring(0, 7);
          return (
            <div
              key={i}
              className={
                " flex align-middle gap-5  justify-between  cursor-pointer rounded-md border-4 border-slate-900 bg-slate-700 p-2 mx-5 drop-shadow-lg"
              }
            >   
            {user.image &&  <Image src={user.image} alt="Profile Pic" width={50} height={50}  className="rounded-lg"/>}
            <div className="relative mt-2  mb-2">
                <label className=" absolute left-1/2 -top-3.5 -translate-x-1/2 transform text-xs font-semibold text-periwinkle-gray-400 underline">
                  Rank
                </label>
                <h1 className="py-1 font-bold text-purple-500 ">
                  {i + 1}
                </h1>
            </div>
            <div className="relative mb-2 mt-2">
                <label className=" absolute left-1/2 -top-3.5 -translate-x-1/2 transform text-xs font-semibold text-periwinkle-gray-400 underline">
                  User
                </label>
                <h1 className="py-1 font-bold text-purple-500 ">
                  {subname}
                </h1>
            </div>
            <div className="relative  mt-2">
                <label className=" absolute left-1/2 -top-3.5 -translate-x-1/2 transform text-xs font-semibold text-periwinkle-gray-400 underline">
                  Total
                </label>
                <h1 className="py-1 font-bold text-purple-500 ">
                  {user.likes}
                </h1>
            </div>

            </div>
          );
        })}
  </>
  );
};
