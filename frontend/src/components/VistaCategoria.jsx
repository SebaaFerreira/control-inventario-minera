import { useParams } from 'react-router-dom';
import { Plus, Send, Inbox, Eye, Edit, Trash2 } from 'lucide-react';

export default function VistaCategoria() {
  // Capturamos la categoría desde la URL
  const { categoriaId } = useParams();

  // Diccionario inteligente: define el título y si la categoría maneja devoluciones
  const configuracionVistas = {
    epp: { titulo: 'Elementos de Protección Personal (EPP)', retornable: false },
    fijaciones: { titulo: 'Fijaciones y Sujeciones', retornable: false },
    tuberias: { titulo: 'Tuberías y Fitting', retornable: false },
    sustancias: { titulo: 'Sustancias Peligrosas (HazMat)', retornable: false },
    manuales: { titulo: 'Herramientas Manuales', retornable: true },
    electricas: { titulo: 'Herramientas Eléctricas', retornable: true },
    leime: { titulo: 'Registro LEIME', retornable: true },
  };

  // Si alguien escribe una ruta rara, mostramos un fallback
  const vistaActual = configuracionVistas[categoriaId] || { titulo: 'Categoría no encontrada', retornable: false };

  // Datos de prueba (Mock) para que veas el diseño antes de conectar Django
  const articulosMock = [
    { id: 1, codigo_interno: 'ART-001', nombre: 'Guantes de Cabritilla', marca: 'Steelpro', stock_actual: 45 },
    { id: 2, codigo_interno: 'ART-002', nombre: 'Antiparras Transparentes', marca: '3M', stock_actual: 12 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 1. Cabecera y Título */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{vistaActual.titulo}</h2>
        <p className="text-slate-500 mt-1">Gestión de inventario y movimientos</p>
      </div>

      {/* 2. Botones de Acción Rápida (Operación Diaria) */}
      <div className="flex gap-4 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-medium">
          <Plus size={18} />
          Nuevo Artículo
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium">
          <Send size={18} />
          Registrar Salida
        </button>

        {/* Este botón SOLO se renderiza si la categoría es retornable */}
        {vistaActual.retornable && (
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-md hover:bg-amber-600 transition shadow-sm font-medium">
            <Inbox size={18} />
            Registrar Devolución
          </button>
        )}
      </div>

      {/* 3. Tabla de Inventario */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
            {articulosMock.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="p-4 text-slate-800 font-medium">{item.codigo_interno}</td>
                <td className="p-4 text-slate-700">{item.nombre}</td>
                <td className="p-4 text-slate-700">{item.marca}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    item.stock_actual > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.stock_actual}
                  </span>
                </td>
                <td className="p-4">
                  {/* Botones CRUD por fila */}
                  <div className="flex justify-center gap-3">
                    <button className="text-slate-400 hover:text-blue-600 transition" title="Ver Detalles">
                      <Eye size={20} />
                    </button>
                    <button className="text-slate-400 hover:text-amber-500 transition" title="Editar Artículo">
                      <Edit size={20} />
                    </button>
                    <button className="text-slate-400 hover:text-red-600 transition" title="Eliminar Artículo">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Mensaje si la tabla está vacía */}
        {articulosMock.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No hay artículos registrados en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}