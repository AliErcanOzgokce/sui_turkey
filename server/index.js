const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const cors = require('cors');
const logger = require('./logger');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Log startup information
logger.info('🚀 Discord Bot Server Starting...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Guild ID: ${process.env.GUILD_ID}`);

// Discord Bot Setup with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// Role mapping based on token amounts - Updated to marine theme
const ROLE_MAPPING = {
  dolphin: {
    name: '🐬 Dolphin',
    requiredTokens: 100,
    color: '#40E0D0'
  },
  shark: {
    name: '🦈 Shark',
    requiredTokens: 1000,
    color: '#708090'
  },
  whale: {
    name: '🐳 Whale',
    requiredTokens: 10000,
    color: '#4169E1'
  }
};

// Bot ready event
client.once('ready', async () => {
  logger.info(`🤖 Bot logged in as ${client.user.tag}`);
  
  // Create roles if they don't exist
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (guild) {
    try {
      await createRolesIfNotExist(guild);
      logger.info(`✅ Connected to server: ${guild.name} (${guild.memberCount} members)`);
    } catch (error) {
      logger.error('Failed to create roles on startup:', error);
    }
  } else {
    logger.error(`❌ Could not find server with ID: ${process.env.GUILD_ID}`);
  }
});

// Function to create roles if they don't exist
async function createRolesIfNotExist(guild) {
  logger.info('🔧 Checking and creating roles...');
  
  for (const [key, roleData] of Object.entries(ROLE_MAPPING)) {
    try {
      let role = guild.roles.cache.find(r => r.name === roleData.name);
      
      if (!role) {
        role = await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          reason: 'TR_WAL Token Holder Role',
        });
        logger.info(`✅ Created role: ${roleData.name}`);
      } else {
        logger.debug(`✅ Role already exists: ${roleData.name}`);
      }
    } catch (error) {
      logger.error(`❌ Error creating role ${roleData.name}:`, error);
    }
  }
}

// API Endpoint to update user roles
app.post('/api/update-roles', async (req, res) => {
  const startTime = Date.now();
  const { discordUserId, tokenBalance } = req.body;
  
  logger.info(`📝 Role update request - User: ${discordUserId}, Balance: ${tokenBalance}`);
  
  try {
    if (!discordUserId || tokenBalance === undefined) {
      logger.warn(`❌ Invalid request - Missing data: discordUserId=${!!discordUserId}, tokenBalance=${tokenBalance !== undefined}`);
      return res.status(400).json({
        error: 'Discord User ID and token balance are required'
      });
    }

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
      logger.error('❌ Guild not found');
      return res.status(500).json({
        error: 'Guild not found'
      });
    }

    // Get the member
    let member;
    try {
      member = await guild.members.fetch(discordUserId);
      logger.debug(`👤 Found member: ${member.user.tag}`);
    } catch (error) {
      logger.warn(`❌ User not found in Discord server: ${discordUserId}`, error);
      return res.status(404).json({
        error: 'User not found in Discord server. Make sure the user is in the server.'
      });
    }

    // Determine which roles the user should have
    const eligibleRoles = [];
    for (const [key, roleData] of Object.entries(ROLE_MAPPING)) {
      if (tokenBalance >= roleData.requiredTokens) {
        eligibleRoles.push(key);
      }
    }
    
    logger.info(`🎯 Eligible roles for ${member.user.tag}: ${eligibleRoles.join(', ') || 'None'}`);

    // Get all TR_WAL related roles
    const allTRWalRoles = [];
    for (const roleData of Object.values(ROLE_MAPPING)) {
      const role = guild.roles.cache.find(r => r.name === roleData.name);
      if (role) {
        allTRWalRoles.push(role);
      }
    }

    // Remove all TR_WAL roles first
    try {
      await member.roles.remove(allTRWalRoles);
      logger.debug(`🗑️ Removed existing TR_WAL roles from ${member.user.tag}`);
    } catch (error) {
      logger.error(`❌ Error removing roles from ${member.user.tag}:`, error);
    }

    // Add eligible roles
    const rolesToAdd = [];
    const roleNames = [];
    for (const eligibleRoleKey of eligibleRoles) {
      const roleData = ROLE_MAPPING[eligibleRoleKey];
      const role = guild.roles.cache.find(r => r.name === roleData.name);
      if (role) {
        rolesToAdd.push(role);
        roleNames.push(eligibleRoleKey);
      }
    }

    if (rolesToAdd.length > 0) {
      try {
        await member.roles.add(rolesToAdd);
        logger.info(`✅ Added roles to ${member.user.tag}: ${roleNames.join(', ')}`);
      } catch (error) {
        logger.error(`❌ Error adding roles to ${member.user.tag}:`, error);
        return res.status(500).json({
          error: 'Failed to add roles',
          details: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`🔄 Successfully updated roles for ${member.user.tag}: ${roleNames.join(', ') || 'None'} (${duration}ms)`);

    res.json({
      success: true,
      user: member.user.tag,
      roles: roleNames,
      tokenBalance
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Error updating roles (${duration}ms):`, error);
    res.status(500).json({
      error: 'Failed to update roles',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const healthData = {
    status: 'OK',
    bot: client.user ? client.user.tag : 'Not connected',
    uptime: process.uptime(),
    guild: guild ? 'Connected' : 'Not found',
    guildName: guild ? guild.name : null,
    memberCount: guild ? guild.memberCount : null,
    timestamp: new Date().toISOString()
  };
  
  logger.debug('📊 Health check requested', healthData);
  res.json(healthData);
});

// Error handling
client.on('error', error => {
  logger.error('Discord client error:', error);
});

// Discord rate limit warnings
client.on('rateLimit', (info) => {
  logger.warn('⚠️ Discord Rate Limit Hit:', {
    timeout: info.timeout,
    limit: info.limit,
    method: info.method,
    path: info.path,
    route: info.route
  });
});

// Process error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Login the bot
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => {
    logger.info('🔐 Bot login initiated');
  })
  .catch((error) => {
    logger.error('❌ Failed to login bot:', error);
    process.exit(1);
  });

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info('📋 Available endpoints:');
  logger.info('   POST /api/update-roles - Update Discord roles');
  logger.info('   GET  /api/health       - Health check');
}); 