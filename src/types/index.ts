export interface UserProfile {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  email?: string;
  suiAddress: string | null;
  roles: string[];
  tokenBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenBalance {
  objectId: string;
  balance: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  requiredTokens: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
} 