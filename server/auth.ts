import type { Express, Request, Response, NextFunction } from "express";
import type { Session } from "express-session";
import { storage } from "./storage";
import type { User } from "@shared/schema";

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
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function setupAuthRoutes(app: Express) {
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
        authReq.session.destroy(() => {});
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
