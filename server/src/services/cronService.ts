import cron from 'node-cron';
import { SuiClient } from '@mysten/sui/client';
import { Client as DiscordClient } from 'discord.js';
import mongoService from './mongoService';
import logger from '../logger';

// TR_WAL Token Configuration
const TR_WAL_TYPE = "0xa8ad8c2720f064676856f4999894974a129e3d15386b3d0a27f3a7f85811c64a::tr_wal::TR_WAL";
const TOKEN_DECIMALS = 1_000_000_000; // 9 decimals

// Role thresholds
const ROLE_THRESHOLDS = {
  DOLPHIN: 100,
  SHARK: 1000,
  WHALE: 10000,
};

// Role configurations
const ROLES = [
  { emoji: '🐬', name: 'Dolphin', minBalance: 100, id: process.env.DOLPHIN_ROLE_ID! },
  { emoji: '🦈', name: 'Shark', minBalance: 1000, id: process.env.SHARK_ROLE_ID! },
  { emoji: '🐳', name: 'Whale', minBalance: 10000, id: process.env.WHALE_ROLE_ID! }
];

const GUILD_ID = process.env.GUILD_ID!;

class CronService {
  private suiClient: SuiClient;
  private discordClient: DiscordClient | null = null;
  private isRunning: boolean = false;

  constructor() {
    // Initialize Sui client
    this.suiClient = new SuiClient({
      url: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443'
    });
  }

  // Set Discord client from main server
  public setDiscordClient(client: DiscordClient) {
    this.discordClient = client;
    logger.info('🤖 Discord client set for cron service');
  }

  // Get total token balance for an address
  private async getTokenBalance(address: string): Promise<number> {
    try {
      const { data: coinObjects } = await this.suiClient.getCoins({
        owner: address,
        coinType: TR_WAL_TYPE,
      });

      const totalBalance = coinObjects.reduce(
        (total, coin) => total + BigInt(coin.balance),
        BigInt(0)
      );

      return Number(totalBalance) / TOKEN_DECIMALS;
    } catch (error) {
      logger.error(`❌ Error getting token balance for ${address}:`, error);
      return 0;
    }
  }

  // Calculate total balance across all addresses for a user
  private async calculateTotalUserBalance(addresses: string[]): Promise<number> {
    let totalBalance = 0;
    
    for (const address of addresses) {
      const balance = await this.getTokenBalance(address);
      totalBalance += balance;
      logger.debug(`💰 Address ${address}: ${balance} TR_WAL`);
    }
    
    return totalBalance;
  }

  // Determine role based on balance
  private determineRole(balance: number): { emoji: string; name: string; minBalance: number; id: string } | null {
    // Sort roles by minBalance descending to get the highest eligible role
    const sortedRoles = [...ROLES].sort((a, b) => b.minBalance - a.minBalance);
    return sortedRoles.find(role => balance >= role.minBalance) || null;
  }

  // Update Discord roles for a user
  private async updateDiscordRoles(discordId: string, newRole: any): Promise<void> {
    if (!this.discordClient) {
      logger.warn('❌ Discord client not available, skipping role update');
      return;
    }

    try {
      const guild = this.discordClient.guilds.cache.get(GUILD_ID);
      if (!guild) {
        throw new Error(`Guild not found: ${GUILD_ID}`);
      }

      const member = await guild.members.fetch(discordId);
      if (!member) {
        logger.warn(`⚠️ Member not found in guild: ${discordId}`);
        return;
      }

      // Remove all role system roles first
      const rolesToRemove = ROLES.map(role => role.id).filter(id => id);
      const memberRolesToRemove = member.roles.cache.filter(role => rolesToRemove.includes(role.id));
      
      if (memberRolesToRemove.size > 0) {
        await member.roles.remove(memberRolesToRemove);
        logger.debug(`🗑️ Removed old roles from ${discordId}`);
      }

      // Add new role if eligible
      if (newRole && newRole.id) {
        const roleToAdd = guild.roles.cache.get(newRole.id);
        if (roleToAdd) {
          await member.roles.add(roleToAdd);
          logger.info(`✅ Added role ${newRole.name} to ${discordId}`);
        } else {
          logger.error(`❌ Role not found: ${newRole.name} (${newRole.id})`);
        }
      }

      // Update user roles in database
      const currentRoles = newRole ? [newRole.name] : [];
      await mongoService.updateUserRoles(discordId, currentRoles);

    } catch (error) {
      logger.error(`❌ Failed to update Discord roles for ${discordId}:`, error);
    }
  }

  // Main balance check function
  private async performBalanceCheck(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⏳ Balance check already running, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Starting automated balance check...');

    try {
      const users = await mongoService.getUsersForBalanceCheck();
      logger.info(`👥 Checking balances for ${users.length} users`);

      let updatedCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          if (!user.suiAddresses || user.suiAddresses.length === 0) {
            continue;
          }

          logger.info(`🔍 Checking balance for ${user.discordUsername} (${user.suiAddresses.length} addresses)`);
          
          const totalBalance = await this.calculateTotalUserBalance(user.suiAddresses);
          const previousBalance = user.tokenBalance || 0;
          
          // Update balance in database
          await mongoService.updateUserTokenBalance(user.discordId, totalBalance);
          
          // Determine new role and update Discord
          const newRole = this.determineRole(totalBalance);
          await this.updateDiscordRoles(user.discordId, newRole);
          
          // Log balance change
          if (Math.abs(totalBalance - previousBalance) > 0.01) {
            logger.info(`💰 Balance updated for ${user.discordUsername}: ${previousBalance} → ${totalBalance} TR_WAL`);
            
            if (newRole) {
              logger.info(`🎭 Role assigned: ${newRole.emoji} ${newRole.name}`);
            } else {
              logger.info(`🚫 No role assigned (insufficient balance)`);
            }
          }
          
          updatedCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          errorCount++;
          logger.error(`❌ Error checking balance for ${user.discordUsername}:`, error);
        }
      }

      logger.info(`✅ Automated balance check completed: ${updatedCount} users updated, ${errorCount} errors`);
      
    } catch (error) {
      logger.error('❌ Error during automated balance check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start the cron job
  public startBalanceCheckCron(): void {
    // Run every 24 hours at 00:00
    cron.schedule('0 0 * * *', async () => {
      await this.performBalanceCheck();
    }, {
      timezone: 'UTC'
    });

    logger.info('⏰ Balance check cron job scheduled (every 24 hours at 00:00 UTC)');
    
    // Optional: Run once immediately for testing (remove in production)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        logger.info('🧪 Running initial balance check for testing...');
        await this.performBalanceCheck();
      }, 10000); // Wait 10 seconds after server start
    }
  }

  // Manual trigger for testing
  public async triggerBalanceCheck(): Promise<void> {
    logger.info('🔄 Manually triggered balance check');
    await this.performBalanceCheck();
  }

  public isBalanceCheckRunning(): boolean {
    return this.isRunning;
  }
}

export default new CronService(); 