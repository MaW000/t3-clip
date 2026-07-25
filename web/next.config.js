/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * There is a package.json at the repo root too (the dev task runner), so Next
   * would otherwise walk up, find two lockfiles and guess at the workspace root.
   * This app is self-contained - pin tracing to this directory.
   */
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),

  /**
   * Thumbnails, emotes and avatars are all hot-linked from third parties, so
   * every host next/image is allowed to fetch from has to be listed.
   *
   * The old pages-router config also set `i18n: { locales: ["en"] }`. The app
   * router does not support that key and the app was English-only anyway.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vod-secure.twitch.tv",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static-cdn.jtvnw.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.frankerfacez.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.betterttv.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.7tv.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default config;
