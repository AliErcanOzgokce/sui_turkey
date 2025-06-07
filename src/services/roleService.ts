const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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
      console.log(`🔄 Updating roles for user ${discordUserId} with balance ${tokenBalance}`);
      console.log(`📡 API URL: ${API_BASE_URL}/update-roles`);
      
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

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}:`, errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const responseText = await response.text();
      console.log(`📝 Raw response:`, responseText);
      
      if (!responseText) {
        return {
          success: false,
          error: 'Empty response from server'
        };
      }

      const data = JSON.parse(responseText);
      console.log(`✅ Parsed response:`, data);
      
      return data;
    } catch (error) {
      console.error('❌ Role update error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to connect to server'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async checkServerHealth(): Promise<boolean> {
    try {
      console.log(`🏥 Health check: ${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`);
      console.log(`🏥 Health status: ${response.status}`);
      return response.ok;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}; 