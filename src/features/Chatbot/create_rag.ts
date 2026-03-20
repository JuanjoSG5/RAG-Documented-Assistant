import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from "@langchain/core/prompts";

export async function setupRag(markdown: string) {
  // 1. Limpieza básica: Asegura que el Markdown tenga saltos de línea consistentes
  const cleanMarkdown = markdown.replace(/\r\n/g, '\n');

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 300,
    // Definimos el orden en que queremos dividir el texto
    separators: ["\n# ", "\n## ", "\n### ", "\n\n", "\n", " "],
  });
  
  // splitText devuelve un array de objetos Document
  const headerDocs = await textSplitter.createDocuments([cleanMarkdown]);

  
  const docs = await textSplitter.splitDocuments(headerDocs);

  // Create vector store + retriever
  const vectorStore = await Chroma.fromDocuments(
    docs,
    new OpenAIEmbeddings(),
    { collectionName: "demo-collection" }
  );

  const retriever = vectorStore.asRetriever();

  const promptTemplate = PromptTemplate.fromTemplate(`
    You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. 
    If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
    Question: {question} 
    Context: {context} 
    Answer:
  `);

  // Modern Runnable chain
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