// [적요: Express 서버 메인 진입점 — Vercel 서버리스 + 로컬 개발 호환]
// Vercel에서는 export default handler로 서버리스 함수로 실행됩니다.
// 로컬에서는 http.createServer로 직접 서버를 시작합니다.
// SESSION_SECRET이 없어도 fallback 값으로 서버가 종료되지 않습니다.

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuthRoutes } from "./auth";
import { initializeOAuthProviders } from "./oauth-providers";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// [적요: 세션 시크릿 — process.exit(1) 제거]
// Vercel 서버리스 환경에서 환경변수 누락 시 즉시 종료되는 문제 방지
const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-change-me';

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

// [적요: 요청 로깅 미들웨어]
// API 요청의 메서드, 경로, 상태코드, 응답시간을 로그로 출력합니다.
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// [적요: DB 자가진단 서비스]
import { dbCheckService } from "./services/dbCheckService";

// [적요: 앱 초기화 함수 — 서버리스 환경용]
// IIFE 대신 initializeApp() 함수로 분리하여
// Vercel 서버리스에서 첫 요청 시 한 번만 실행되도록 합니다.
let initialized = false;
async function initializeApp() {
  if (initialized) return;
  initialized = true;

  // [적요: 라우트 등록]
  await registerRoutes(app);

  // [적요: 글로벌 에러 핸들러]
  // 모든 라우트에서 잡히지 않은 에러를 여기서 처리합니다.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // [적요: 프로덕션에서만 정적 파일 서빙]
  // 개발환경에서는 아래 로컬 실행 블록에서 Vite Dev Server를 설정합니다.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }
}

// [적요: 로컬 실행 시에만 HTTP 서버 시작]
// Vercel 프로덕션 환경에서는 이 블록이 실행되지 않습니다.
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  initializeApp().then(async () => {
    const { createServer } = await import('http');
    const server = createServer(app);
    const port = parseInt(process.env.PORT || '5001', 10);

    // [적요: 개발 환경에서 Vite HMR(Hot Module Replacement) 설정]
    // setupVite는 server 인스턴스가 필요하므로 여기서 호출합니다.
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    }

    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  });
}

// [적요: Vercel 서버리스 핸들러]
// api/index.ts에서 이 함수를 import하여 사용합니다.
// 첫 요청 시 initializeApp()이 한 번만 실행됩니다.
export default async function handler(req: any, res: any) {
  await initializeApp();
  app(req, res);
}

export { app };
