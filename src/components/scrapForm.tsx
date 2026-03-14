import { useState } from "react";
import CustomInput from "@/src/components/input";

const ScraperForm = () => {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState(10);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const res = await fetch("/api/scrape_post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to scrape: " + data.error);
      setMessage("");
      setLoading(false);
      return;
    }
    setMessage(data.message || "Done!");
    setLoading(false);
  };

  return (
    <form className="flex flex-col flex-wrap content-center bg-white p-6 rounded-lg shadow-md border border-gray-200" onSubmit={handleSubmit} >
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
        <p className="mt-4 p-3 w-64 bg-green-100 border border-green-400 text-green-700 rounded-full text-center self-center">{message}</p>
      )}
      {error && <p className="mt-4 p-3 w-64 bg-red-100 border border-red-400 text-red-700 rounded-full text-center self-center">{error}</p>}

    </form>
  );
};

export default ScraperForm;
