import { crawlUrl } from '@/src/utils/crawler';
import { supabase } from '@/src/utils/supabase';
import { send } from 'node:process';

export default async function handler(req: any, res: any) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache'); 
    res.setHeader('Connection', 'keep-alive'); 

    const { url, depth } = req.body; 

    // This is the event to send progress updates to the client
    const sendEvent = (type: string, data: any) => {
      res.write(`${JSON.stringify({ type, ...data })}\n`);
    }
  
    try {
      console.log(`Starting scrape for URL: ${url}`);
      sendEvent('progress', { message: `Starting scrape for ${url}` });
      
      const response = await crawlUrl(url, depth, (msg) => sendEvent('progress', { message: msg })) as any; 
      
      let markdownText = "";

      if (Array.isArray(response) && response.length > 0) {
          markdownText = response.map((item: any) => item.markdown).join("\n\n---\n\n");
      } 

      if (!markdownText) {
         console.error("Error: No markdown text extracted.", response);
         sendEvent('error', { message: "No markdown text extracted." });
         return res.status(400).json({ message: "No markdown text extracted." });
      }

      console.log(`Markdown text extracted, length: ${markdownText.length} characters.`);

      const { error } = await supabase.from("articles").insert({ markdown: markdownText });
      
      if (error) {
          console.error("Error inserting in Supabase:", error);
          throw error;
      }
      
      sendEvent('end', { message: "Scraped and saved successfully!" });
      res.end();
      
    } catch (err: any) {
      console.error("Error crítico en scrape_post:", err);
      sendEvent('error', { message: "Failed", error: err.message });
      res.status(500).json({ message: "Failed", error: err.message });
    }
}