import "dotenv/config";
import express from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";
import { setupAuthRoutes } from "../server/auth";
import { initializeOAuthProviders } from "../server/oauth-providers";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    console.log(`[Vercel Request] ${req.method} ${req.url}`);
    console.log(`[Vercel Headers] host: ${req.headers.host}, x-forwarded-proto: ${req.headers['x-forwarded-proto']}`);

    // 라우트 매칭 디버깅
    const route = app._router.stack.find((layer: any) => {
        if (layer.route) {
            return layer.route.path === req.path;
        }
        return false;
    });
    console.log(`[Vercel Route Match] ${req.path} -> ${route ? 'Matched' : 'Not Matched'}`);
    next();
});

const sessionSecret = process.env.SESSION_SECRET || "vercel-secret-fallback";

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// [연구소장 노트: Vercel용 긴급 자가진단]
app.get("/api/health-check-minimal", (_req, res) => {
    res.json({ status: "alive", time: new Date().toISOString(), platform: "vercel" });
});

// 초기화 로직 (사전에 실행)
initializeOAuthProviders();
setupAuthRoutes(app);
const initPromise = registerRoutes(app);

export default async (req: any, res: any) => {
    try {
        // 엔진 시동 확인
        await initPromise;
        // 요청 처리
        return app(req, res);
    } catch (err: any) {
        console.error("[Vercel API Critical Error]", err);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Internal Server Error",
                message: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }
};
