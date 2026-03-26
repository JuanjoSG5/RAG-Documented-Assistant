import Header from "./header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // Aquí ponemos el fondo global para toda la app
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      <Header />
      
      {/* El contenido de cada página irá aquí dentro, ocupando el espacio restante */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-12">
        {children}
      </main>
      
      {/* (Opcional) Footer sencillo */}
      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto">
        Built by Juan José Sánchez | AI Engineer
      </footer>

    </div>
  );
}