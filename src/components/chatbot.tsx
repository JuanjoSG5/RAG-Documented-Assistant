import React, { useState, useEffect } from "react";
import Chat from "@/src/components/chat";
import TextBox from "@/src/components/textBox";
import CloseIcon from "./icons/closeIcon";

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

    // check the if there is any input and if the setup has finished
    if (!input.trim() || !isSetupComplete) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages([
          ...newMessages, 
          {
            role: data.reply.role || "assistant",
            content: data.reply.content || String(data.reply),
          }]);
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your request.",
          },
        ]);
      }
    } catch (err) {
      console.error("Error fetching reply:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "An error occurred. Please try again." },
      ]);
    } finally {
      setLoading(false);
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