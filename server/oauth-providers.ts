import type { OAuthProvider, OAuthTokens, OAuthProfile, OAuthConfig } from "./auth";
import { registerProvider } from "./auth";

function getBaseUrl(): string {
  return process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : `http://localhost:5000`;
}

class GoogleProvider implements OAuthProvider {
  name = "google";
  private config: OAuthConfig;
  
  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${getBaseUrl()}/api/auth/google/callback`
    };
  }
  
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "consent"
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error(`Google token exchange failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }
  
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Google profile fetch failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      raw: data
    };
  }
}

class FacebookProvider implements OAuthProvider {
  name = "facebook";
  private config: OAuthConfig;
  
  constructor() {
    this.config = {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      redirectUri: `${getBaseUrl()}/api/auth/facebook/callback`
    };
  }
  
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: "email,public_profile"
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri
    });
    
    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params}`);
    
    if (!response.ok) {
      throw new Error(`Facebook token exchange failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  }
  
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Facebook profile fetch failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture?.data?.url,
      raw: data
    };
  }
}

class KakaoProvider implements OAuthProvider {
  name = "kakao";
  private config: OAuthConfig;
  
  constructor() {
    this.config = {
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
      redirectUri: `${getBaseUrl()}/api/auth/kakao/callback`
    };
  }
  
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      state
    });
    return `https://kauth.kakao.com/oauth/authorize?${params}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    const response = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error(`Kakao token exchange failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }
  
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Kakao profile fetch failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    const kakaoAccount = data.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    
    return {
      id: String(data.id),
      email: kakaoAccount.email,
      name: profile.nickname,
      avatar: profile.profile_image_url,
      raw: data
    };
  }
}

class NaverProvider implements OAuthProvider {
  name = "naver";
  private config: OAuthConfig;
  
  constructor() {
    this.config = {
      clientId: process.env.NAVER_CLIENT_ID || "",
      clientSecret: process.env.NAVER_CLIENT_SECRET || "",
      redirectUri: `${getBaseUrl()}/api/auth/naver/callback`
    };
  }
  
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      state
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code
    });
    
    const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params}`);
    
    if (!response.ok) {
      throw new Error(`Naver token exchange failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: Number(data.expires_in)
    };
  }
  
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error(`Naver profile fetch failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    const profile = data.response || {};
    
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || profile.nickname,
      avatar: profile.profile_image,
      raw: data
    };
  }
}

export function initializeOAuthProviders() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    registerProvider(new GoogleProvider());
    console.log("Google OAuth provider registered");
  }
  
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    registerProvider(new FacebookProvider());
    console.log("Facebook OAuth provider registered");
  }
  
  if (process.env.KAKAO_CLIENT_ID) {
    registerProvider(new KakaoProvider());
    console.log("Kakao OAuth provider registered");
  }
  
  if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
    registerProvider(new NaverProvider());
    console.log("Naver OAuth provider registered");
  }
}
