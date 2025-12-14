import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Si usas iconos, o usa texto simple

const Layout = () => {
    // Estado: false = cerrado, true = abierto
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100">

            {/* --- BOTÓN HAMBURGUESA (Solo visible en Móvil) --- */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>


            {/* --- SIDEBAR --- */}
            <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1a1f36] text-white transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0
      `}>
                {/* Aquí va tu contenido del menú (Logo, Lista de items, etc.) */}
                <div className="p-4 font-bold text-2xl text-blue-400">Info chef 👨🏻‍🍳</div>
                <nav>
                    {/* Tus items de menú */}
                </nav>
            </aside>


            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {/* Aquí se cargan tus páginas (Recetas, Dashboard, etc.) */}
                <h1 className="text-2xl font-bold">Mis Recetas</h1>
            </main>

            {/* --- FONDO OSCURO (Overlay) --- 
          Para cerrar el menú al dar clic afuera en móvil */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

        </div>
    );
};