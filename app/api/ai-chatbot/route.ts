/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { isLoggedIn } from "@/app/lib/hooks";
import prisma from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { open } from "inspector/promises";

// Initialise OpenAI API
const openAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Declare new type for knowledge base
interface Knowledge {
  role: string;
  question: string;
  answer: string;
}

// Load the knowledge base from the JSON file dynamically
const loadKnowledgeBase = () => {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "app/api/ai-chatbot/knowledge.json"),
      "utf-8"
    )
  );
};

// // Load the knowledge base file (knowledge.json)
// const knowledgeBase: Knowledge[] = JSON.parse(
//   fs.readFileSync(
//     path.join(process.cwd(), "app/api/ai-chatbot/knowledge.json"),
//     "utf-8"
//   )
// );

// const testing = knowledgeBase.filter((item) => item.role === "business-owner");
// console.log(testing);

// Generate embeddings for each entry in the knowledge base
const generateEmbedding = async (text: string) => {
  const response = await openAi.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
};

// Function to determine cosine similarity
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

// Function to find most relevant answer
const findMostRelevantAnswer = async (query: string, userRole: string) => {
  // Filter knowledge by role
  const knowledgeBase: Knowledge[] = loadKnowledgeBase();
  const relevantKnowledge = knowledgeBase.filter(
    (item) => item.role === userRole
  );

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Find the most relevanr answer
  let bestMatch = null;
  let highestSimilarity = -Infinity;

  for (const item of relevantKnowledge) {
    const itemEmbedding = await generateEmbedding(item.question);
    const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item.answer;
    }
  }

  if (highestSimilarity < 0.8) {
    return "Sorry, I could not find an answer to your question.";
  }

  return bestMatch;
};

const generateResponse = async (query: string, userRole: string) => {
  // Define persona
  let persona =
    "You are NebulAI, a helpful assistant that educates the user about Nebula. You must answer strictly from the knowledge base.";

  if (userRole === "business-owner") {
    persona =
      "You are NebulAI, a helpful assistant for business owners using Nebula. Your role is to guide them on how to list services, manage availability, and handle bookings. Your answers should strictly adhere to the official knowledge base.";
  } else if (userRole === "user") {
    persona =
      "You are NebulAI, a helpful assistant for users of Nebula. Your role is to guide users on how to book services and browse available services. You must only answer based on the knowledge base.";
  }

  // Prompts to use for few shot prompting
  const fewShotPrompts: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are NebulAI, a helpful assistant that educates the user about Nebula. Your answers should be **strictly from the knowledge base** and should not deviate from it.",
    },

    // Example of a simple query (very similar to knowledge bank)
    { role: "user", content: "How do I book a slot for a service?" },
    {
      role: "assistant",
      content:
        "Upon selecting on the shop that offers the particular service and successfully finding the service, click on 'Book Now' to be redirected to the booking interface. Nebula has an interactive calendar where you can browse through the dates and see the available slots to request a booking. In order to make an informed decision, you can also have a look at the Comments Section",
    },

    // Example of a compound query enquiring about multiple actions
    {
      role: "user",
      content:
        "How do I add services I offer as a business owner and manage bookings?",
    },
    {
      role: "assistant",
      content:
        "To add services: A business owner would need to have created a shop firstly. If this has already been done, go to 'My Services' and use the 'Create Service' form to list the services you offer one by one. \n\n" +
        "To manage bookings: Navigate to the 'My Bookings' page and you will see the list of bookings, both pending and confirmed. You are required to either accept or decline a pending booking. Upon accepting it, both your Google Calendar as well as the user's one will be updated accoridingly.",
    },

    // Example of another compound query, this time from a 'user' account owner
    {
      role: "user",
      content:
        "How do I check the bookings I currently have? Can I reschedule my bookings?",
    },
    {
      role: "assistant",
      content:
        "To check bookings: You can navigate to the 'My Bookings' page from the sidebar at the left hand side in order to viw Pending and Confirmed bookings that you currently have. Pending bookings are awaiting confirmation form the respective business owner before they becoem a confirmed booking. \n\n" +
        "To reschedule bookings: You simply need to go the 'My Bookings' page, then go to the confirmed appointment and click on the Reschedule button. You can even reschedule your appointment more than once without causing much of an administrative hassle!",
    },

    // Finally, the real user query
    { role: "user", content: query },
  ];

  // Find the most relevant answer from the knowledge base
  const correctKnowledge = await findMostRelevantAnswer(query, userRole);

  // Combine the few-shot example with the knowledge base answer
  fewShotPrompts.push({ role: "assistant", content: correctKnowledge });

  // Response generation
  try {
    const response = await openAi.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: fewShotPrompts,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching response from OpenAI API:", error);
    return "Sorry, something went wrong while generating the response.";
  }
};

// // Map knowledge base to include embeddings
// const knowledgeWithEmbeddings = knowledgeBase.map(
//   async (item: { question: string }) => {
//     const embedding = await generateEmbedding(item.question); // Embedding for the question
//     return { ...item, embedding };
//   }
// );

// // // Function to calculate Levenshtein Distance
// // const levenshteinDistance = (str1: string, str2: string) => {
// //   const dp: number[][] = [];

// //   for (let i = 0; i <= str1.length; i++) {
// //     dp[i] = [];
// //     dp[i][0] = i;
// //   }

// //   for (let j = 0; j <= str2.length; j++) {
// //     dp[0][j] = j;
// //   }

// //   for (let i = 1; i <= str1.length; i++) {
// //     for (let j = 1; j <= str2.length; j++) {
// //       const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
// //       dp[i][j] = Math.min(
// //         dp[i - 1][j] + 1, // Deletion
// //         dp[i][j - 1] + 1, // Insertion
// //         dp[i - 1][j - 1] + cost // Substitution
// //       );
// //     }
// //   }

// //   return dp[str1.length][str2.length];
// // };

// // Function to find the most relevant answer based on Levenshtein Distance
// const findMostRelevantAnswer = async (query: string, userRole: string) => {
//   interface KnowledgeItem {
//     role: string;
//     question: string;
//     answer: string;
//     embedding?: number[];
//   }

//   console.log("We finding now lads");

//   // Filter knowledge base for relevant role
//   const relevantKnowledge: KnowledgeItem[] = (
//     knowledgeBase as KnowledgeItem[]
//   ).filter((item: KnowledgeItem) => item.role === userRole);

//   let bestSimilarityScore = -Infinity;
//   let mostRelevant = "Sorry, I could not find an answer to your question.";

//   // Generate embeddings for relevant knowledge items if not already present
//   // (Assumes knowledgeBase does not have precomputed embeddings)
//   const relevantKnowledgeWithEmbeddings: KnowledgeItem[] = await Promise.all(
//     relevantKnowledge.map(async (item) => {
//       if (!item.embedding) {
//         const embedding = await generateEmbedding(item.question);
//         return { ...item, embedding };
//       }
//       return item;
//     })
//   );

//   // Compare query embedding with each item's embedding
//   relevantKnowledgeWithEmbeddings.forEach((item) => {
//     if (item.embedding) {
//       const similarity = cosineSimilarity(queryEmbedding, item.embedding);
//       if (similarity > bestSimilarityScore) {
//         bestSimilarityScore = similarity;
//         mostRelevant = item.answer;
//       }
//     }
//   });

//   return mostRelevant;
// };

// // Function to generate response based on the user's query
// const generateResponse = async (query: string, userRole: string) => {
//   let persona =
//     "You are NebulAI, a helpful assistant that educates the user about Nebula. You are not allowed to generate creative responses. All answers must come strictly from the provided knowledge base. Do not deviate from this information. Do not invent answers or generate new methods, steps, or procedures. If no answer is found in the knowledge base, you must inform the user that no information is available. You must stick to the provided information at all times.";

//   if (userRole === "business_owner") {
//     persona =
//       "You are NebulAI, a helpful assistant for business owners using Nebula. Your role is to guide them on how to list services, manage availability, handle bookings, and more. All your responses should be **directly based** on the official knowledge base and processes in Nebula. You must not invent any new methods or processes.";
//   } else if (userRole === "user") {
//     persona =
//       "You are NebulAI, a helpful assistant for users of Nebula. Your role is to guide users on how to book services, browse available services, and more. You must ONLY give responses **directly from the knowledge base** and **not extrapolate or make assumptions**.";
//   }

//   const fewShotPrompts: ChatCompletionMessageParam[] = [
//     { role: "system", content: persona },
//     { role: "user", content: "How to book a service?" },
//     {
//       role: "assistant",
//       content:
//         "Upon selecting on the shop that offers the particular service and successfully finding the service, click on 'Book Now' to be redirected to the booking interface. Nebula has an interactive calendar where you can browse through the dates and see the available slots to request a booking. In order to make an informed decision, you can also have a look at the Comments Section.",
//     },
//     { role: "user", content: query }, // For now one example and then user's query right away
//   ];

//   const correctKnowledge = await findMostRelevantAnswer(query, userRole);
//   console.log(correctKnowledge);

//   // Generate the final response as a result of few shot prompting
//   return correctKnowledge;
//   // if (
//   //   correctKnowledge === "Sorry, I could not find an answer to your question."
//   // ) {
//   //   return correctKnowledge;
//   // }

//   // const response = await openAi.chat.completions.create({
//   //   model: "gpt-3.5-turbo",
//   //   messages: [
//   //     ...fewShotPrompts,
//   //     { role: "assistant", content: correctKnowledge },
//   //   ],
//   // });
//   // return response.choices[0].message.content;
// };

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
      userRole = "business-owner";
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
