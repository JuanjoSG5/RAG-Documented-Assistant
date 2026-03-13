import { createClient } from '@supabase/supabase-js'
import { crawlUrl } from '@/src/utils/crawler';

const supabase = createClient(`${process.env.NEXT_SUPABASE_URL}`, `${process.env.NEXT_SUPABASE_KEY}`)

export default async function handler(req, res) {
    const { url, depth } = req.body;
  
    try {
      console.log("Received URL:", url);
      const response = await crawlUrl(url, depth);
      for (let i in response["data"]){
        console.log("Element:", i);
      
        const markdown = response["data"][i]["markdown"]
        const { error } = await supabase.from("articles").insert({ markdown });
        if (error) throw error;
      }
      
  
      res.status(200).json({ message: "Scraped and saved!" });
    } catch (err) {
      res.status(500).json({ message: "Failed", error: err.message });
    }
  }