/* eslint-disable @typescript-eslint/no-unused-vars */
import { isLoggedIn } from "@/app/lib/hooks";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Initialise OpenAI API
const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load the knowledge base file (knowledge.json)
const knowledgeBase = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "app/api/ai-chatbot/knowledge.json"),
    "utf-8"
  )
);

// Function to generate embeddings for a given text
const generateEmbedding = async (text: string) => {
  const response = await openAi.embeddings.create({
    model: "text-embedding-ada-002", // OpenAI's embedding model
    input: text,
  });

  return response.data[0].embedding; // Return the embedding vector
};

// Pre-generate embeddings for all questions in the knowledge base and store them
type KnowledgeBaseEntry = {
  question: string;
  answer: string;
  embedding: number[];
};

const knowledgeBaseEmbeddings: KnowledgeBaseEntry[] = [];

const generateKnowledgeBaseEmbeddings = async () => {
  for (const entry of knowledgeBase) {
    const embedding = await generateEmbedding(entry.question);
    knowledgeBaseEmbeddings.push({
      question: entry.question,
      answer: entry.answer,
      embedding,
    });
  }
};

// Call the function to generate knowledge base embeddings once (NOT EVERY TIME)
generateKnowledgeBaseEmbeddings();

// Function to find the most similar answer based on embeddings
const findMostSimilarAnswer = async (queryEmbedding: number[]) => {
  let highestSimilarity = -Infinity;
  let mostRelevantAnswer =
    "Sorry, I could not find an answer to your question.";

  knowledgeBaseEmbeddings.forEach((entry) => {
    const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      mostRelevantAnswer = entry.answer;
    }
  });

  return mostRelevantAnswer;
};

// Function to calculate cosine similarity between two vectors
const cosineSimilarity = (vec1: number[], vec2: number[]) => {
  const dotProduct = vec1.reduce(
    (sum, value, index) => sum + value * vec2[index],
    0
  );
  const magnitude1 = Math.sqrt(
    vec1.reduce((sum, value) => sum + value ** 2, 0)
  );
  const magnitude2 = Math.sqrt(
    vec2.reduce((sum, value) => sum + value ** 2, 0)
  );
  return dotProduct / (magnitude1 * magnitude2);
};

// The actual POST method to handle chatbot queries
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("Received request");

  const session = await isLoggedIn();
  if (!session || !session.user?.id) {
    console.log("User not logged in");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Ensure logged in");

  try {
    const { query } = await req.json(); // Extract the query

    if (!query) {
      console.log("Query missing");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Generate the embedding for the user's query
    const queryEmbedding = await generateEmbedding(query);

    // Find the most similar answer based on embeddings and return it
    const mostRelevantAnswer = await findMostSimilarAnswer(queryEmbedding);

    console.log("Answer generated");

    return NextResponse.json({ answer: mostRelevantAnswer });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
