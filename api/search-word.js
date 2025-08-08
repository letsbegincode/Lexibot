// api/search-word.js
import { bot, authorizedUserIds } from '../lib/bot.js';
import { searchWord } from '../lib/gemini.js';
import prisma from '../lib/prisma.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { word, chatId, userId, userName } = req.body;
    
    if (!word || !chatId || !userId || !userName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!authorizedUserIds.includes(String(chatId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const cleanWord = word.trim().toLowerCase();
    
    // Check if word already exists
    const existing = await prisma.word.findUnique({ where: { word: cleanWord } });
    if (existing) {
      await bot.sendMessage(chatId, 
        `📚 **${cleanWord.toUpperCase()}** already exists!\n\n${existing.description}`,
        { parse_mode: 'Markdown' }
      );
      return res.status(200).json({ success: true, existing: true });
    }

    const details = await searchWord(cleanWord);
    if (!details) {
      await bot.sendMessage(chatId, `❌ Couldn't find information about "${cleanWord}"`);
      return res.status(404).json({ error: "Word not found" });
    }

    // Save to database
    await prisma.word.create({
      data: {
        word: cleanWord,
        description: details,
        addedByUserId: userId, // Use string, not BigInt
        addedByName: userName,
        category: 'searched'
      }
    });

    await bot.sendMessage(
      chatId,
      `✅ **${cleanWord.toUpperCase()}** saved!\n\n${details}`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add Another', switch_inline_query_current_chat: '/sw ' }]
          ]
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Search word error:", error);
    await bot.sendMessage(chatId, '⚠️ Error processing word. Please try again!');
    return res.status(500).json({ error: "Failed to process word" });
  }
}