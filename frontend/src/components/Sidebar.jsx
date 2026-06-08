import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
      <div className="p-6 text-xl font-bold border-b border-gray-800 tracking-wider">
        PROMET <span className="text-blue-500">BODEGA</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {/* Usamos Link en lugar de button para conectarlo al sistema de rutas */}
        <Link to="/" className="block w-full text-left p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition">
          📊 Dashboard / Artículos
        </Link>
        <Link to="/entradas" className="block w-full text-left p-3 rounded-md hover:bg-gray-700 transition">
          📥 Entradas
        </Link>
        <Link to="/salidas" className="block w-full text-left p-3 rounded-md hover:bg-gray-700 transition">
          📤 Salidas
        </Link>
        <Link to="/cargos" className="block w-full text-left p-3 rounded-md hover:bg-gray-700 transition">
          🛠️ Cargos Pendientes
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
        Usuario: Bodeguero Turno A
      </div>
    </div>
  );
}

export default Sidebar;