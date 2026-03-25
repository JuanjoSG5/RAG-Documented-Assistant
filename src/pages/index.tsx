import Chatbot from "@/src/components/chatbot";
import ScraperForm from "@/src/components/scrapForm";
import ThemeToggle from "@/src/components/themeToggle"; // Importamos el botón

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              AI Knowledge Base Builder
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Ingest any website and test your context-aware RAG assistant instantly.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <ThemeToggle />
          </div>
        </header>
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