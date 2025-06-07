# 🐋 Sui Turkey Discord Integration

**Marine-themed Discord role assignment system based on TR_WAL token holdings on Sui blockchain.**

## ✨ Features

- 🌊 **Marine Theme**: Dolphin, Shark, and Whale roles based on token holdings
- 🔗 **Sui Integration**: Real-time TR_WAL token balance checking
- 🎮 **Discord OAuth2**: Secure Discord authentication
- 🪙 **Wallet Linking**: Connect Sui wallets to Discord accounts
- 🤖 **Automated Roles**: Auto-assign Discord roles based on token amounts
- 📊 **Professional Logging**: Winston-based logging system
- 🎨 **Modern UI**: Dark theme with glassmorphism effects

## 🌊 Marine Role System

| Role | Token Requirement | Access |
|------|------------------|---------|
| 🐬 **Dolphin** | 100+ TR_WAL | dolphin-cove fun events |
| 🦈 **Shark** | 1,000+ TR_WAL | shark-den special events |
| 🐳 **Whale** | 10,000+ TR_WAL | whale-lair VIP access & events |

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Sui dApp Kit** for blockchain integration
- **Radix UI** for components

### Backend
- **Node.js** with Express
- **Discord.js** for bot functionality
- **Winston** for professional logging
- **MongoDB** simulation with localStorage

## 📦 Installation

### Prerequisites
- Node.js 18+
- Discord Developer Account
- Sui Wallet

### 1. Clone Repository
```bash
git clone <repository-url>
cd sui_turkey
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Environment Setup

#### Frontend (.env)
```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_DISCORD_CLIENT_SECRET=your_discord_client_secret
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/discord/callback
```

#### Backend (server/.env)
```env
DISCORD_BOT_TOKEN=your_bot_token
GUILD_ID=your_discord_server_id
PORT=3001
LOG_LEVEL=info
```

### 4. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Create bot and copy token
4. Enable OAuth2 with `identify` and `guilds.members.read` scopes
5. Invite bot to your server with `Manage Roles` permission

## 🏃 Running the Project

### Development
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd server
node index.js
```

### URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 Usage

1. **Connect Discord**: Authenticate with Discord OAuth2
2. **Link Wallet**: Connect your Sui wallet
3. **Check Balance**: System automatically checks TR_WAL balance
4. **Update Roles**: Click "Update Discord Roles" to assign marine roles

## 📁 Project Structure

```
sui_turkey/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── server/                 # Backend source
│   ├── index.js           # Main server file
│   ├── logger.js          # Winston configuration
│   └── logs/              # Log files
└── public/                # Static assets
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically

### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy automatically

## 🔒 Security Features

- Secure Discord OAuth2 flow
- JWT token authentication
- Environment variable protection
- Rate limiting protection
- Graceful error handling

## 📊 Logging

Professional logging with Winston:
- **Console**: Colored real-time logs
- **Files**: Persistent log storage
- **Levels**: Error, Warn, Info, Debug
- **Rotation**: Automatic log file rotation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For support, join our Discord server or create an issue on GitHub.

---

**Made with 💙 for the Sui Turkey Community** 🇹🇷
