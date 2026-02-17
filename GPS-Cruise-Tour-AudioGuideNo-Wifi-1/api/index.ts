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

// [연구소장 노트: Vercel 비동기 초기화 보장]
// registerRoutes는 비동기 함수이므로, 모든 라우트 등록이 완료된 후에만 
// Vercel의 서버리스 함수가 요청을 처리하도록 핸들러를 래핑합니다.
let routesRegistered = false;
const registrationPromise = registerRoutes(app).then(() => {
    routesRegistered = true;
    console.log("[Vercel API] Routes registered successfully");
});

export default async (req: any, res: any) => {
    if (!routesRegistered) {
        await registrationPromise;
    }
    return app(req, res);
};
