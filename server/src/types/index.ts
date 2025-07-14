export interface User {
  _id?: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  email?: string;
  suiAddresses: string[];
  roles: string[];
  tokenBalance: number;
  lastBalanceCheck?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleConfig {
  emoji: string;
  name: string;
  minBalance: number;
  id: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  email?: string;
}

export interface AuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface TokenBalanceData {
  balance: string;
  formatted: string;
} 