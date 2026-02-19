
import { Hono, Context, Next } from "hono";
import { storage } from "./storage";
import { User } from "@shared/schema";
import crypto from "node:crypto";
import { Session } from "hono-sessions";
import { env } from "./env";
import Stripe from "stripe";

// Initialize Stripe lazily
let stripeInstance: Stripe | null = null;
function getStripe() {
  if (stripeInstance) return stripeInstance;

  if (!env.STRIPE_SECRET_KEY) {
    console.warn("[회계부장 경고] ⚠️ STRIPE_SECRET_KEY 환경변수가 설정되지 않았습니다. 결제 기능이 비활성화됩니다.");
    return null;
  }
  // Check specific environment variables for Stripe if needed, or just rely on the key.

  stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any,
  });
  return stripeInstance;
}

// [문지기 부장의 보안 훈수: 통합 로그인 아키텍처]
// "에헴! 여러분, 로그인은 단순히 문을 여는 게 아닙니다. 
// 사용자가 누구인지, 어떤 열쇠(구글, 카카오, 왓츠앱 등)를 들고 왔는지 정확히 파악해야 하죠.
// 이 코드는 Hono 프레임워크로 마이그레이션되어 더욱 가볍고 빠르게 동작합니다."

// [학습 가이드: 세션 및 인증 데이터 구조]
// Hono Session을 사용하여 사용자 정보를 관리합니다.
// c.get('session')을 통해 접근합니다.

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


export type Variables = {
  session: Session;
  user?: User;
}

// Hono App type definition with Variables
type AppType = Hono<{ Variables: Variables }>;


export function setupAuthRoutes(app: AppType) {
  // [문지기 부장 감사 수정] ⚠️ 개발 전용 로그인 환경 가드 추가
  if (env.NODE_ENV === 'production') {
    app.get("/api/auth/dev-login/:role?", (c) => {
      return c.json({ error: "[문지기 부장] 프로덕션 환경에서는 개발용 로그인이 허용되지 않습니다." }, 404);
    });
  } else {
    // [학습 가이드: 개발용 우회 로그인(Dev Bypass) API]
    app.get("/api/auth/dev-login/:role?", async (c) => {
      const role = c.req.param("role") || "admin";
      console.log(`[Dr.'s Engine] 개발용 ${role} 로그인 요청 감지!`);

      const session = c.get('session');

      try {
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
        await storage.updateUser(user.id, { role });

        session.set("userId", user.id);
        session.set("user", user);

        // [학습 가이드: 역할별 자동 리다이렉트]
        let redirectPath = "/";
        if (role === "admin") redirectPath = "/admin";
        else if (role === "creator") redirectPath = "/admin";
        else if (role === "guide") redirectPath = "/guide";
        else if (role === "tour_leader") redirectPath = "/tour-leader";
        else if (role === "shop_owner") redirectPath = "/admin";

        const personaName = role === "shop_owner" ? "코다리부장" : role.toUpperCase();
        console.log(`[Auth] ${personaName} 세션 부여 완료! ${redirectPath}로 이동합니다.`);
        return c.redirect(redirectPath);

      } catch (error) {
        console.error("[Auth] 개발용 로그인 실패:", error);
        return c.json({ error: "Dev login failed" }, 500);
      }
    });
  }

  app.get("/api/auth/providers", (c) => {
    return c.json({ providers: getEnabledProviders() });
  });

  app.get("/api/auth/me", async (c) => {
    const session = c.get('session');
    const userId = session.get("userId");

    if (!userId) {
      return c.json({ user: null });
    }

    try {
      // @ts-ignore
      const user = await storage.getUserById(userId);
      if (!user) {

        session.set("userId", null);
        session.set("user", null);
        session.set("oauthState", null);

        return c.json({ user: null });
      }

      const identities = await storage.getUserIdentitiesByUserId(user.id);
      const linkedProviders = identities.map(i => i.provider);

      return c.json({
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
      return c.json({ error: "Failed to fetch user" }, 500);
    }
  });

  app.get("/api/auth/:provider", async (c) => {
    const providerName = c.req.param("provider");
    const provider = getProvider(providerName);

    if (!provider) {
      return c.json({ error: `Provider ${providerName} not configured` }, 400);
    }

    const state = generateState();
    const session = c.get('session');
    session.set("oauthState", state);

    // session save logic is usually automatic in Hono middleware, 
    // but if asynchronous store is used, we might rely on middleware to handle it at end of request.

    const authUrl = provider.getAuthUrl(state);
    return c.redirect(authUrl);
  });

  app.get("/api/auth/:provider/callback", async (c) => {
    const providerName = c.req.param("provider");
    const { code, state, error } = c.req.query();

    if (error) {
      console.error(`OAuth error from ${providerName}:`, error);
      return c.redirect(`/?auth_error=${encodeURIComponent(String(error))}`);
    }

    const provider = getProvider(providerName);
    if (!provider) {
      return c.redirect(`/?auth_error=provider_not_found`);
    }

    const session = c.get('session');
    const savedState = session.get("oauthState");

    if (state !== savedState) {
      console.error("State mismatch:", { received: state, saved: savedState });
      return c.redirect(`/?auth_error=state_mismatch`);
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


      session.set("userId", null);
      session.set("user", null);
      session.set("oauthState", null);


      return c.redirect(`/?auth_success=true`);
    } catch (error) {
      console.error(`OAuth callback error for ${providerName}:`, error);
      return c.redirect(`/?auth_error=callback_failed`);
    }
  });

  app.post("/api/auth/logout", (c) => {
    const session = c.get('session');
    // Destroy session
    // Hono sessions might have destroy method or we just clear it.
    // Assuming delete or similar.

    session.set("userId", null);
    session.set("user", null);

    // @ts-ignore
    if (typeof session.destroy === 'function') session.destroy();

    return c.json({ success: true });
  });
}

export async function requireAuth(c: Context<{ Variables: Variables }>, next: Next) {
  const session = c.get('session');
  if (!session.get("userId")) {
    return c.json({ error: "Authentication required" }, 401);
  }
  await next();
}

export function requireRole(...roles: string[]) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const session = c.get('session');
    const userId = session.get("userId");

    if (!userId) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // @ts-ignore
    const user = await storage.getUserById(userId);
    if (!user || !roles.includes(user.role || "user")) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  };
}
