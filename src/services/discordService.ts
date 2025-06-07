import { jwtDecode } from "jwt-decode";
import { UserProfile } from "../types";

// Discord OAuth2 Configuration
const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_DISCORD_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI;
const DISCORD_API = "https://discord.com/api/v10";

// Simple token implementation for browser
function createToken(payload: object): string {
  // This is a very simplified implementation - in production, use a proper JWT library on the server
  const base64Payload = btoa(JSON.stringify(payload));
  // Add a timestamp so the token "expires"
  const timestamp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return `${base64Payload}.${timestamp}`;
}

export async function getDiscordAuthUrl(): Promise<string> {
  const state = generateRandomState();
  const scope = "identify guilds.members.read";
  
  // Store state in localStorage to verify it later
  localStorage.setItem("discord_oauth_state", state);
  
  return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);
  
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params
  });
  
  if (!response.ok) {
    throw new Error(`Discord token exchange failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get Discord user: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

export function generateJWT(user: UserProfile): string {
  const payload = {
    discordId: user.discordId,
    suiAddress: user.suiAddress,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  return createToken(payload);
}

export function verifyJWT(token: string): { discordId: string; suiAddress: string | null } | null {
  try {
    const [payloadBase64, timestampStr] = token.split('.');
    const timestamp = Number(timestampStr);
    
    // Check if token has expired
    if (Date.now() > timestamp) {
      return null;
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(payloadBase64));
    return {
      discordId: payload.discordId,
      suiAddress: payload.suiAddress
    };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}

export async function updateDiscordRoles(discordId: string, roles: string[]): Promise<boolean> {
  // In a real implementation, this would call the Discord API to update the user's roles
  // For now, we'll just log that we would update the roles
  console.log(`Would update Discord roles for user ${discordId}:`, roles);
  return true;
} 