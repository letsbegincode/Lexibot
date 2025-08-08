import { bot, authorizedUserIds } from '../lib/bot.js'
import { getWordSuggestions } from '../lib/gemini.js'
import prisma from '../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const motivationalQuotes = [
      "The limits of my language mean the limits of my world. - Ludwig Wittgenstein",
      "Language is the road map of a culture. - Rita Mae Brown", 
      "A different language is a different vision of life. - Federico Fellini",
      "Language is the dress of thought. - Samuel Johnson",
      "Words are the most powerful drug used by mankind. - Rudyard Kipling",
      "The art of communication is the language of leadership. - James Humes",
      "Language shapes the way we think. - Guy Deutscher",
      "A word is worth a thousand pictures. - Unknown"
    ]

    const todayQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    // Get word suggestions for today
    const wordSuggestions = await getWordSuggestions('medium', 3)
    const suggestionsText = wordSuggestions.length > 0 ? 
      `\n🎯 *Today's Word Suggestions:*\n${wordSuggestions.map(w => `• ${w}`).join('\n')}\n` : ''

    for (const userId of authorizedUserIds) {
      try {
        // Get user's recent activity
        const recentWords = await prisma.word.findMany({
          where: { addedByUserId: userId },
          orderBy: { createdAt: 'desc' },
          take: 1
        })

        let lastWordMsg = ''
        if (recentWords.length > 0) {
          lastWordMsg = `Yesterday's word: *${recentWords[0].word}* 🎉\n\n`
        }

        const message = `🌅 *Good Morning!*\n${'━'.repeat(20)}\n\n` +
                        lastWordMsg +
                        `💭 _"${todayQuote}"_\n` +
                        `${suggestionsText}` +
                        `Let's make today count! 📚✨`

        await bot.sendMessage(userId, message, { 
          parse_mode: 'Markdown'
        })
      } catch (error) {
        console.error(`Failed to send morning prompt to user ${userId}:`, error)
      }
    }
    
    return res.status(200).json({ 
      success: true,
      usersNotified: authorizedUserIds.length,
      quote: todayQuote.split(' - ')[0]
    })
  } catch (error) {
    console.error("Morning prompt error:", error)
    return res.status(500).json({ error: "Failed to send morning prompts" })
  }
}