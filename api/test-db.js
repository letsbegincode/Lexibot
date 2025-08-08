import prisma from '../lib/prisma.js'

export default async function handler(req, res) {
  try {
    // Test raw query
    await prisma.$queryRaw`SELECT 1`
    
    // Test creating and reading a word
    const testWord = await prisma.word.create({
      data: {
        word: "testword",
        description: "This is a test entry",
        addedByUserId: "1", // Use string, not BigInt
        addedByName: "System"
      }
    })
    
    await prisma.word.delete({ where: { word: "testword" } })
    
    return res.status(200).json({ 
      status: "Database connection successful",
      testWord: testWord.word
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return res.status(500).json({ 
      error: error.message,
      connectionString: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//[REDACTED]@')
    })
  }
}