// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Client, GatewayIntentBits, Role } from 'discord.js';
import mongoService from './services/mongoService';
import { RoleConfig, DiscordUser, AuthData, TokenBalanceData } from './types';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000', 
    'https://auth.suitr.xyz',
    'https://sui-turkey.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Discord Bot Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// Role configurations
const ROLES: RoleConfig[] = [
  { emoji: '🐬', name: 'Dolphin', minBalance: 100, id: process.env.DOLPHIN_ROLE_ID! },
  { emoji: '🦈', name: 'Shark', minBalance: 1000, id: process.env.SHARK_ROLE_ID! },
  { emoji: '🐳', name: 'Whale', minBalance: 10000, id: process.env.WHALE_ROLE_ID! }
];

const GUILD_ID = process.env.GUILD_ID!;

// Initialize MongoDB connection
async function initializeDatabase(): Promise<void> {
  try {
    await mongoService.connect();
    logger.info('🗄️ Database connection established');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

// Discord Bot Event Handlers
client.once('ready', () => {
  if (client.user) {
    logger.info(`🤖 Discord bot logged in as ${client.user.tag}`);
  }
});

client.on('error', (error) => {
  logger.error('❌ Discord client error:', error);
});

// Helper Functions
function determineRole(balance: number): RoleConfig | null {
  // Sort roles by minBalance descending to get the highest eligible role
  const sortedRoles = [...ROLES].sort((a, b) => b.minBalance - a.minBalance);
  return sortedRoles.find(role => balance >= role.minBalance) || null;
}

async function updateDiscordRoles(discordId: string, newRole: RoleConfig | null): Promise<void> {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      throw new Error(`Guild not found: ${GUILD_ID}`);
    }

    const member = await guild.members.fetch(discordId);
    if (!member) {
      throw new Error(`Member not found: ${discordId}`);
    }

    // Remove all role system roles first
    const rolesToRemove = ROLES.map(role => role.id);
    const memberRolesToRemove = member.roles.cache.filter(role => rolesToRemove.includes(role.id));
    
    if (memberRolesToRemove.size > 0) {
      await member.roles.remove(memberRolesToRemove);
    }

    // Add new role if eligible
    if (newRole) {
      const roleToAdd = guild.roles.cache.get(newRole.id);
      if (roleToAdd) {
        await member.roles.add(roleToAdd);
      } else {
        throw new Error(`Role not found: ${newRole.name} (${newRole.id})`);
      }
    }

    // Update user roles in database
    const currentRoles = newRole ? [newRole.name] : [];
    await mongoService.updateUserRoles(discordId, currentRoles);

  } catch (error) {
    logger.error(`❌ Failed to update Discord roles for ${discordId}:`, error);
    throw error;
  }
}

// API Routes

// Health check
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoService.isConnectedToMongo(),
    discord: client.isReady()
  };
  
  res.json(health);
});

// Discord OAuth callback
app.post('/api/discord/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      logger.error('❌ Failed to exchange Discord code for token:', responseText);
      return res.status(400).json({ 
        error: 'Failed to exchange authorization code',
        details: responseText 
      });
    }

    const authData = JSON.parse(responseText) as AuthData;

    // Get user information
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const userErrorText = await userResponse.text();
      logger.error('❌ Failed to fetch Discord user info:', userErrorText);
      return res.status(400).json({ error: 'Failed to fetch user information' });
    }

    const discordUser = await userResponse.json() as DiscordUser;

    // Create or update user in database
    const userData = {
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: discordUser.avatar,
      email: discordUser.email,
    };

    const user = await mongoService.createOrUpdateUser(userData);

    logger.info(`✅ Discord OAuth successful for ${discordUser.username} (${discordUser.id})`);

    res.json({
      success: true,
      user: {
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
        email: user.email,
        suiAddress: user.suiAddress,
        tokenBalance: user.tokenBalance,
        roles: user.roles
      },
      auth: authData
    });

  } catch (error) {
    logger.error('❌ Discord OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Link Sui wallet
app.post('/api/link-wallet', async (req: Request, res: Response) => {
  try {
    const { discordId, suiAddress } = req.body;

    if (!discordId || !suiAddress) {
      return res.status(400).json({ error: 'Discord ID and Sui address are required' });
    }

    logger.info(`🔗 Linking wallet for Discord ID: ${discordId}, Sui Address: ${suiAddress}`);

    // Check if Sui address is already linked to another user
    const existingUser = await mongoService.findUserBySuiAddress(suiAddress);
    if (existingUser && existingUser.discordId !== discordId) {
      return res.status(409).json({ 
        error: 'This Sui address is already linked to another Discord account' 
      });
    }

    // Update user with Sui address
    const user = await mongoService.createOrUpdateUser({
      discordId,
      suiAddress
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`✅ Wallet linked successfully for ${user.discordUsername}`);

    res.json({
      success: true,
      user: {
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        suiAddress: user.suiAddress,
        tokenBalance: user.tokenBalance,
        roles: user.roles
      }
    });

  } catch (error) {
    logger.error('❌ Wallet linking error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update user roles based on token balance
app.post('/api/update-roles', async (req: Request, res: Response) => {
  try {
    const { discordId, tokenBalance } = req.body;

    if (!discordId || tokenBalance === undefined) {
      return res.status(400).json({ error: 'Discord ID and token balance are required' });
    }

    // Get user from database
    const user = await mongoService.findUserByDiscordId(discordId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update token balance
    await mongoService.updateUserTokenBalance(discordId, tokenBalance);

    // Determine new role
    const newRole = determineRole(tokenBalance);
    
    // Update Discord roles
    await updateDiscordRoles(discordId, newRole);

    const roleInfo = newRole 
      ? `${newRole.emoji} ${newRole.name} (${newRole.minBalance}+ TR_WAL required)`
      : 'No role (insufficient balance)';

    logger.info(`✅ Roles updated for ${user.discordUsername}: ${roleInfo}`);

    res.json({
      success: true,
      user: {
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        tokenBalance,
        roles: newRole ? [newRole.name] : [],
        assignedRole: newRole
      },
      message: `Roles updated successfully! ${roleInfo}`
    });

  } catch (error) {
    logger.error('❌ Role update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user by Discord ID
app.get('/api/user/:discordId', async (req: Request, res: Response) => {
  try {
    const { discordId } = req.params;

    const user = await mongoService.findUserByDiscordId(discordId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        discordAvatar: user.discordAvatar,
        email: user.email,
        suiAddress: user.suiAddress,
        tokenBalance: user.tokenBalance,
        roles: user.roles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    logger.error('❌ Get user error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('🚨 Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  
  client.destroy();
  await mongoService.disconnect();
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  
  client.destroy();
  await mongoService.disconnect();
  
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize database
    await initializeDatabase();

    // Login Discord bot
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is required');
    }

    await client.login(process.env.DISCORD_BOT_TOKEN);

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌊 Marine role system active`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer().catch((error) => {
  logger.error('❌ Startup error:', error);
  process.exit(1);
}); 