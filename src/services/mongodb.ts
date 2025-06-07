import { UserProfile } from '../types';

// LocalStorage keys
const USERS_STORAGE_KEY = 'sui_turkey_users';

// Helper to get users from localStorage
function getStoredUsers(): Record<string, UserProfile> {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return {};
  }
}

// Helper to save users to localStorage
function saveStoredUsers(users: Record<string, UserProfile>): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

console.log('Using localStorage for user data storage');

// Mock implementation for development
export async function findUserByDiscordId(discordId: string): Promise<UserProfile | null> {
  try {
    console.log('Finding user by Discord ID:', discordId);
    const users = getStoredUsers();
    // Find user where discordId matches
    const user = Object.values(users).find(u => u.discordId === discordId);
    return user || null;
  } catch (error) {
    console.error("Error finding user by Discord ID:", error);
    return null;
  }
}

export async function findUserBySuiAddress(suiAddress: string): Promise<UserProfile | null> {
  try {
    console.log('Finding user by Sui address:', suiAddress);
    const users = getStoredUsers();
    // Find user where suiAddress matches
    const user = Object.values(users).find(u => u.suiAddress === suiAddress);
    return user || null;
  } catch (error) {
    console.error("Error finding user by Sui address:", error);
    return null;
  }
}

export async function updateUserTokenBalance(discordId: string, tokenBalance: number): Promise<void> {
  try {
    console.log('Updating token balance for user:', discordId, tokenBalance);
    const users = getStoredUsers();
    const user = Object.values(users).find(u => u.discordId === discordId);
    
    if (user) {
      user.tokenBalance = tokenBalance;
      user.updatedAt = new Date();
      users[user.discordId] = user;
      saveStoredUsers(users);
    }
  } catch (error) {
    console.error("Error updating user token balance:", error);
  }
}

export async function updateUserRoles(discordId: string, roles: string[]): Promise<void> {
  try {
    console.log('Updating roles for user:', discordId, roles);
    const users = getStoredUsers();
    const user = Object.values(users).find(u => u.discordId === discordId);
    
    if (user) {
      user.roles = roles;
      user.updatedAt = new Date();
      users[user.discordId] = user;
      saveStoredUsers(users);
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
  }
}

export async function createOrUpdateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
  try {
    console.log('Creating or updating user:', userData);
    if (!userData.discordId) {
      throw new Error('Discord ID is required');
    }
    
    const users = getStoredUsers();
    const now = new Date();
    
    // Check if user exists
    const existingUser = Object.values(users).find(u => u.discordId === userData.discordId);
    
    if (existingUser) {
      // Update existing user
      const updatedUser = {
        ...existingUser,
        ...userData,
        updatedAt: now
      };
      users[userData.discordId] = updatedUser;
      saveStoredUsers(users);
      return updatedUser;
    } else {
      // Create new user
      const newUser = {
        discordId: userData.discordId,
        discordUsername: userData.discordUsername || 'Unknown User',
        suiAddress: userData.suiAddress || null,
        roles: userData.roles || [],
        tokenBalance: userData.tokenBalance || 0,
        createdAt: now,
        updatedAt: now,
      } as UserProfile;
      
      users[userData.discordId] = newUser;
      saveStoredUsers(users);
      return newUser;
    }
  } catch (error) {
    console.error("Error creating or updating user:", error);
    throw error;
  }
} 