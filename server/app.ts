console.log("[DEBUG] server/app.ts loading...");
import { Hono, Context, Next } from "hono";
import { logger } from "hono/logger";
import { sessionMiddleware, CookieStore } from "hono-sessions";
import { registerRoutes } from "./routes";
import { env } from "./env";
import { setupAuthRoutes, Variables } from "./auth";

// [적요: 로깅 함수 분리]
// server/vite.ts의 log 함수가 Node.js 전용일 수 있으므로 간단한 대체 구현 사용
const log = (message: string, source = "APP") => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] [${source}] ${message}`);
};

const app = new Hono<{ Variables: Variables }>();

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

// [적요: Cloudflare Workers를 위한 정수 파일 서빙 및 SPA 폴백]
// 1. 공통 index.html 로더 함수
async function getIndexHtml(c: Context) {
    const workerEnv = c.env as any;
    if (!workerEnv?.__STATIC_CONTENT) return null;

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
    return null;
}

// 2. 루트 및 SPA 라우팅 (API가 아닌 모든 경로는 index.html 서빙)
app.get("/", async (c, next) => {
    const html = await getIndexHtml(c);
    if (html) return c.html(html);
    return next();
});

// 3. 정적 자산 서빙 (assets/*, *.js, *.css 등)
app.get("/*", async (c, next) => {
    const path = c.req.path;
    const workerEnv = c.env as any;

    // API 요청은 통과
    if (path.startsWith("/api/")) return next();

    // 정적 자산인 경우 (확장자가 있거나 /assets/ 경로인 경우)
    const isAsset = path.includes(".") || path.startsWith("/assets/");

    if (isAsset && workerEnv?.__STATIC_CONTENT) {
        const { serveStatic: workerServeStatic } = await import("hono/cloudflare-workers");
        let manifest: any = undefined;
        try {
            // @ts-ignore
            const m = await import("__STATIC_CONTENT_MANIFEST");
            manifest = m.default ? (typeof m.default === 'string' ? JSON.parse(m.default) : m.default) : m;
        } catch (e) { }

        // 정적 파일 서빙 시도
        const res = await workerServeStatic({ root: "./", manifest })(c, next);

        // 파일이 발견되면 반환, 아니면 SPA 폴백으로 이동
        if (res && res.status !== 404) return res;
    }

    // [SPA Fallback] 파일이 없거나 자산이 아닌 경로(예: /home, /admin 등)는 index.html 서빙
    const html = await getIndexHtml(c);
    if (html) return c.html(html);

    return next();
});

export default app;
