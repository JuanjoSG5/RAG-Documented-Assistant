import React from "react";
import Chatbot from "@/src/components/chatbot";
import ScraperForm from "@/src/components/scrapForm";

export default function Home() {
  return (
    <main className="flex flex-col content-center items-center justify-center min-h-screen mx-auto p-4 lg:max-w-4xl md:max-w-2xl">
      <h1 className="text-3xl font-bold mb-4 py-4">
        Customizable Chatbot with RAG
      </h1>
      <p className="text-xl mb-4">
        To use this chatbot, first you need to add the website you want to
        scrape to look for information. Then decide on the depth of the crawl
        (the amount of pages it will go through to collect the information,
        Currently the max_depth is set to 10 pages, meaning it will only scrape
        the first 10 pages of the website you provide). 
        
        After that, you can start chatting with the AI and it will use the information from the
        website to answer your questions. Click the button at the bottom right
        corner to begin chatting.
      </p>
      <hr />
      <p className="text-xl mb-4">
        Para usar este chatbot, primero debes agregar el sitio web del que
        deseas extraer información. Luego, decide la profundidad del rastreo (la
        cantidad de páginas que recorrerá para recopilar la información.
        Actualmente, la profundidad máxima (max_depth) está configurada en 10
        páginas, lo que significa que solo extraerá datos de las primeras 10
        páginas del sitio web que proporcionaste). 

        Después de eso, puedes comenzar a chatear con la IA, y esta usará la
        información del sitio web para responder a tus preguntas. Haz clic en
        el botón en la esquina inferior derecha para comenzar a chatear.
      </p>
      <ScraperForm />
      <Chatbot />
    </main>
  );
}
