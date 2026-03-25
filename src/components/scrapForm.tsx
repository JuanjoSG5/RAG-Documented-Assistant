import { useState } from "react";
import CustomInput from "@/src/components/input";

const ScraperForm = () => {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState(10);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("Iniciando...");

    try {
      const res = await fetch("/api/scrape_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, depth }),
      });

      if (!res.ok) {
        throw new Error("Error en la petición HTTP al servidor");
      }

      if (!res.body) {
        throw new Error("Response body is empty");  
      }
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; 

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        
        buffer = lines.pop() ?? ""; 

        for (let line of lines) {
          if (!line.trim()) continue; 

          if (line.startsWith("data:")) {
            line = line.substring(5).trim();
          }
          
          try {
            const data = JSON.parse(line);
            
            // Update the UI dynamically with the current URL being scraped
            if (data.type === "progress") {
              setMessage(data.message);
            } else if (data.type === "done") {
              setMessage(data.message);
            } else if (data.type === "error") {
              setError(data.message);
            }
          } catch (parseError) {
            console.error("Failed to parse JSON chunk:", line, parseError);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Fallo inesperado");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      className="flex flex-col bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300" 
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3">
        <span className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shadow-md">1</span>
        Train your AI Assistant
      </h2>
      
      <div className="flex flex-col gap-5">
        <CustomInput id="urlInput" text="Website URL" value={url} setValue={setUrl} />
        <CustomInput id="depthInput" text="Crawl Depth" value={depth} setValue={setDepth} />

        <button
          disabled={loading}
          className="mt-4 bg-blue-600 text-white font-medium px-4 py-3 rounded-xl w-full hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
          type="submit"
        >
          {loading ? "Processing..." : "Scrape and Save"}
        </button>
      </div>

      {message && (
        <p className="mt-6 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-center text-sm font-medium break-words">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-center text-sm font-medium break-words">
          {error}
        </p>
      )}
    </form>
  );
};


export default ScraperForm;