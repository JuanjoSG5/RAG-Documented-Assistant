import { NextApiRequest, NextApiResponse } from "next";
import { pipeline } from "@xenova/transformers";
import { supabase } from "@/src/utils/supabase";
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Question is required' });

  try {
    // 1. Convertimos la pregunta del usuario en un Vector usando Xenova (Igual que en setup_rag)
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    const output = await extractor(question, { pooling: "mean", normalize: true });
    const queryEmbedding = Array.from(output.data);

    // 2. Buscamos en Supabase los trozos de texto más parecidos (Similitud del Coseno)
    // Asegúrate de tener la función 'match_documents' creada en el SQL de Supabase
    const { data: documents, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 3 // Cogemos los 3 trozos más relevantes
    });

    if (searchError) throw searchError;

    // 3. Juntamos los textos encontrados para crear el "Contexto"
    const contextText = documents ? documents.map((doc: any) => doc.content || doc.text).join("\n\n") : "";

    // 4. Preparamos a LangChain y al LLM (OpenRouter)
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a helpful assistant. Use the following pieces of retrieved context to answer the question. 
      If the answer is not in the context, just say that you don't know based on the provided website. 
      Keep the answer concise.
      
      Context: {context} 
      
      Question: {question} 
      Answer:
    `);

    const apiKey = process.env.NEXT_OPENROUTER_TOKEN;
    if (!apiKey) {
      throw new Error("🚨 ERROR: NEXT_OPENROUTER_TOKEN no está definida en el .env.local");
    }

    const model = new ChatOpenAI({
      modelName: process.env.NEXT_OPENROUTER_MODEL_NAME, // O el modelo que uses
      apiKey: apiKey, // Usamos apiKey directamente
      configuration: { 
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000", // OpenRouter a veces pide esto
          "X-Title": "ChatbotApp"
        }
      },
    });

    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    // 5. ¡Ejecutamos la magia!
    const responseText = await chain.invoke({
      question: question,
      context: contextText
    });

    // 6. Devolvemos la respuesta al frontend
    res.status(200).json({ 
      reply: { role: "assistant", content: responseText } 
    });

  } catch (error: any) {
    console.error("Error in chat API:", error);
    res.status(500).json({ error: error.message });
  }
}