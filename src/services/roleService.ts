const API_BASE_URL = 'http://localhost:3001/api';

export interface RoleUpdateResponse {
  success: boolean;
  user?: string;
  roles?: string[];
  tokenBalance?: number;
  error?: string;
  details?: string;
}

export const roleService = {
  async updateUserRoles(discordUserId: string, tokenBalance: number): Promise<RoleUpdateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/update-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discordUserId,
          tokenBalance
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update roles');
      }

      return data;
    } catch (error) {
      console.error('Role update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}; 