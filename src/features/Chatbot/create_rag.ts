import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from "@langchain/core/prompts";

export async function setupRag(markdown: string) {
  if (!markdown) {
    throw new Error("Markdown content is required");
  }

  // Split the markdown into chunks
  const splitter = new MarkdownTextSplitter({ 
    chunkSize: 1000, 
    chunkOverlap: 200 
  });
  
  const docs = await splitter.splitDocuments([
    { pageContent: markdown, metadata: {} }
  ]);

  // Create vector store + retriever
  const vectorStore = await Chroma.fromDocuments(
    docs,
    new OpenAIEmbeddings(),
    { collectionName: "demo-collection" }
  );

  const retriever = vectorStore.asRetriever();  // [!code ++]

  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    Question: {question} 
    Context: {context} 
    Answer:
  `);

  // Modern Runnable chain - replaces createStuffDocumentsChain
  const model = new OpenAI({
    modelName: process.env.OPENROUTER_MODEL_NAME,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
  
  const chain = promptTemplate
    .pipe(model)
    .pipe(new StringOutputParser());

  return {
    chain,
    retriever,  
    model
  };
}