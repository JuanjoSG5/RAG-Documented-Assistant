import { useState, useEffect } from "react";
import Chat from "@/src/components/chat";
import TextBox from "@/src/components/textBox";

const Chatbot = () => {
 const[messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hi! I am your AI Assistant. Once you train me with a website, you can ask me anything about it." },
  ]);
  const[input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    const initializeRag = async () => {
      try {
        const response = await fetch("/api/setup_rag");
        const data = await response.json();
        if (data.success) {
          setIsSetupComplete(true);
        }
      } catch (error) {
        console.error("Failed to initialize RAG:", error);
      }
    };

    initializeRag();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !isSetupComplete) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      if (!res.ok) throw new Error("Web Error");
      if (!res.body) throw new Error("No body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let responseFinished = false;
      let isFirstRealChunk = true;

      while (!responseFinished) {
        const { value, done } = await reader.read();
        responseFinished = done;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const dataStr = chunk.replace(/^data: /, "").trim();
            if (!dataStr) continue;

            try {
              const parsedData = JSON.parse(dataStr);

              // Solo hacemos cosas si el texto NO está vacío
              if (parsedData.text && parsedData.text !== "") {
                
                // Si es la primera palabra real que llega...
                if (isFirstRealChunk) {
                   setLoading(false); // Apagamos el "Thinking..."
                   // Creamos la burbuja de la IA con esta primera palabra
                   setMessages((prev) =>[...prev, { role: "assistant", content: parsedData.text }]);
                   isFirstRealChunk = false;
                } else {
                   // Si ya existía la burbuja, le sumamos las siguientes palabras
                   setMessages((prevMessages) => {
                     const updatedMessages =[...prevMessages];
                     const lastIndex = updatedMessages.length - 1;
                     updatedMessages[lastIndex] = {
                       ...updatedMessages[lastIndex],
                       content: updatedMessages[lastIndex].content + parsedData.text
                     };
                     return updatedMessages;
                   });
                }
              }
            } catch (e) {
              // Ignore broken JSON
            }
          }
        }
      }
      
      // In case the stream is empty
      if (isFirstRealChunk) {
          setLoading(false);
          setMessages((prev) =>[...prev, { role: "assistant", content: "Lo siento, el servidor no ha respondido." }]);
      }

    } catch (err) {
      console.error("Error fetching reply:", err);
      setLoading(false); 
      setMessages((prev) =>[
        ...prev,
        { role: "assistant", content: "Ocurrió un error. Por favor, inténtalo de nuevo." },
      ]);
    }
  };

   return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm h-[600px] overflow-hidden">
      {/* Header del Chat */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={isSetupComplete ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" : "hidden"}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSetupComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          </span>
          Live Assistant
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          {isSetupComplete ? "RAG Engine Ready" : "Initializing Vector Store..."}
        </p>
      </div>

      {/* Ventana de mensajes */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        <Chat messages={messages} loading={loading} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <TextBox
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isSetupComplete={isSetupComplete}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Chatbot;