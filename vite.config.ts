import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const now = new Date();
const deployDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    __DEPLOY_DATE__: JSON.stringify(deployDate),
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'GPS Audio Guide',
        short_name: 'GPS Guide',
        theme_color: '#e8633f',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // 🗺️ [Kodari | 2026-03-20] OSM 지도 타일 오프라인 캐싱
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 📡 [Server Park | 2026-03-20] Neon DB API 데이터 오프라인 캐싱
            // 학생들에게: No-WiFi 환경에서도 앱이 동작하도록 우리 API 응답도 브라우저에 저장합니다!
            urlPattern: /\/api\/(landmarks|cities).*/,
            handler: 'NetworkFirst', // 평소엔 최신 데이터를, 오프라인 시엔 저장된 걸 씁니다.
            options: {
              cacheName: 'api-data',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  root: "./client",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});