import { bot, authorizedUserIds, formatWordsList, formatSingleWord } from '../lib/bot.js';
import prisma from '../lib/prisma.js';
import { searchQuery, searchWord } from '../lib/gemini.js';

// User state management
const userStates = {};

// Emoji constants for consistent styling
const EMOJI = {
  WORD: '📖',
  SEARCH: '🔍',
  ADD: '➕',
  LIST: '📋',
  HELP: '❓',
  ERROR: '⚠️',
  SUCCESS: '✅',
  TIME: '⏳',
  USER: '👤',
  STAR: '⭐',
  SPARKLE: '✨',
  LINE: '━━━━━━━━━━━━━━'
};

function escapeMarkdown(text) {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`');
}

// Helper to format a word entry for plain text output, with bold/capitalized word at top
function formatWordPlain(wordObj) {
  // Capitalize and bold the word (simulate bold with ** for clarity, but no parse_mode)
  const wordTitle = `🔷 ${wordObj.word.toUpperCase()}`;
  let out = `${wordTitle}\n`;

  if (wordObj.pronunciation) out += `🔹 Pronunciation: ${wordObj.pronunciation}\n`;
  if (wordObj.meaning || wordObj.description) out += `🔹 Meaning: ${wordObj.meaning || wordObj.description}\n`;
  if (wordObj.examples) out += `🔹 Examples: ${wordObj.examples}\n`;
  if (wordObj.synonyms) out += `🔹 Synonyms: ${wordObj.synonyms}\n`;
  if (wordObj.antonyms) out += `🔹 Antonyms: ${wordObj.antonyms}\n`;
  if (wordObj.addedByName) out += `Added by ${wordObj.addedByName}\n`;
  return out.trim();
}

export default async function handler(req, res) {
  // Add CORS header for Vercel API compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const message = req.body?.message;
    if (!message) return res.status(200).end();

    const { text, chat, from } = message;
    if (!text || !chat || !from) return res.status(200).end();

    const userId = String(from.id);
    const chatId = String(chat.id);

    if (!authorizedUserIds.includes(userId)) {
      await bot.sendMessage(chatId, `${EMOJI.ERROR} Unauthorized access. Please contact admin.`);
      return res.status(403).end();
    }

    // Initialize user state
    if (!userStates[userId]) {
      userStates[userId] = { 
        userName: from.first_name || 'User',
        step: null 
      };
    }

    // Handle commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].toLowerCase();
      
      switch(command) {
        case '/start':
        case '/help':
          await showHelpMenu(chatId);
          break;
        case '/test':
          await bot.sendMessage(chatId, `${EMOJI.SUCCESS} Bot is running smoothly!`);
          break;
        case '/w':
          await initiateAddWordFlow(chatId, userId);
          break;
        case '/delete':
          const wordToDelete = text.replace('/delete', '').trim();
          await handleDeleteWord(wordToDelete, chatId, userId);
          break;
        default:
          if (command.startsWith('/sq')) {
            const query = text.replace('/sq', '').trim();
            await handleSearchQuery(query, chatId);
          } 
          else if (command.startsWith('/sw')) {
            const word = text.replace('/sw', '').trim();
            await handleWordSearch(word, chatId, userId, from.first_name);
          }
          else if (command.startsWith('/f')) {
            const term = text.replace('/f', '').trim();
            await handleFindCommand(term, chatId, userId);
          }
          else if (command.match(/^\/day\d+$/)) {
            await handleDayXCommand(command, chatId);
          }
          else {
            await bot.sendMessage(chatId, `${EMOJI.ERROR} Unknown command. Use /help for instructions.`);
          }
      }
      return res.status(200).end();
    }

    // Handle interactive flows
    if (userStates[userId].step === 'awaiting_word') {
      await handleNewWord(text, chatId, userId);
      return res.status(200).end();
    }
    else if (userStates[userId].step === 'awaiting_definition') {
      await handleWordDefinition(text, chatId, userId);
      return res.status(200).end();
    }

    return res.status(200).end();
  } catch (error) {
    console.error('Bot error:', error);
    try {
      // chatId may not be defined if error occurs before assignment
      if (typeof chatId !== 'undefined') {
        await bot.sendMessage(chatId, `${EMOJI.ERROR} Something went wrong! Please try again.`);
      }
    } catch (e) {
      console.error('Failed to send error message:', e);
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ===== COMMAND HANDLERS ===== //

async function showHelpMenu(chatId) {
  const helpMessage = `
${EMOJI.SPARKLE} *Vocabulary Bot* ${EMOJI.SPARKLE}
${EMOJI.LINE}

${EMOJI.HELP} *Commands*
${EMOJI.STAR} \`/sw [word]\` — Search & save
${EMOJI.STAR} \`/sq [query]\` — Ask anything
${EMOJI.STAR} \`/w\` — Add word
${EMOJI.STAR} \`/f [term]\` — Find words
${EMOJI.STAR} \`/delete [word]\` — Delete word
${EMOJI.STAR} \`/dayX\` — Recent words

${EMOJI.LIST} *Examples*
${EMOJI.STAR} \`/sw serendipity\`
${EMOJI.STAR} \`/f creative\`
${EMOJI.STAR} \`/delete serendipity\`
${EMOJI.STAR} \`/day7\`

${EMOJI.LINE}
${EMOJI.USER} _Level up your vocabulary!_
`;

  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown'
    // Removed reply_markup with Quick Search button
  });
}

async function initiateAddWordFlow(chatId, userId) {
  userStates[userId] = { 
    ...userStates[userId], 
    step: 'awaiting_word' 
  };
  
  await bot.sendMessage(
    chatId,
    `${EMOJI.WORD} *Add a word*\n_Type your word below._\n\n_Example:_ \`serendipity\``,
    { parse_mode: 'Markdown' }
  );
}

async function handleNewWord(word, chatId, userId) {
  word = word.trim(); // Ensure no leading/trailing spaces
  if (!word || word.length > 50) {
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Please enter a valid word (max 50 chars).`
    );
    return;
  }

  const exists = await prisma.word.findUnique({ 
    where: { word: word.toLowerCase() },
    select: { word: true, description: true, addedByUserId: true, addedByName: true, createdAt: true }
  });
  if (exists) {
    await bot.sendMessage(
      chatId,
      `${EMOJI.WORD} *${word}* already exists!\n\n${formatSingleWord(exists)}`,
      { parse_mode: 'Markdown' }
    );
    delete userStates[userId].step;
    return;
  }

  userStates[userId] = {
    ...userStates[userId],
    step: 'awaiting_definition',
    currentWord: word.toLowerCase()
  };

  await bot.sendMessage(
    chatId,
    `${EMOJI.WORD} *${word}*\n_Definition?_`,
    { parse_mode: 'Markdown' }
  );
}

async function handleWordDefinition(definition, chatId, userId) {
  definition = definition.trim(); // Clean up definition input
  const { currentWord, userName } = userStates[userId];

  try {
    const wordEntry = await prisma.word.create({
      data: {
        word: currentWord,
        description: definition,
        addedByUserId: userId,
        addedByName: userName
      }
    });

    await bot.sendMessage(
      chatId,
      `${EMOJI.SUCCESS} *${currentWord}* added!\n${formatSingleWord(wordEntry)}`,
      { parse_mode: 'Markdown' }
    );

    await bot.sendMessage(
      chatId,
      `${EMOJI.ADD} Add another? /w | Menu: /help`,
      { parse_mode: 'Markdown' }
    );

  } catch (error) {
    if (error.code === 'P2002') {
      await bot.sendMessage(
        chatId,
        `${EMOJI.ERROR} *${currentWord}* already exists!`
      );
    } else {
      console.error('Failed to save word:', error);
      await bot.sendMessage(
        chatId,
        `${EMOJI.ERROR} Could not save word. Try again.`
      );
    }
  } finally {
    delete userStates[userId].step;
    delete userStates[userId].currentWord;
  }
}

async function handleWordSearch(word, chatId, userId, userName) {
  if (!word) {
    await bot.sendMessage(chatId, `${EMOJI.ERROR} Enter a word to search.`);
    return;
  }

  try {
    const details = await searchWord(word);
    if (!details) {
      await bot.sendMessage(
        chatId,
        `${EMOJI.ERROR} No info for *${word}*.\nTry /w to add manually.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      await prisma.word.create({
        data: {
          word: word.toLowerCase(),
          description: details,
          addedByUserId: userId,
          addedByName: userName
        }
      });

      await bot.sendMessage(
        chatId,
        `${EMOJI.SUCCESS} *${word}* saved!\n${details}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      if (error.code === 'P2002') {
        await bot.sendMessage(
          chatId,
          `${EMOJI.ERROR} *${word}* already exists!`
        );
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Word search error:', error);
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Could not process. Try again.`
    );
  }
}

async function handleSearchQuery(query, chatId) {
  if (!query) {
    await bot.sendMessage(chatId, `${EMOJI.ERROR} Enter a search query.`);
    return;
  }

  try {
    const response = await searchQuery(query);
    await bot.sendMessage(
      chatId,
      `${EMOJI.SEARCH} *Results for* _"${query}"_\n${EMOJI.LINE}\n${response}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Search query error:', error);
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Could not process query. Try later.`
    );
  }
}

async function handleFindCommand(term, chatId, userId) {
  if (!term) {
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Enter a search term.\n_Example:_ /f creative`
    );
    return;
  }

  try {
    // First, try to find an exact match by primary key (word)
    const exact = await prisma.word.findUnique({
      where: { word: term.toLowerCase() }
    });

    if (exact) {
      // Use new plain formatter for single word
      let msg = formatWordPlain(exact);
      await bot.sendMessage(
        chatId,
        msg
      );
      return;
    }

    // Fallback: search in word or description (as before)
    const words = await prisma.word.findMany({
      where: {
        OR: [
          { word: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (words.length === 0) {
      await bot.sendMessage(
        chatId,
        `${EMOJI.SEARCH} No matches for ${term}\nTry: /sw ${term}`
      );
      return;
    }

    if (words.length === 1) {
      let msg = formatWordPlain(words[0]);
      await bot.sendMessage(
        chatId,
        msg
      );
      return;
    }

    let msg = `${EMOJI.SEARCH} ${words.length} matches:\n${EMOJI.LINE}\n` +
      words.map((w, i) => `🔷 ${w.word.toUpperCase()}`).join('\n');
    await bot.sendMessage(
      chatId,
      msg
    );

  } catch (error) {
    console.error('Find command error:', error);
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Could not search. Try later.`
    );
  }
}

async function handleDayXCommand(command, chatId) {
  let days = parseInt(command.replace('/day', ''));
  if (isNaN(days) || days <= 0 || days > 365) {
    days = 7;
  }

  try {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    const words = await prisma.word.findMany({
      where: { 
        createdAt: { gte: pastDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (words.length === 0) {
      await bot.sendMessage(
        chatId,
        `${EMOJI.TIME} No words in last ${days} days.\nTry /w or /sw!`
      );
      return;
    }

    // Use the new plain formatter for each word
    let message = `${EMOJI.TIME} Last ${days} Days\n----------------------\n\n` +
      words.map(formatWordPlain).join('\n\n----------------------\n\n');

    await bot.sendMessage(
      chatId, 
      message, 
      { 
        // No parse_mode for plain text
        disable_web_page_preview: true
      }
    );

  } catch (error) {
    console.error('DayX command error:', error);
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Could not fetch words. Try later.`
    );
  }
}

async function handleDeleteWord(word, chatId, userId) {
  if (!word) {
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Enter a word to delete.\n_Example:_ /delete serendipity`
    );
    return;
  }

  try {
    const exists = await prisma.word.findUnique({
      where: { word: word.toLowerCase() }
    });

    if (!exists) {
      await bot.sendMessage(
        chatId,
        `${EMOJI.ERROR} *${word}* not found.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await prisma.word.delete({
      where: { word: word.toLowerCase() }
    });

    await bot.sendMessage(
      chatId,
      `${EMOJI.SUCCESS} *${word}* deleted.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Delete word error:', error);
    await bot.sendMessage(
      chatId,
      `${EMOJI.ERROR} Could not delete. Try again.`
    );
  }
}
