"use client";

import { SessionProvider } from "next-auth/react";

/**
 * `useSession` is used in the header and the like buttons, so the whole tree
 * needs a SessionProvider. This is the app-router replacement for the wrapper
 * that used to live in `pages/_app.tsx`.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
