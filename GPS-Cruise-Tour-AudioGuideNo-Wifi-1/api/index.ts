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

// [연구소장 고정: Vercel 초기화 컨텍스트]
// 모든 라우트 등록이 완료될 때까지 대기하는 프로미스를 생성합니다.
const initPromise = registerRoutes(app);

export default async (req: any, res: any) => {
    // 라우트 등록이 완료될 때까지 대기
    await initPromise;
    // 익스프레스 앱 실해
    return app(req, res);
};
