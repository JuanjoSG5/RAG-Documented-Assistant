import Chatbot from "@/src/components/chatbot";
import ScraperForm from "@/src/components/scrapForm";
import Layout from "@/src/components/layout";

export default function Home() {
  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Data Ingestion
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Train your assistant by providing a website to scrape and index.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="w-full">
          <ScraperForm />
        </div>
        <div className="w-full">
          <Chatbot />
        </div>
      </div>
    </Layout>
  );
}