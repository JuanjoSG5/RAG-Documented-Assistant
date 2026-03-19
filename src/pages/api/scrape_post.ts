import { crawlUrl } from '@/src/utils/crawler';
import { supabase } from '@/src/utils/supabase';

export default async function handler(req: any, res: any) {
    const { url, depth } = req.body; 
  
    try {
      console.log(`Starting scrape for URL: ${url}`);
      
      const response = await crawlUrl(url, depth) as any; 
      
      let markdownText = "";

      if (Array.isArray(response) && response.length > 0) {
          markdownText = response.map((item: any) => item.markdown).join("\n\n---\n\n");
      } 

      if (!markdownText) {
         console.error("Error: No markdown text extracted.", response);
         return res.status(400).json({ message: "No markdown text extracted." });
      }

      console.log(`Markdown text extracted, length: ${markdownText.length} characters.`);

      const { error } = await supabase.from("articles").insert({ markdown: markdownText });
      
      if (error) {
          console.error("Error inserting in Supabase:", error);
          throw error;
      }
      
      res.status(200).json({ message: "Scraped and saved successfully!" });
      
    } catch (err: any) {
      console.error("Error crítico en scrape_post:", err);
      res.status(500).json({ message: "Failed", error: err.message });
    }
}