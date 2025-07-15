# Sui Turkey Discord Bot

A comprehensive Discord bot system for the Sui Turkey community featuring token-based role management, multi-wallet support, and automated balance checking.

## 🚀 Features

### 🔄 Automated Balance & Role Management
- **24-hour automated balance checking** (runs daily at 00:00 UTC)
- **Automatic Discord role assignment** based on TR_WAL token holdings
- **Multi-wallet balance aggregation** across all linked addresses
- **Real-time role updates** with comprehensive logging

### 👛 Advanced Multi-Wallet Management
- **Multiple wallet linking** per user account
- **useAccounts integration** showing all authorized wallets
- **Individual wallet balance display** for each linked address
- **Link/Unlink/Disconnect** functionality with UI management
- **Wallet status monitoring** with automatic reconnection prompts

### 🎭 Marine-Themed Role System
- 🐬 **Dolphin**: 100+ TR_WAL tokens
- 🦈 **Shark**: 1,000+ TR_WAL tokens  
- 🐳 **Whale**: 10,000+ TR_WAL tokens

### 🛡️ Smart Wallet Monitoring
- **Connection status validation** on page navigation
- **Automatic disconnect detection** with user prompts
- **Database synchronization** for wallet linkages
- **Real-time balance updates** across all interfaces

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **RESTful API** endpoints for user and wallet management
- **Discord Bot integration** with role management
- **Cron-based automation** for scheduled balance checks
- **MongoDB data persistence** with optimized schemas
- **Comprehensive logging** with Winston

### Frontend (React + TypeScript + @mysten/dapp-kit)
- **Modern React hooks** integration
- **Sui wallet connectivity** via @mysten/dapp-kit
- **Real-time UI updates** with state management
- **Responsive design** with Tailwind CSS
- **Modal-based wallet management** interface

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Discord Bot Token
- Discord Server with role permissions

### Backend Setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sui-turkey

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:5173/discord/callback

# Discord Guild & Role IDs
GUILD_ID=your_discord_server_id
DOLPHIN_ROLE_ID=dolphin_role_id
SHARK_ROLE_ID=shark_role_id
WHALE_ROLE_ID=whale_role_id

# Optional Configuration
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
NODE_ENV=development
PORT=3001
```

### Frontend Setup
```bash
# Install dependencies (using pnpm)
pnpm install

# Or with npm
npm install --legacy-peer-deps
```

## 🚀 Running the Application

### Start Backend
```bash
cd server
npm run dev
```

### Start Frontend
```bash
pnpm dev
# or
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 🔧 API Endpoints

### Authentication
- `POST /api/discord/callback` - Discord OAuth callback
- `GET /api/user/:discordId` - Get user profile

### Wallet Management
- `POST /api/add-wallet` - Link new wallet to user
- `POST /api/remove-wallet` - Unlink wallet from user
- `POST /api/link-wallet` - Legacy wallet linking (backward compatibility)

### Role Management
- `POST /api/update-roles` - Update user roles based on balance
- `POST /api/trigger-balance-check` - Manual balance check trigger

### System
- `GET /health` - System health check with status indicators

## 🎮 User Flow

1. **Discord Connection**: Authenticate with Discord OAuth
2. **Wallet Linking**: Connect and authorize Sui wallets
3. **Balance Management**: View aggregated TR_WAL balances
4. **Role Assignment**: Automatic role updates based on holdings
5. **Wallet Management**: Use "Manage Wallets" interface for full control

## 🛠️ Technical Features

### Database Schema
- **User Model**: Supports multiple wallet addresses per user
- **Unique Constraints**: One address per user restriction
- **Automatic Timestamps**: Created/updated tracking
- **Balance Caching**: Last balance check optimization

### Automation System
- **Cron Scheduling**: Daily balance checks at 00:00 UTC
- **Rate Limiting**: Discord API protection (200ms delays)
- **Error Handling**: Comprehensive error logging and recovery
- **Performance Monitoring**: Balance check statistics

### Security
- **JWT Authentication**: Secure session management
- **Address Validation**: Unique wallet address enforcement
- **Environment Variables**: Secure configuration management
- **CORS Protection**: Cross-origin request security

## 🧪 Testing

### Manual Balance Check
```bash
curl -X POST http://localhost:3001/api/trigger-balance-check
```

### Health Monitoring
```bash
curl http://localhost:3001/health
```

### Development Features
- **Auto-balance check**: Runs 10 seconds after server start in development
- **Debug logging**: Comprehensive console output
- **Hot reload**: Real-time code updates

## 📊 Monitoring

The system provides comprehensive monitoring through:
- **Real-time health checks** with database and Discord status
- **Balance check automation** with success/error counting
- **User activity logging** with detailed operation tracking
- **Performance metrics** for optimization insights

## 🔄 Automated Processes

### Daily Balance Synchronization
1. **Fetch all users** with linked wallet addresses
2. **Query TR_WAL balances** for each address in parallel
3. **Aggregate total balance** per user account
4. **Update Discord roles** based on new balances
5. **Log all operations** with detailed status reporting

### Real-time Wallet Management
1. **Monitor wallet connections** on page navigation
2. **Validate address linkages** against database
3. **Prompt reconnection** for disconnected wallets
4. **Synchronize UI state** with backend data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper testing
4. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the health endpoint: `/health`
- Review server logs for error details
- Verify Discord bot permissions and role IDs
- Confirm MongoDB connection and environment variables
