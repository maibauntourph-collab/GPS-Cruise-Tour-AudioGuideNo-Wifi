console.log("[DEBUG] server/app.ts loading...");
import { Hono, Context, Next } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { sessionMiddleware, CookieStore } from "hono-sessions";
import { registerRoutes } from "./routes";
import { env } from "./env";
import { setupAuthRoutes, Variables } from "./auth";

// [적요: 로깅 함수 분리]
// server/vite.ts의 log 함수가 Node.js 전용일 수 있으므로 간단한 대체 구현 사용
export const log = (message: string, source = "APP") => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] [${source}] ${message}`);
};

const app = new Hono<{ Variables: Variables }>();

// [Security Fix | 🎖️] Antigravity 프리뷰 및 로컬 개발 환경 지원을 위한 CORS 및 오리진 허용
app.use("*", cors({
    origin: (origin) => {
        // [적요] credentials: true 설정 시 origin은 '*'이 될 수 없습니다. 
        // 요청된 origin이 있으면 그것을 반환하고, 없으면 명시적으로 허용하는 도메인을 지정합니다.
        if (!origin) return origin;
        if (origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("workers.dev")) {
            return origin;
        }
        return origin; // 개발 중에는 모든 오리진 허용 (배포 시 제한 권장)
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
}));

// [UX Fix] 모든 응답에 대해 프레임 임베딩 및 로컬 리소스 로드 허용
app.use("*", async (c, next) => {
    await next();
    // [적요] CSP 설정을 강화하여 localhost 환경 및 지도 데이터(OSM, Amap), 외부 리소스(Leaflet, Unsplash)를 허용합니다.
    const csp = [
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* https:",
        "frame-ancestors *",
        "img-src 'self' data: https: http: *.tile.openstreetmap.org *.tile.openstreetmap.de *.openstreetmap.org images.unsplash.com *.is.autonavi.com *.amap.com unpkg.com",
        "media-src 'self' data:",
        "connect-src 'self' http://localhost:* ws://localhost:* https: *.tile.openstreetmap.org *.tile.openstreetmap.de *.openstreetmap.org images.unsplash.com unpkg.com *.is.autonavi.com *.amap.com api.viator.com",
        "font-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https: unpkg.com",
        "style-src-elem 'self' 'unsafe-inline' https: unpkg.com",
        "worker-src 'self' blob:"
    ].join("; ");

    c.header("Content-Security-Policy", csp);
    c.header("X-Frame-Options", "ALLOWALL");
});

// Middleware
app.use("*", logger());

const store = new CookieStore();
// Middleware to handle session with dynamic secret
app.use("*", async (c, next) => {
    const workerEnv = c.env as any;
    const secret = workerEnv?.SESSION_SECRET || env.SESSION_SECRET || "default_secret_key_must_be_at_least_32_chars_long";
    const middleware = sessionMiddleware({
        store,
        encryptionKey: secret,
        expireAfterSeconds: 3600 * 24,
        cookieOptions: {
            path: "/",
            httpOnly: true,
            secure: (workerEnv?.NODE_ENV || env.NODE_ENV) === "production",
            maxAge: 3600 * 24,
        },
    });
    return middleware(c, next);
});

app.use("*", async (c: Context, next: Next) => {
    const start = Date.now();
    const path = c.req.path;
    const method = c.req.method;
    await next();
    const ms = Date.now() - start;
    log(`${method} ${path} ${c.res.status} in ${ms}ms`, "access");
});

setupAuthRoutes(app);
registerRoutes(app as any);

// [적요: Cloudflare Workers + Node.js 공용 index.html 로더]
// [Bug Doctor | 2026-03-29] KV가 없는 환경에서도 dist/index.html을 파일시스템에서 직접 읽어
// 404 없이 SPA를 서빙합니다. 환경에 따라 자동으로 전략을 선택합니다.

// Node.js 환경에서 fs/path를 동적으로 import (Cloudflare Workers에서는 사용 불가)
async function readIndexHtmlFromDisk(url: string): Promise<string | null> {
    try {
        // [적요] Cloudflare Workers 환경에서는 이 import 자체가 실패하므로 catch에서 null 반환
        const { default: fs } = await import("node:fs/promises");
        const { default: path } = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        // [적요] 로컬 dev: server/../dist/index.html, 프로덕션 빌드: dist-server/../dist/index.html
        const distPath = path.resolve(__dirname, "..", "dist", "index.html");
        const html = await fs.readFile(distPath, "utf-8");
        // OG 메타태그 주입 시도 (실패해도 html 그대로 반환)
        try {
            const { ogService } = await import("./services/ogService");
            return await ogService.injectMetaTags(html, url);
        } catch {
            return html;
        }
    } catch {
        return null;
    }
}

// 1. 공통 index.html 로더 함수
// [School Note] 전략 우선순위: ① Cloudflare KV → ② 파일시스템(Node.js) → ③ null
async function getIndexHtml(c: Context) {
    const workerEnv = c.env as any;

    // ① Cloudflare Workers KV 전략
    if (workerEnv?.__STATIC_CONTENT) {
        try {
            let manifest: any = {};
            try {
                // @ts-ignore - Wrangler가 주입하는 매니페스트
                const m = await import("__STATIC_CONTENT_MANIFEST");
                const manifestStr = m.default || m;
                manifest = typeof manifestStr === 'string' ? JSON.parse(manifestStr) : manifestStr;
            } catch (e) {
                console.warn("[Worker] Manifest not found/invalid");
            }

            const physicalKey = manifest["index.html"] || "index.html";
            const asset = await workerEnv.__STATIC_CONTENT.get(physicalKey, { type: "text" });

            if (asset) {
                let html: string = asset;
                try {
                    const { ogService } = await import("./services/ogService");
                    html = await ogService.injectMetaTags(html, c.req.url);
                } catch (ogError) {
                    console.error("[Worker] OG injection failed:", ogError);
                }
                return html;
            }
        } catch (e) {
            console.error("[Worker] Failed to load index.html from KV:", e);
        }
    }

    // ② 파일시스템 전략 (Node.js 로컬/프로덕션 빌드 환경)
    const fsHtml = await readIndexHtmlFromDisk(c.req.url);
    if (fsHtml) {
        console.log("[App] Serving index.html from filesystem");
        return fsHtml;
    }

    return null;
}

// [Server Park | 2026-03-29] 최소 HTML 셸 - KV가 없는 환경에서도 SPA가 기동되도록 보장
// 학생들에게: Cloudflare Workers Sites가 __STATIC_CONTENT를 자동 주입하지 못하면
// 이 fallback HTML이 React 앱을 로드합니다.
const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPS 오디오 가이드</title>
  <script>window.__SPA_FALLBACK__=true;<\/script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"><\/script>
</body>
</html>`;

// 2. 루트 및 SPA 라우팅 (API가 아닌 모든 경로는 index.html 서빙)
app.get("/", async (c, next) => {
    // [Fix | 2026-03-29] root URL → KV에서 읽고, 실패하면 Hono에게 패스 (Wrangler Sites가 처리)
    const html = await getIndexHtml(c);
    if (html) return c.html(html);
    // [Bug Doctor] KV 없는 환경: fallback으로 next() 대신 응답 보장
    console.warn("[App] / : getIndexHtml null → fallback response");
    return c.html(FALLBACK_HTML, 200);
});

// 3. 정적 자산 서빙 및 SPA 폴백 (assets/*, *.js, *.css 등)
app.get("/*", async (c, next) => {
    const path = c.req.path;
    const workerEnv = c.env as any;

    // API 요청은 통과
    if (path.startsWith("/api/")) return next();

    // 정적 자산 판별 (확장자가 있거나 /assets/ 경로인 경우)
    const isAsset = path.includes(".") || path.startsWith("/assets/");

    if (isAsset && workerEnv?.__STATIC_CONTENT) {
        const { serveStatic: workerServeStatic } = await import("hono/cloudflare-workers");
        let manifest: any = undefined;
        try {
            // @ts-ignore
            const m = await import("__STATIC_CONTENT_MANIFEST");
            const manifestStr = m.default || m;
            manifest = typeof manifestStr === 'string' ? JSON.parse(manifestStr) : manifestStr;
        } catch (e) {
            console.warn("[Worker] Manifest load failed during asset check");
        }

        // 정적 파일 서빙 시도
        try {
            const res = await workerServeStatic({ root: "./", manifest })(c, next);
            // 404가 아니면 해당 파일 반환
            if (res && res.status !== 404) {
                // [Server Park] 정적 자산(assets/* 및 공통 확장자)에 대해 강력한 캐싱 정책 적용 (1년)
                // immutable: 파일명이 바뀌지 않는 한(Vite 빌드 특성) 서버 확인 없이 캐시 사용
                if (path.startsWith("/assets/") || path.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)) {
                    c.header("Cache-Control", "public, max-age=31536000, immutable");
                }
                return res;
            }
        } catch (e) {

            console.error(`[Worker] Error serving asset ${path}:`, e);
        }

        // 자산(.js, .css 등)인데 파일을 못 찾은 경우(404)
        // 브라우저가 JS 대신 HTML을 읽어 Syntax Error가 발생하는 것을 방지하기 위해 404 반환
        if (path.includes(".")) {
            console.error(`[Worker] ASSET NOT FOUND: ${path}`);
            return c.text("Asset not found", 404);
        }
    }

    // [SPA Fallback | 2026-03-29]
    // 자산이 아닌 일반 경로(예: /home, /admin 등)는 index.html 서빙
    // 학생들: React Router(wouter)가 클라이언트 사이드에서 실제 경로를 처리합니다.
    console.log(`[Worker] SPA Fallback requested for: ${path}. workerEnv: ${!!workerEnv}`);
    const html = await getIndexHtml(c);
    if (html) return c.html(html);

    // [Bug Doctor | 2026-03-29] KV 없는 환경: next() 대신 fallback HTML 반환으로 404 차단
    console.warn(`[App] SPA fallback for ${path}: getIndexHtml null → fallback response`);
    return c.html(FALLBACK_HTML, 200);
});

export default app;
