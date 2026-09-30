import { useRecords } from '../useRecords';
import { verArticulo, editarArticulo, eliminarArticulo } from '../articleActions';
import { useState } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';

export default function Buscador() {
  const [busqueda, setBusqueda] = useState('');

  const { data, cargando, recargar: consultarTodoElInventario } = useRecords('articulos');
  const articulos = data?.[0] || [];


  // --- LÓGICA DEL BUSCADOR INTELIGENTE EN TIEMPO REAL ---
  const articulosFiltrados = articulos.filter((item) => {
    const termino = busqueda.toLowerCase();
    const coincideNombre = item.nombre.toLowerCase().includes(termino);
    const coincideCodigo = item.codigo_interno.toLowerCase().includes(termino);
    const coincideMarca = item.marca ? item.marca.toLowerCase().includes(termino) : false;

    return coincideNombre || coincideCodigo || coincideMarca;
  });

  const handleVerDetalles = verArticulo;
  const handleEditarArticulo = (item) => editarArticulo(item, consultarTodoElInventario);
  const handleEliminarArticulo = (item) => eliminarArticulo(item, consultarTodoElInventario);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Buscador Global</h2>
          <p className="text-slate-500 mt-1">Inventario maestro de la bodega Promet.</p>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition"
            placeholder="Buscar por nombre, código o marca..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {cargando ? (
          <p className="p-6 text-center text-slate-400 animate-pulse">Cargando inventario maestro...</p>
        ) : articulosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Search className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 text-lg">No se encontraron resultados para "{busqueda}"</p>
            <p className="text-slate-400 text-sm mt-1">Intenta con otra palabra clave o verifica el código.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Código Interno</th>
                <th className="p-4 font-semibold">Nombre del Artículo</th>
                <th className="p-4 font-semibold">Marca</th>
                <th className="p-4 font-semibold text-center">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Acciones (CRUD)</th>
              </tr>
            </thead>
            <tbody>
              {articulosFiltrados.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-medium">{item.codigo_interno}</td>
                  <td className="p-4 text-slate-700 font-semibold">{item.nombre}</td>
                  <td className="p-4 text-slate-500">{item.marca || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      Number(item.stock_actual) > Number(item.stock_critico) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.stock_actual}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3 text-slate-400">
                      <Eye role="button" tabIndex={0} aria-label="Ver detalles" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} size={18} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleVerDetalles(item)} />
                      <Edit role="button" tabIndex={0} aria-label="Editar artículo" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} size={18} className="cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleEditarArticulo(item)} />
                      <Trash2 role="button" tabIndex={0} aria-label="Eliminar artículo" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true })); } }} size={18} className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => handleEliminarArticulo(item)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
