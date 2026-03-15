import { pipeline } from '@xenova/transformers';
import { retrieve } from '@/src/utils/embeddings'; // Asegúrate de que la ruta es correcta

export default async function sendQuestion(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  
  try {
    console.log("1. Vectorizando la pregunta con Xenova...");
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const qOut = await extractor(question, { pooling: 'mean', normalize: true });
    const queryEmb = Array.from(qOut.data);
    
    // Le pasamos el vector a Supabase y nos devuelve los 3 mejores.
    console.log("2. Buscando similitudes en Supabase...");
    const topDocs = await retrieve(queryEmb); 
    
    console.log("3. Construyendo el contexto...");
    // Dependiendo de tu SQL en Supabase, el texto viene en 'content' o en 'text'. Pongo ambas por seguridad.
    const contextText = topDocs.map(d => `Fuente:\n${d.content || d.text}`).join('\n\n');
    
    console.log("4. Llamando al LLM (Gemini via OpenRouter)...");
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_OPENROUTER_TOKEN}`, // Verifica que tu .env se llame así
          'X-Title': 'ChatbotApp',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL_NAME,
          messages:[
            { role: 'system', content: `Eres un asistente útil. Responde a la pregunta basándote ÚNICAMENTE en este contexto:\n\n${contextText}` },
            { role: 'user', content: question }
          ]}),
        });
        
    const data = await response.json();
    const reply = data.choices?.[0]?.message;
    
    console.log("5. ¡Respuesta generada con éxito!");
    res.status(200).json({ reply });
    
  } catch (error) {
    console.error("Error crítico en el chat:", error);
    res.status(500).json({ error: 'Processing failed' });
  }
}