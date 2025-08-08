import { bot, authorizedUserIds, formatWordsList } from '../lib/bot.js'
import prisma from '../lib/prisma.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const words = await prisma.word.findMany({
      where: {
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (words.length === 0) {
      for (const userId of authorizedUserIds) {
        await bot.sendMessage(
          userId,
          "🌙 Evening Vocabulary Recap\n━━━━━━━━━━━━━━\n\n" +
          "No words added today.\n\n" +
          "Every new word is a step forward! 💪\n\n" +
          "Try /sw [word] tomorrow to save new words!"
        )
      }
      return res.status(200).json({ message: "No words added today" })
    }

    // Remove markdown from formatWordsList output (replace * with nothing)
    const message = formatWordsList(words, "🌙 Today's Vocabulary").replace(/\*/g, '');

    for (const userId of authorizedUserIds) {
      try {
        await bot.sendMessage(
          userId, 
          message
          // Removed reply_markup and disable_notification for a cleaner UI
        )
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error)
      }
    }
    
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Evening recap error:", error)
    return res.status(500).json({ error: "Failed to send recap" })
  }
}