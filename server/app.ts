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

// [적요: Cloudflare Workers를 위한 정수 파일 서빙 및 OG 태그 주입]
// 1. 루트 경로 (/) 처리: index.html 서빙 + OG 태그 주입
app.get("/", async (c) => {
    const workerEnv = c.env as any;

    if (!workerEnv?.__STATIC_CONTENT) {
        return c.text("Bucket not bound", 500);
    }

    try {
        // [연구소장 노트: 매니페스트에서 실제 키 찾기]
        let manifest: any = {};
        try {
            // @ts-ignore
            const m = await import("__STATIC_CONTENT_MANIFEST");
            const manifestStr = m.default || m;
            manifest = typeof manifestStr === 'string' ? JSON.parse(manifestStr) : manifestStr;
        } catch (e) {
            console.warn("[Worker] Manifest not found, will try direct access");
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
            return c.html(html);
        } else {
            // 폴백: 매니페스트가 어긋난 경우를 대비해 KV 목록에서 .html로 끝나는 파일 찾기 시도
            const list = await workerEnv.__STATIC_CONTENT.list({ limit: 20 });
            const fallbackKey = list.keys.find((k: any) => k.name.endsWith(".html"))?.name;
            if (fallbackKey) {
                const fallbackAsset = await workerEnv.__STATIC_CONTENT.get(fallbackKey, { type: "text" });
                if (fallbackAsset) return c.html(fallbackAsset);
            }
            return c.text("index.html not found", 404);
        }
    } catch (e: any) {
        return c.text(`Internal Error: ${e.message}`, 500);
    }
});

// 2. 나머지 정적 자산(CSS, JS, Images 등) 처리
app.get("/*", async (c, next) => {
    const workerEnv = c.env as any;
    if (workerEnv?.__STATIC_CONTENT) {
        const { serveStatic: workerServeStatic } = await import("hono/cloudflare-workers");

        let manifest: any = undefined;
        try {
            // @ts-ignore
            const m = await import("__STATIC_CONTENT_MANIFEST");
            manifest = m.default ? JSON.parse(m.default) : m;
        } catch (e) { }

        return workerServeStatic({ root: "./", manifest })(c, next);
    }
    return next();
});

export default app;
