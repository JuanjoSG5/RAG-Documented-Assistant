import { crawlUrl } from '@/src/utils/crawler';
import { supabase } from '@/src/utils/supabase';

export default async function handler(req: any, res: any) {
    // Aceptamos url y depth desde el front (por defecto 1 si no viene)
    const { url } = req.body; 
  
    try {
      console.log(`Starting scrape for URL: ${url}`);
      
      // El "as any" le dice a TypeScript: "Tranquilo, yo me encargo, confía en mí"
      const response = await crawlUrl(url) as any; 
      
      let markdownText = "";

      // Caso 1: Devuelve un solo documento directamente
      if (response && response.markdown) {
          markdownText = response.markdown;
      } 
      // Caso 2: El formato antiguo (1 documento dentro de data)
      else if (response && response.data && response.data.markdown) {
          markdownText = response.data.markdown;
      } 
      // Caso 3: Devuelve un array de documentos directamente (Crawl de varias páginas)
      else if (Array.isArray(response) && response.length > 0) {
          markdownText = response.map((item: any) => item.markdown).join("\n\n---\n\n");
      } 
      // Caso 4: El formato antiguo (Array dentro de data)
      else if (response && Array.isArray(response.data)) {
          markdownText = response.data.map((item: any) => item.markdown).join("\n\n---\n\n");
      }

      if (!markdownText) {
         console.error("Firecrawl no devolvió markdown válido. Respuesta cruda:", response);
         return res.status(400).json({ message: "No se pudo extraer texto de esta URL" });
      }

      console.log(`Markdown extraído con éxito. Longitud: ${markdownText.length} caracteres.`);

      // Insertamos en Supabase en la tabla articles
      const { error } = await supabase.from("articles").insert({ markdown: markdownText });
      
      if (error) {
          console.error("Error insertando en Supabase:", error);
          throw error;
      }
      
      res.status(200).json({ message: "Scraped and saved successfully!" });
      
    } catch (err: any) {
      console.error("Error crítico en scrape_post:", err);
      res.status(500).json({ message: "Failed", error: err.message });
    }
}