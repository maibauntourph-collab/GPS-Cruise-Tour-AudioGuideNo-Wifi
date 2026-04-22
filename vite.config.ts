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
                maxEntries: 1000, // Increased for better coverage
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 🖼️ [Designer Kim | 2026-04-04] 오프라인 사진 전략 통합 캐싱
            // Google, Viator, Unsplash, Wikipedia 등 모든 이미지 소스 캐싱
            urlPattern: /^https:\/\/(images\.unsplash\.com|source\.unsplash\.com|lh[0-9]\.googleusercontent.com|maps\.googleapis\.com|upload\.wikimedia\.org|.*\.viator\.com)\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'landmark-images',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 📡 API 데이터: NetworkFirst (네트워크 우선, 오프라인 fallback 1시간)
            urlPattern: /\/api\/(landmarks|cities).*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60, // 1 hour fallback only
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 🌐 [Bug Doctor | 2026-03-24] 번역 API 캐싱
            // 번역 데이터는 정적이므로 한번 로딩되면 캐시에서 바로 가져옵니다.
            urlPattern: /\/api\/translate.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'translation-data',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 180, // 180 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 🎨 [Designer Kim | 2026-03-20] 구글 폰트 및 스타일 캐싱 (Premium UX)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'wouter'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'canvas-confetti'],
          'vendor-maps': ['leaflet', 'react-leaflet', 'leaflet-routing-machine'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'nanoid'],
          'vendor-query': ['@tanstack/react-query'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      }
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});