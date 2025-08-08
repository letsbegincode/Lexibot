import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing')

const bot = new TelegramBot(token, { polling: false })
const authorizedUserIds = process.env.AUTHORIZED_USERS?.split(',').map(id => id.trim()) || []

const escapeMarkdown = (text) => {
  const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
  let escapedText = ''
  for (let char of text) {
    if (escapeChars.includes(char)) {
      escapedText += '\\'
    }
    escapedText += char
  }
  return escapedText
}

const formatWordsList = (words, title) => {
  let message = `✨ *${title}* ✨\n\n`
  
  const groupedByDate = words.reduce((acc, word) => {
    const dateKey = word.createdAt.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(word)
    return acc
  }, {})

  for (const [date, words] of Object.entries(groupedByDate)) {
    message += `📅 *${date}*\n`
    message += '━'.repeat(20) + '\n'
    
    words.forEach((word, index) => {
      message += `\n🔷 *${escapeMarkdown(word.word.toUpperCase())}*\n`
      message += `${escapeMarkdown(word.description)}\n`
      message += `_Added by ${escapeMarkdown(word.addedByName)}_\n`
      
      if (index < words.length - 1) {
        message += '\n' + '·'.repeat(15) + '\n'
      }
    })
    message += '\n\n'
  }
  
  return message
}

const formatSingleWord = (word) => {
  return `🎯 *${escapeMarkdown(word.word.toUpperCase())}*\n\n` +
         `${escapeMarkdown(word.description)}\n\n` +
         `📅 ${word.createdAt.toLocaleDateString()}\n` +
         `👤 Added by ${escapeMarkdown(word.addedByName)}`
}

export { bot, authorizedUserIds, formatWordsList, formatSingleWord }