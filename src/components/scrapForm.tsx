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

      // Iniciamos el lector del Stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; // Guardamos el texto por si llega cortado a la mitad

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break; // Si ya no hay más datos, salimos del bucle
        

        // Decodificamos el chunk y lo añadimos al buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Separamos por saltos de línea (por si llegan varios mensajes juntos)
        const lines = buffer.split('\n');
        
        // El último elemento puede estar incompleto, lo dejamos en el buffer para la siguiente vuelta
        buffer = lines.pop() ?? ""; 

        for (let line of lines) {
          if (!line.trim()) continue; // Ignoramos líneas vacías

          if (line.startsWith("data:")) {
            line = line.substring(5).trim();
          }
          
          try {
            const data = JSON.parse(line);
            
            // Update the UI dynamically with the current URL being scraped
            if (data.type === "progress") {
              setMessage(data.message); // This will show: "Scrapping (3/10): https://..."
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
    <form className="flex flex-col flex-wrap content-center bg-white p-6 rounded-lg shadow-md border border-gray-200" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-semibold my-4">1. Train your AI Assistant</h2>
      <div className="flex flex-col items-center">
        <CustomInput id="urlInput" text="Website URL" value={url} setValue={setUrl} />
        <CustomInput id="depthInput" text="Crawl Depth" value={depth} setValue={setDepth} />

        <button
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-3xl w-64 hover:bg-blue-600 disabled:opacity-50"
          type="submit"
        >
          {loading ? "Processing..." : "Scrape and Save"}
        </button>
      </div>

      {message && (
        <p className="mt-4 p-3 w-64 bg-green-100 border border-green-400 text-green-700 rounded-xl text-center self-center text-sm break-words">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 p-3 w-64 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center self-center text-sm break-words">
          {error}
        </p>
      )}
    </form>
  );
};

export default ScraperForm;