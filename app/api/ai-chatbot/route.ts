/* eslint-disable @typescript-eslint/no-unused-vars */
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { NextApiRequest, NextApiResponse } from "next";
import { isLoggedIn } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

// Function to calculate Levenshtein Distance
const levenshteinDistance = (str1: string, str2: string) => {
  const dp: number[][] = [];

  for (let i = 0; i <= str1.length; i++) {
    dp[i] = [];
    dp[i][0] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[str1.length][str2.length];
};

// Function to find the most relevant answer based on Levenshtein Distance
const findMostRelevantAnswer = (query: string, userRole: string) => {
  interface KnowledgeItem {
    role: string;
    question: string;
    answer: string;
  }

  const relevantKnowledge: KnowledgeItem[] = (
    knowledgeBase as KnowledgeItem[]
  ).filter((item: KnowledgeItem) => item.role === userRole);

  // If no relevant knowledge is found for the role, return a specific message
  if (relevantKnowledge.length === 0) {
    return "Sorry, I could not find an answer to your question.";
  }

  let closestMatch = "";
  let lowestDistance = Infinity;

  for (const item of relevantKnowledge) {
    const distance = levenshteinDistance(
      query.toLowerCase(),
      item.question.toLowerCase()
    );
    if (distance < lowestDistance) {
      lowestDistance = distance;
      closestMatch = item.answer;
    }
  }

  return closestMatch || "Sorry, I could not find an answer to your question.";
};

// Function to generate response based on the user's query
export async function generateResponse(query: string, userRole: string) {
  let persona =
    "You are NebulAI, a helpful assistant that educates user about Nebula in a professional and friendly manner.";

  if (userRole === "business_owner") {
    persona =
      "You are NebulAI, a helpful assistant that assists business owners in Nebula. Your role is to guide them on how to list their services, manage their availability, manage their bookings as well as general issues such as changing profile picture etc.";
  } else if (userRole === "user") {
    persona =
      "You are NebulAI, a helpful assistant that assists potential customers with tasks such as browsing services, making bookings, rescheduling them etc.";
  }

  const fewShotPrompts: ChatCompletionMessageParam[] = [
    { role: "system", content: persona },
    { role: "user", content: "How to book a service?" },
    {
      role: "assistant",
      content:
        "To book a service, simply browse for the shop offering the service in 'Browse Services', click on the 'Book Now' button at the service, and make a booking at the bookimg interface based on your availability.",
    },
    { role: "user", content: query }, // For now one example and then user's query right away
  ];

  // Find the relevant answer from knowledge base
  const correctKnowledge = findMostRelevantAnswer(query, userRole);

  // Generate the final response as a result of few shot prompting
  try {
    const response = await openAi.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        ...fewShotPrompts,
        { role: "assistant", content: correctKnowledge },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error); // Log OpenAI API errors
    throw new Error("Failed to call OpenAI API"); // Rethrow if you want to handle it further
  }
}

// POST method to actually handle the chatbot queries
export async function POST(req: NextRequest) {
  console.log("Received request");

  const session = await isLoggedIn();
  console.log("Session:", session);
  if (!session || !session.user?.id) {
    console.log("User not logged in");
    return NextResponse.json(
      { error: "User needs to be logged in" },
      { status: 401 }
    );
  }

  try {
    const { query } = await req.json();
    console.log("Query:", query); // Log the query received

    if (!query) {
      console.log("Query missing");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    console.log("Prisma user:", user);

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ error: "User is not found" }, { status: 404 });
    }

    let userRole = "user";

    if (session.user.role === "BUSINESS_OWNER") {
      userRole = "business_owner";
    }

    // Generate response
    const response = await generateResponse(query, userRole);

    console.log("Answer generated");

    return NextResponse.json({ answer: response });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
