import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/StalkerTamagochi/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        id: "/StalkerTamagochi/",
        name: "ЗОНА — персональный КПК",
        short_name: "ЗОНА",
        description: "Заботься о своём сталкере. Исследуй Зону. Вернись живым.",
        lang: "ru",
        start_url: "/StalkerTamagochi/",
        scope: "/StalkerTamagochi/",
        display: "standalone",
        background_color: "#161a17",
        theme_color: "#202720",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        importScripts: ["notification-handler.js"],
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2,txt}"],
        globIgnores: ["**/scene.webp", "**/stalker.webp", "**/icon-192.png", "**/icon-512.png"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/StalkerTamagochi/index.html",
        cleanupOutdatedCaches: true,
        sourcemap: false,
      },
    }),
  ],
  build: { sourcemap: false },
});
