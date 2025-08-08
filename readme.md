# 📚 Collaborative Vocabulary Bot

A Telegram bot powered by AI that helps users build and manage their vocabulary collaboratively. Built with Node.js, Prisma, and Google's Gemini AI.

## ✨ Features

### 🤖 Core Functionality
- **AI-Powered Word Search**: Get detailed word information using Google Gemini AI
- **Collaborative Vocabulary**: Share and manage words with authorized users
- **Smart Word Management**: Add, search, find, and delete vocabulary words
- **Daily Automation**: Morning prompts and evening recaps
- **Interactive Commands**: Easy-to-use Telegram commands

### 📖 Word Management
- **Search & Save** (`/sw [word]`): Search for word definitions and automatically save them
- **Add Manually** (`/w`): Add custom words with your own definitions
- **Find Words** (`/f [term]`): Search through your vocabulary database
- **Delete Words** (`/delete [word]`): Remove words from your collection
- **Recent Words** (`/dayX`): View words added in the last X days

### 🌅 Daily Features
- **Morning Prompts**: Daily motivational quotes and word suggestions
- **Evening Recaps**: Summary of all words added during the day
- **Word Suggestions**: AI-generated vocabulary recommendations

### 🔍 Search Capabilities
- **General Queries** (`/sq [query]`): Ask anything and get AI-powered responses
- **Word Definitions**: Comprehensive word information including pronunciation, meaning, examples, synonyms, and antonyms
- **Database Search**: Find words by partial matches in word or description

## 🛠️ Tech Stack

- **Backend**: Node.js with ES modules
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini AI
- **Bot Framework**: node-telegram-bot-api
- **Deployment**: Vercel
- **Scheduling**: Vercel Cron Jobs

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- Telegram Bot Token
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd collaborative-bot-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vocabulary_bot"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
AUTHORIZED_USERS="user_id1,user_id2,user_id3"

# AI Integration
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 5. Development
```bash
# Start development server
npm run dev
```

## 📱 Bot Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` or `/help` | Show help menu | `/help` |
| `/sw [word]` | Search & save word | `/sw serendipity` |
| `/sq [query]` | Ask general questions | `/sq what is etymology?` |
| `/w` | Add word manually | `/w` |
| `/f [term]` | Find words in database | `/f creative` |
| `/delete [word]` | Delete word | `/delete serendipity` |
| `/dayX` | Recent words (X days) | `/day7` |
| `/test` | Test bot connection | `/test` |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | ✅ |
| `AUTHORIZED_USERS` | Comma-separated user IDs | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |

### Database Schema

```prisma
model Word {
  word          String   @id @unique
  description   String
  addedByUserId BigInt
  addedByName   String
  createdAt     DateTime @default(now()) @db.Timestamptz(3)
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables in Vercel dashboard
3. **Build Settings**: 
   - Build Command: `npm run build`
   - Output Directory: `api`
4. **Deploy**: Vercel will automatically deploy your bot

### Webhook Setup

After deployment, set your Telegram webhook:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-vercel-app.vercel.app/api/bot
```

## 📅 Scheduled Tasks

The bot includes automated daily tasks:

- **Morning Prompt** (3:30 AM): Sends motivational quotes and word suggestions
- **Evening Recap** (5:30 PM): Summarizes all words added during the day

These are configured in `vercel.json` using Vercel Cron Jobs.

## 🔒 Security Features

- **User Authorization**: Only authorized users can access the bot
- **Environment Variables**: All sensitive data stored securely
- **Input Validation**: Proper validation for all user inputs
- **Error Handling**: Comprehensive error handling and logging

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bot` | POST | Main bot webhook handler |
| `/api/search-query` | POST | General search queries |
| `/api/search-word` | POST | Word-specific searches |
| `/api/morning-promt` | GET | Morning automation |
| `/api/evening-recap` | GET | Evening automation |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Verify your environment variables are set correctly
3. Ensure your database is properly configured
4. Check the bot logs in Vercel dashboard

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI-powered word definitions
- [Telegram Bot API](https://core.telegram.org/bots/api) for bot functionality
- [Prisma](https://www.prisma.io/) for database management
- [Vercel](https://vercel.com/) for hosting and deployment

---

**Happy learning! 📚✨**
