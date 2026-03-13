import { NextApiRequest, NextApiResponse } from "next";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { pipeline } from "@xenova/transformers";
import { supabase } from "@/src/utils/supabase";

export default async function setup_rag(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("RAG setup started");
  
    // Get the markdown content
    console.log("Fetching markdown from Supabase...");
    const { data, error } = await supabase
      .from("articles")
      .select("markdown")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Supabase fetch error:", error);
      console.log("DATA::", data);
      throw error;
    }
    
    console.log("Markdown fetched successfully, length:", data?.markdown?.length);
    if (!data?.markdown) {
      throw new Error("No markdown content found");
    }

    // Process the markdown
    console.log("Splitting markdown into chunks...");
    const splitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(data.markdown);
    const docs = chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: { chunk: index },
    }));
    console.log(`Split into ${docs.length} chunks`);

    // Initialize Xenova pipeline for embeddings
    console.log("Initializing Xenova pipeline...");
    try {
      const extractor = await pipeline(
        "feature-extraction", 
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("Pipeline initialized successfully");
      
      // Process in smaller batches to avoid memory issues
      console.log("Generating embeddings for chunks...");
      const processedDocs: Array<{ id: string; text: string; embedding: any[] }> = [];
      
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        console.log(`Processing chunk ${i+1}/${docs.length}`);
        
        try {
          // Generate embeddings
          const output = await extractor(doc.pageContent, { 
            pooling: "mean", 
            normalize: true 
          });
          
          // Check if output.data exists and is iterable
          if (!output?.data) {
            console.error("No embedding data returned for chunk", i);
            continue;
          }
          
          // Convert to regular array for storage
          const embedding = Array.from(output.data);
          
          processedDocs.push({
            id: `doc-${i}`,
            text: doc.pageContent,
            embedding: embedding,
          });
        } catch (chunkError) {
          console.error(`Error processing chunk ${i}:`, chunkError);
          // Continue with other chunks even if one fails
        }
      }
      
      console.log(`Successfully processed ${processedDocs.length} out of ${docs.length} chunks`);
      
      if (processedDocs.length === 0) {
        throw new Error("No chunks could be processed successfully");
      }

      // Store the processed documents in Supabase
      console.log("Storing documents in Supabase...");
      const { error: insertError } = await supabase
        .from("documents")
        .upsert(processedDocs);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }
      
      console.log("RAG setup completed successfully");
      res.status(200).json({ success: true });
    } catch (pipelineError) {
      console.error("Pipeline error:", pipelineError);
      res.status(500).json({ 
        success: false, 
        error: pipelineError instanceof Error ? pipelineError.message : "Pipeline processing failed" 
      });
      return; 
    }
  } catch (error) {
    console.error("Error in RAG setup:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to set up RAG" 
    });
  }
}