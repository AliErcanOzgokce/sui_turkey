import mongoose from 'mongoose';
import User, { UserDocument } from '../models/User';
import { User as IUser } from '../types';
import logger from '../logger';

class MongoService {
  private isConnected: boolean = false;
  private mongoUri: string | undefined;

  constructor() {
    this.mongoUri = process.env.MONGODB_URI;
  }

  async connect(): Promise<void> {
    try {
      if (!this.mongoUri) {
        throw new Error('MongoDB URI is not configured');
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        retryWrites: true,
        w: 'majority' as const
      };

      await mongoose.connect(this.mongoUri, options);
      
      this.isConnected = true;
      logger.info('✅ Connected to MongoDB Atlas successfully');
      
      // Test the connection
      await this.testConnection();
      
    } catch (error) {
      this.isConnected = false;
      logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }
      await mongoose.connection.db.admin().ping();
      logger.info('🏓 MongoDB connection test successful');
    } catch (error) {
      logger.error('❌ MongoDB connection test failed:', error);
      throw error;
    }
  }

  async findUserByDiscordId(discordId: string): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.debug(`🔍 Finding user by Discord ID: ${discordId}`);
      const user = await User.findOne({ discordId }).exec();
      
      if (user) {
        logger.debug(`✅ User found: ${user.discordUsername}`);
      } else {
        logger.debug(`❌ User not found for Discord ID: ${discordId}`);
      }
      
      return user;
    } catch (error) {
      logger.error('❌ Error finding user by Discord ID:', error);
      throw error;
    }
  }

  async findUserBySuiAddress(suiAddress: string): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.debug(`🔍 Finding user by Sui address: ${suiAddress}`);
      const user = await User.findOne({ suiAddresses: suiAddress }).exec();
      
      if (user) {
        logger.debug(`✅ User found: ${user.discordUsername}`);
      } else {
        logger.debug(`❌ User not found for Sui address: ${suiAddress}`);
      }
      
      return user;
    } catch (error) {
      logger.error('❌ Error finding user by Sui address:', error);
      throw error;
    }
  }

  async addSuiAddressToUser(discordId: string, suiAddress: string): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      // First check if this address is already used by another user
      const existingUser = await this.findUserBySuiAddress(suiAddress);
      if (existingUser && existingUser.discordId !== discordId) {
        throw new Error('This Sui address is already linked to another Discord account');
      }

      logger.info(`➕ Adding Sui address ${suiAddress} to user: ${discordId}`);
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { 
          $addToSet: { suiAddresses: suiAddress },
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).exec();

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`✅ Sui address added to user: ${user.discordUsername}`);
      return user;
    } catch (error) {
      logger.error('❌ Error adding Sui address to user:', error);
      throw error;
    }
  }

  async removeSuiAddressFromUser(discordId: string, suiAddress: string): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.info(`➖ Removing Sui address ${suiAddress} from user: ${discordId}`);
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { 
          $pull: { suiAddresses: suiAddress },
          updatedAt: new Date()
        },
        { new: true }
      ).exec();

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`✅ Sui address removed from user: ${user.discordUsername}`);
      return user;
    } catch (error) {
      logger.error('❌ Error removing Sui address from user:', error);
      throw error;
    }
  }

  async createOrUpdateUser(userData: Partial<IUser>): Promise<UserDocument> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      if (!userData.discordId) {
        throw new Error('Discord ID is required');
      }

      logger.info(`💾 Creating or updating user: ${userData.discordId}`);
      
      const user = await User.findOneAndUpdate(
        { discordId: userData.discordId },
        { ...userData, updatedAt: new Date() },
        { 
          new: true, 
          upsert: true,
          runValidators: true 
        }
      ).exec();

      if (!user) {
        throw new Error('Failed to create or update user');
      }

      logger.info(`✅ User saved: ${user.discordUsername} (Balance: ${user.tokenBalance})`);
      return user;
    } catch (error) {
      logger.error('❌ Error creating or updating user:', error);
      throw error;
    }
  }

  async updateUserTokenBalance(discordId: string, tokenBalance: number): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { 
          tokenBalance, 
          lastBalanceCheck: new Date(),
          updatedAt: new Date() 
        },
        { new: true }
      ).exec();

      if (!user) {
        logger.warn(`❌ User not found for Discord ID: ${discordId}`);
      }

      return user;
    } catch (error) {
      logger.error('❌ Error updating user token balance:', error);
      throw error;
    }
  }

  async updateUserRoles(discordId: string, roles: string[]): Promise<UserDocument | null> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { roles, updatedAt: new Date() },
        { new: true }
      ).exec();

      if (!user) {
        logger.warn(`❌ User not found for Discord ID: ${discordId}`);
      }

      return user;
    } catch (error) {
      logger.error('❌ Error updating user roles:', error);
      throw error;
    }
  }

  async getUsersForBalanceCheck(): Promise<UserDocument[]> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.debug('📋 Fetching users with Sui addresses for balance check');
      const users = await User.find({ 
        suiAddresses: { $exists: true, $not: { $size: 0 } }
      }).exec();
      
      logger.debug(`✅ Found ${users.length} users with addresses`);
      return users;
    } catch (error) {
      logger.error('❌ Error fetching users for balance check:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<UserDocument[]> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.debug('📋 Fetching all users');
      const users = await User.find({}).exec();
      logger.debug(`✅ Found ${users.length} users`);
      
      return users;
    } catch (error) {
      logger.error('❌ Error fetching all users:', error);
      throw error;
    }
  }

  async deleteUser(discordId: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      logger.info(`🗑️ Deleting user: ${discordId}`);
      const result = await User.deleteOne({ discordId }).exec();
      
      if (result.deletedCount > 0) {
        logger.info(`✅ User deleted: ${discordId}`);
        return true;
      } else {
        logger.warn(`❌ User not found for deletion: ${discordId}`);
        return false;
      }
    } catch (error) {
      logger.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('🔌 Disconnected from MongoDB');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  isConnectedToMongo(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default new MongoService(); 