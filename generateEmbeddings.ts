import { PrismaClient } from "@prisma/client";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const menuItemsPath = path.resolve(__dirname, "menuItems.json");

async function generateEmbeddings(): Promise<void> {
  try {
    const menuItemsData = fs.readFileSync(menuItemsPath, "utf-8");
    const menuItems = JSON.parse(menuItemsData);

    console.log(`Loaded ${menuItems.length} menu items from JSON.`);

    for (const item of menuItems) {
      const inputText = `${item.name}: ${item.description}`;
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: inputText,
      });

      const embeddingArray = embeddingResponse.data[0].embedding;

      // Use parameterized query with proper vector formatting
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "MenuItem" (id, name, description, category, price, embedding)
        VALUES ($1, $2, $3, $4, $5, $6::vector)
        ON CONFLICT (id)
        DO UPDATE SET 
          name = $2,
          description = $3,
          category = $4,
          price = $5,
          embedding = $6::vector;
        `,
        item.id,
        item.name,
        item.description,
        item.category,
        item.price,
        embeddingArray
      );

      console.log(`Processed embedding for item: ${item.name}`);
    }

    console.log("Embedding generation and saving complete.");
  } catch (error) {
    console.error("Error processing embeddings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateEmbeddings();
