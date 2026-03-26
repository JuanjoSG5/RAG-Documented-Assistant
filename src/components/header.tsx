import Link from "next/link";
import ThemeToggle from "./themeToggle";

export default function Header() {
  return (
    <header className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Título y Logo */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            AI Knowledge Base
          </h1>
        </div>

        {/* Navegación y Botón Noche */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
            Setup
          </Link>
          <Link href="/chat" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
            Assistant
          </Link>
          
          {/* Separador visual */}
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>
          
          <ThemeToggle />
        </nav>

      </div>
    </header>
  );
}