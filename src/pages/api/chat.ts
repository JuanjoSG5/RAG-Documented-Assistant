import { NextApiRequest, NextApiResponse } from 'next';
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';
import { retrieve } from '@/src/utils/embeddings';
import { supabase } from '@/src/utils/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;

  
  try {
    // Get documents from database
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("*");

    
    if (docsError) throw docsError;
    
    // Generate embeddings server-side
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const qOut = await extractor(question, { pooling: 'mean', normalize: true });
    const queryEmb = Array.from(qOut.data);
    
    // Retrieve similar docs
    const topDocs = retrieve(docs, queryEmb);
    const contextText = topDocs.map(d => `Source [${d.id}]:\n${d.text}`).join('\n\n');
    

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_OPENROUTER_TOKEN}`,
        'X-Title': 'ChatbotApp',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          { role: 'system', content: `Use this context to answer questions:\n${contextText}` },
          { role: 'user', content: question }
        ]
      }),
    });
    
    const data = await response.json();

    console.log("Response from OpenRouter:", data);

    const reply = data.choices?.[0]?.message || {
        role: "assistant",
        content: "I couldn't find an answer based on the provided context."
      };
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ 
        reply: {
          role: "assistant",
          content: "Sorry, an error occurred while processing your request."
        }
      });
  }
}