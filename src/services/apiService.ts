import { UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://magic.suitr.xyz';

interface UserResponse {
  success: boolean;
  user: UserProfile;
  auth?: any;
}

interface UsersResponse {
  success: boolean;
  users: UserProfile[];
  count: number;
}

class ApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${options.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  // Discord OAuth
  async processDiscordCallback(code: string): Promise<UserResponse> {
    return this.makeRequest<UserResponse>('/api/discord/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // User operations
  async findUserByDiscordId(discordId: string): Promise<UserProfile | null> {
    try {
      const response = await this.makeRequest<UserResponse>(`/api/user/${discordId}`);
      return response.user;
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    if (!userData.discordId) {
      throw new Error('Discord ID is required');
    }

    // For creating/updating users, we use the link-wallet endpoint if suiAddress is provided
    if (userData.suiAddress) {
      const response = await this.makeRequest<UserResponse>('/api/link-wallet', {
        method: 'POST',
        body: JSON.stringify({
          discordId: userData.discordId,
          suiAddress: userData.suiAddress,
        }),
      });
      return response.user;
    }

    // For other updates, we need to get existing user first and then update
    const existingUser = await this.findUserByDiscordId(userData.discordId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // For now, return the existing user as we don't have a general update endpoint
    // In a complete implementation, you'd add a PATCH /api/user/:discordId endpoint
    return { ...existingUser, ...userData } as UserProfile;
  }

  async updateUserTokenBalance(discordId: string, tokenBalance: number): Promise<void> {
    await this.makeRequest('/api/update-roles', {
      method: 'POST',
      body: JSON.stringify({
        discordId,
        tokenBalance,
      }),
    });
  }

  // Wallet management
  async linkWallet(discordId: string, suiAddress: string): Promise<UserProfile> {
    const response = await this.makeRequest<UserResponse>('/api/link-wallet', {
      method: 'POST',
      body: JSON.stringify({
        discordId,
        suiAddress,
      }),
    });
    return response.user;
  }

  async addWallet(discordId: string, suiAddress: string): Promise<UserProfile> {
    const response = await this.makeRequest<UserResponse>('/api/add-wallet', {
      method: 'POST',
      body: JSON.stringify({
        discordId,
        suiAddress,
      }),
    });
    return response.user;
  }

  async removeWallet(discordId: string, suiAddress: string): Promise<UserProfile> {
    const response = await this.makeRequest<UserResponse>('/api/remove-wallet', {
      method: 'POST',
      body: JSON.stringify({
        discordId,
        suiAddress,
      }),
    });
    return response.user;
  }

  async updateUserRoles(discordId: string, tokenBalance: number): Promise<any> {
    return this.makeRequest('/api/update-roles', {
      method: 'POST',
      body: JSON.stringify({
        discordId,
        tokenBalance,
      }),
    });
  }

  // Admin operations
  async getAllUsers(): Promise<UserProfile[]> {
    const response = await this.makeRequest<UsersResponse>('/api/users');
    return response.users;
  }

  async triggerBalanceCheck(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/api/trigger-balance-check', {
      method: 'POST',
    });
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      await this.makeRequest('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Role configurations
  async getRoleConfigurations(): Promise<any[]> {
    const response = await this.makeRequest<{ success: boolean; roles: any[] }>('/api/roles');
    return response.roles;
  }
}

export const apiService = new ApiService();

// Export individual functions for backward compatibility
export const findUserByDiscordId = (discordId: string) => apiService.findUserByDiscordId(discordId);
export const createOrUpdateUser = (userData: Partial<UserProfile>) => apiService.createOrUpdateUser(userData);
export const updateUserTokenBalance = (discordId: string, tokenBalance: number) => apiService.updateUserTokenBalance(discordId, tokenBalance);

// Export new functions
export const addWallet = (discordId: string, suiAddress: string) => apiService.addWallet(discordId, suiAddress);
export const removeWallet = (discordId: string, suiAddress: string) => apiService.removeWallet(discordId, suiAddress);
export const triggerBalanceCheck = () => apiService.triggerBalanceCheck(); 