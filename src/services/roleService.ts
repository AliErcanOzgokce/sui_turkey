import { apiService } from './apiService';

export interface RoleUpdateResponse {
  success: boolean;
  user?: any;
  roles?: string[];
  tokenBalance?: number;
  error?: string;
  details?: string;
  message?: string;
}

export const roleService = {
  async updateUserRoles(discordUserId: string, tokenBalance: number): Promise<RoleUpdateResponse> {
    try {
      const response = await apiService.updateUserRoles(discordUserId, tokenBalance);
      
      return {
        success: true,
        user: response.user,
        roles: response.user?.roles,
        tokenBalance: response.user?.tokenBalance,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Role update failed:', error);
      
      return {
        success: false,
        error: 'Failed to update Discord roles',
        details: error.message || 'Unknown error occurred'
      };
    }
  },

  async checkServerHealth(): Promise<boolean> {
    try {
      const isHealthy = await apiService.checkHealth();
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}; 