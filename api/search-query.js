// api/search-query.js
import { bot, authorizedUserIds } from '../lib/bot.js';
import { searchQuery } from '../lib/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { query, chatId, userId } = req.body;
    
    if (!query || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    if (!authorizedUserIds.includes(String(chatId))) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (query.trim().length < 2) {
      await bot.sendMessage(chatId, '⚠️ Query must be at least 2 characters long');
      return res.status(400).json({ error: "Query too short" });
    }

    const response = await searchQuery(query.trim());
    
    // Split long messages if needed
    if (response.length > 4000) {
      const chunks = response.match(/.{1,4000}/g) || [response];
      for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk);
      }
    } else {
      await bot.sendMessage(chatId, response);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Search query error:", error);
    await bot.sendMessage(chatId, '🤖 Sorry, I couldn\'t process your query right now. Please try again!');
    return res.status(500).json({ error: "Failed to process query" });
  }
}