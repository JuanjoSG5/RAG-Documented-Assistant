
const Chat = ({ messages, loading }) => {
  return (
    <div className="flex flex-col space-y-4 h-full overflow-y-auto p-2">
      {messages
        .filter((msg) => msg.role !== "system")
        .map((msg, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl max-w-[85%] text-sm md:text-base shadow-sm transition-colors duration-300 ${
              msg.role === "user"
                ? "bg-blue-600 text-white self-end rounded-br-none"
                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 self-start rounded-bl-none"
            }`}
          >
            <div className=" whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        
      {/* Thinking animation */}
      {loading && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start p-4 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm flex items-center gap-2 h-12">
          <span className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
          <span className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
          <span className="w-2.5 h-2.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
        </div>
      )}
    </div>
  );
};

export default Chat;