import { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "@xenova/transformers";
import { supabase } from "@/src/utils/supabase";
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";


const HISTORY_LIMIT = 6; 
const SUPABASE_MATCH_COUNT = 3; // Selects the n more relevant chunks from the database


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    // 1. Recover the previous chat memory
    const { data: historyData } = await supabase
      .from('chat_history')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);

    // Sort the data
    const sortedHistory = historyData
      // The last .join is done so that the sortedHistory is a string rather than a []
      ? historyData.reverse().map(message => `${message.role.toUpperCase()}: ${message.content}`).join("\n")
      : "No previous history.";

    // Create the vectorization of the question 
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    const output = await extractor(question, { pooling: "mean", normalize: true });
    const queryEmbedding = Array.from(output.data);

    // Search most relevant chunks
    const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: SUPABASE_MATCH_COUNT
    });

    if (searchError) throw searchError;

    //  Join the found chunks to pass as context 
    const contextText = documents ? documents.map((doc: any) => doc.content || doc.text).join("\n\n") : "";

    // LLM Prompt 
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a helpful assistant. Use the following pieces of retrieved CONTEXT and the CONVERSATION HISTORY to answer the QUESTION. 
      If the answer is not in the context, just say that you don't know based on the provided website. 
      Keep the answer concise.
      
      CONVERSATION HISTORY:
      {history}

      CONTEXT: 
      {context} 
      
      QUESTION: {question} 
      ANSWER:
    `);

    const apiKey = process.env.NEXT_OPENROUTER_TOKEN;
    if (!apiKey) {
      throw new Error("🚨 ERROR: NEXT_OPENROUTER_TOKEN is not defined on .env file");
    }

    
    const model = new ChatOpenAI({
      modelName: process.env.NEXT_OPENROUTER_MODEL_NAME, 
      apiKey: apiKey,
      // If you are going to use paid models you can uncomment the line below to set a token limit,
      // since I am using a free model for testing I will leave this here
      // maxTokens: 500,
      configuration: { 
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "ChatbotApp"
        }
      },
    });

    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    // We send the message to the LLM
    const responseText = await chain.invoke({
      question: question,
      context: contextText,
      history: sortedHistory
    });

    await supabase.from('chat_history').insert([
      { role: 'user', content: question },
      { role: 'assistant', content: responseText}
    ])

    res.status(200).json({ 
      reply: { role: "assistant", content: responseText } 
    });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    res.status(500).json({ error: error.message });
  }
}