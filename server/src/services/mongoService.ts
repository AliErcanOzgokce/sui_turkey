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
      const user = await User.findOne({ suiAddress }).exec();
      
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

      logger.debug(`💰 Updating token balance for ${discordId}: ${tokenBalance}`);
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { tokenBalance, updatedAt: new Date() },
        { new: true }
      ).exec();

      if (user) {
        logger.info(`✅ Token balance updated for ${user.discordUsername}: ${tokenBalance}`);
      } else {
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

      logger.debug(`🎭 Updating roles for ${discordId}:`, roles);
      
      const user = await User.findOneAndUpdate(
        { discordId },
        { roles, updatedAt: new Date() },
        { new: true }
      ).exec();

      if (user) {
        logger.info(`✅ Roles updated for ${user.discordUsername}:`, roles);
      } else {
        logger.warn(`❌ User not found for Discord ID: ${discordId}`);
      }

      return user;
    } catch (error) {
      logger.error('❌ Error updating user roles:', error);
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