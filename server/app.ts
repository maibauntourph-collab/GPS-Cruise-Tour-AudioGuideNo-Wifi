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
    const secret = c.env?.SESSION_SECRET || env.SESSION_SECRET || "default_secret_key_must_be_at_least_32_chars_long";
    const middleware = sessionMiddleware({
        store,
        encryptionKey: secret,
        expireAfterSeconds: 3600 * 24,
        cookieOptions: {
            path: "/",
            httpOnly: true,
            secure: (c.env?.NODE_ENV || env.NODE_ENV) === "production",
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

export default app;
