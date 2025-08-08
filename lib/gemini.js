import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// For word-specific searches
export async function searchWord(word) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Provide concise information about "${word}" in this format:
    
🔹 *Word*: ${word}
🔹 *Pronunciation*: 
🔹 *Meaning*: 
🔹 *Examples*: 
🔹 *Synonyms*: 
🔹 *Antonyms*: 

Keep each section brief and use markdown formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    return response.replace(/\*\*/g, '*');
  } catch (error) {
    console.error("Word search error:", error);
    return null;
  }
}

// For general search queries
export async function searchQuery(query) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(query);
    return result.response.text();
  } catch (error) {
    console.error("Search query error:", error);
    return "Sorry, I couldn't process your query. Please try again later.";
  }
}

export async function getDailyTip() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Give a short, practical tip (1-2 sentences) for improving English vocabulary or language skills.`;
    const result = await model.generateContent(prompt);
    return "💡 *Tip*: " + (await result.response.text()).trim();
  } catch (error) {
    console.error("getDailyTip error:", error);
    return "💡 *Tip*: Read, write, and use new words daily!";
  }
}

export async function getWordSuggestions(difficulty = "medium", count = 3) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Suggest ${count} interesting, uncommon English words (not proper nouns) at ${difficulty} difficulty. Only list the words, comma-separated.`;
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    // Split by comma or newline, trim, and filter empty
    return text
      .split(/,|\n/)
      .map(w => w.trim())
      .filter(Boolean)
      .slice(0, count);
  } catch (error) {
    console.error("getWordSuggestions error:", error);
    // Fallback static suggestions
    return ["serendipity", "ephemeral", "lucid"].slice(0, count);
  }
}