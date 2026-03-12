// pages/api/chat.ts
import { pipeline } from '@xenova/transformers';
import { retrieve } from '@/src/utils/embeddings';

export default async function sendQuestion(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  
  try {
    // Get documents from your API or database
    // FIXME this has to be changed since the docs will be added before deployment 
    const docsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`);
    const docs = await docsResponse.json();
    
    // Generate embeddings server-side
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const qOut = await extractor(question, { pooling: 'mean', normalize: true });
    const queryEmb = Array.from(qOut.data);
    
    // Retrieve similar docs
    const topDocs = retrieve(docs, queryEmb);
    const contextText = topDocs.map(d => `Fuente [${d.id}]:\n${d.text}`).join('\n\n');
    
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
            { role: 'system', content: `Utiliza este contexto para responder:\n${contextText}` },
            { role: 'user', content: question }
          ]}),
        })
    const data = await response.json();
    const reply = data.choices?.[0]?.message;
    
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
}