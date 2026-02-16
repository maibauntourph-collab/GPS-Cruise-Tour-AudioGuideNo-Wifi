import "dotenv/config";
import express from "express";
import session from "express-session";
import { registerRoutes } from "../server/routes";
import { setupAuthRoutes } from "../server/auth";
import { initializeOAuthProviders } from "../server/oauth-providers";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sessionSecret = process.env.SESSION_SECRET || "vercel-secret-fallback";

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

initializeOAuthProviders();
setupAuthRoutes(app);
registerRoutes(app);

// 테스트용 헬스체크 라우트
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Vercel API is working", time: new Date().toISOString() });
});

// Vercel Serverless Function handler
export default app;
