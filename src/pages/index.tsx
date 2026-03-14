import Chatbot from "@/src/components/chatbot";
import ScraperForm from "@/src/components/scrapForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header*/}
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            AI Knowledge Base Builder
          </h1>
          <p className="text-lg text-slate-600">
            Ingest any website and test your context-aware RAG assistant instantly.
          </p>
        </header>

        {/* Grid 2 columnas: Formulario a la izq, Chat a la der */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="w-full">
            <ScraperForm />
          </div>
          <div className="w-full">
            <Chatbot />
          </div>
        </div>
      </div>
    </main>
  );
}