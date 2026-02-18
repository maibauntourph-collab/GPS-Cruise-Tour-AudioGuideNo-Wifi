import type { Express, Request, Response, NextFunction } from "express";
import type { Session } from "express-session";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import crypto from "crypto";

// [문지기 부장의 보안 훈수: 통합 로그인 아키텍처]
// "에헴! 여러분, 로그인은 단순히 문을 여는 게 아닙니다. 
// 사용자가 누구인지, 어떤 열쇠(구글, 카카오, 왓츠앱 등)를 들고 왔는지 정확히 파악해야 하죠.
// 이 코드는 향후 10가지 이상의 소셜 로그인을 수용할 수 있는 Passport.js 기반의 확장형 구조를 목표로 설계되었습니다."

// [학습 가이드: 세션 및 인증 데이터 구조]
// 1. AuthSession: Express 서버 세션에 저장될 사용자 정보 정의
// 2. AuthRequest: Express 요청(Request) 객체에 세션 정보를 포함하도록 확장
interface AuthSession extends Session {
  userId?: string;
  user?: User;
  oauthState?: string;
}

interface AuthRequest extends Request {
  session: AuthSession;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthProvider {
  name: string;
  getAuthUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<OAuthTokens>;
  getUserProfile(accessToken: string): Promise<OAuthProfile>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface OAuthProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  raw: any;
}

const providers: Map<string, OAuthProvider> = new Map();

export function registerProvider(provider: OAuthProvider) {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): OAuthProvider | undefined {
  return providers.get(name);
}

export function getEnabledProviders(): string[] {
  return Array.from(providers.keys());
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function setupAuthRoutes(app: Express) {
  // [문지기 부장 감사 수정] ⚠️ 개발 전용 로그인 환경 가드 추가
  // 프로덕션에서는 이 엔드포인트가 완전히 비활성화됩니다.
  // 기존에는 환경 체크 없이 누구나 admin 등 모든 역할로 로그인 가능했던 치명적 보안 허점이 있었습니다.
  if (process.env.NODE_ENV === 'production') {
    app.get("/api/auth/dev-login/:role?", (_req, res: Response) => {
      res.status(404).json({ error: "[문지기 부장] 프로덕션 환경에서는 개발용 로그인이 허용되지 않습니다." });
    });
  } else {
    // [학습 가이드: 개발용 우회 로그인(Dev Bypass) API]
    // 실제 소셜 로그인(구글 등) 없이도 특정 권한(admin, guide 등)으로 즉시 로그인할 수 있게 해줍니다.
    // ⚠️ 이 라우트는 NODE_ENV !== 'production'일 때만 활성화됩니다.
    app.get("/api/auth/dev-login/:role?", async (req, res: Response) => {
      const role = req.params.role || "admin";
      console.log(`[Dr.'s Engine] 개발용 ${role} 로그인 요청 감지!`);

      const authReq = req as unknown as AuthRequest;
      try {
        // Find or create a default user for development based on role
        const providerUserId = `dev-${role}-id`;
        const displayName = `개발용 ${role.toUpperCase()}`;

        const user = await storage.findOrCreateUserByIdentity(
          "dev",
          providerUserId,
          {
            email: `${role}@example.com`,
            displayName: displayName,
            avatar: undefined,
            rawProfile: { role }
          }
        );

        // Ensure the user has the requested role
        user.role = role;
        await storage.updateUser(user.id, { role }); // DB에도 반영

        authReq.session.userId = user.id;
        authReq.session.user = user;

        authReq.session.save((err: Error | null) => {
          if (err) {
            console.error("[Auth] 세션 저장 실패:", err);
            return res.status(500).json({ error: "Session error" });
          }

          // [학습 가이드: 역할별 자동 리다이렉트]
          // 로그인 성공 후, 각 사용자의 전용 페이지로 자동으로 보내줍니다.
          let redirectPath = "/";
          if (role === "admin") redirectPath = "/admin";
          else if (role === "creator") redirectPath = "/admin"; // 크리에이터도 어드민 대시보드 사용
          else if (role === "guide") redirectPath = "/guide"; // 가이드 뷰
          else if (role === "tour_leader") redirectPath = "/tour-leader"; // 투어 리더 뷰
          else if (role === "shop_owner") redirectPath = "/admin"; // 코다리부장(상점주)도 어드민 결제/마케팅 확인

          const personaName = role === "shop_owner" ? "코다리부장" : role.toUpperCase();
          console.log(`[Auth] ${personaName} 세션 부여 완료! ${redirectPath}로 이동합니다.`);
          res.redirect(redirectPath);
        });
      } catch (error) {
        console.error("[Auth] 개발용 로그인 실패:", error);
        res.status(500).json({ error: "Dev login failed" });
      }
    });
  } // else 블록 종료 — dev-login만 개발 환경 전용, 아래 라우트들은 전 환경에서 사용

  app.get("/api/auth/providers", (_req, res: Response) => {
    res.json({ providers: getEnabledProviders() });
  });

  app.get("/api/auth/me", async (req, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.session.userId) {
      return res.json({ user: null });
    }

    try {
      const user = await storage.getUserById(authReq.session.userId);
      if (!user) {
        authReq.session.destroy(() => { });
        return res.json({ user: null });
      }

      const identities = await storage.getUserIdentitiesByUserId(user.id);
      const linkedProviders = identities.map(i => i.provider);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          locale: user.locale,
          role: user.role
        },
        linkedProviders
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/auth/:provider", (req, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const { provider: providerName } = req.params;
    const provider = getProvider(providerName);

    if (!provider) {
      return res.status(400).json({ error: `Provider ${providerName} not configured` });
    }

    const state = generateState();
    authReq.session.oauthState = state;
    authReq.session.save((err: Error | null) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      const authUrl = provider.getAuthUrl(state);
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/:provider/callback", async (req, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const { provider: providerName } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      console.error(`OAuth error from ${providerName}:`, error);
      return res.redirect(`/?auth_error=${encodeURIComponent(String(error))}`);
    }

    const provider = getProvider(providerName);
    if (!provider) {
      return res.redirect(`/?auth_error=provider_not_found`);
    }

    const savedState = authReq.session.oauthState;
    if (state !== savedState) {
      console.error("State mismatch:", { received: state, saved: savedState });
      return res.redirect(`/?auth_error=state_mismatch`);
    }

    try {
      const tokens = await provider.exchangeCodeForToken(String(code));
      const profile = await provider.getUserProfile(tokens.accessToken);

      const user = await storage.findOrCreateUserByIdentity(
        providerName,
        profile.id,
        {
          email: profile.email,
          displayName: profile.name,
          avatar: profile.avatar,
          rawProfile: profile.raw
        }
      );

      authReq.session.userId = user.id;
      authReq.session.user = user;
      delete authReq.session.oauthState;

      authReq.session.save((err: Error | null) => {
        if (err) {
          console.error("Session save error:", err);
          return res.redirect(`/?auth_error=session_error`);
        }
        res.redirect(`/?auth_success=true`);
      });
    } catch (error) {
      console.error(`OAuth callback error for ${providerName}:`, error);
      res.redirect(`/?auth_error=callback_failed`);
    }
  });

  app.post("/api/auth/logout", (req, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    authReq.session.destroy((err: Error | null) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthRequest;
  if (!authReq.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUserById(authReq.session.userId);
    if (!user || !roles.includes(user.role || "user")) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
