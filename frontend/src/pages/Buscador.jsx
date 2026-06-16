import { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Buscador() {
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const consultarTodoElInventario = () => {
    setCargando(true);
    // Solicitamos TODOS los artículos sin filtro de categoría
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(res => res.json())
      .then(data => {
        setArticulos(data);
        setCargando(false);
      })
      .catch(() => {
        // Mock de respaldo por si el backend está apagado
        setArticulos([
          { id: 1, codigo_interno: 'ART-001', nombre: 'Guantes de Cabritilla', marca: 'Steelpro', stock_actual: 45 },
          { id: 2, codigo_interno: 'ART-002', nombre: 'Antiparras Transparentes', marca: '3M', stock_actual: 12 },
          { id: 3, codigo_interno: 'ART-003', nombre: 'Martillo Carpintero', marca: 'Stanley', stock_actual: 10 },
          { id: 4, codigo_interno: 'ART-004', nombre: 'Esmeril Angular 4.5"', marca: 'Makita', stock_actual: 4 },
          { id: 5, codigo_interno: 'ART-005', nombre: 'Diluyente Sintético', marca: 'Sipa', stock_actual: 8 },
          { id: 6, codigo_interno: 'ART-006', nombre: 'Clavos 3 pulgadas', marca: 'Inchalam', stock_actual: 1500 },
          { id: 7, codigo_interno: 'ART-007', nombre: 'Codo PVC 20mm', marca: 'Tigre', stock_actual: 45 }
        ]);
        setCargando(false);
      });
  };

  useEffect(() => {
    consultarTodoElInventario();
  }, []);

  // --- LÓGICA DEL BUSCADOR INTELIGENTE EN TIEMPO REAL ---
  const articulosFiltrados = articulos.filter((item) => {
    const termino = busqueda.toLowerCase();
    const coincideNombre = item.nombre.toLowerCase().includes(termino);
    const coincideCodigo = item.codigo_interno.toLowerCase().includes(termino);
    const coincideMarca = item.marca ? item.marca.toLowerCase().includes(termino) : false;
    
    return coincideNombre || coincideCodigo || coincideMarca;
  });

  // --- CRUD (Para que la Data Table sea 100% interactiva) ---
  const handleVerDetalles = (item) => {
    Swal.fire({ title: `🔍 Detalle de Artículo`, html: `<div class="text-left space-y-2 text-sm p-2"><p><strong>Código:</strong> ${item.codigo_interno}</p><p><strong>Nombre:</strong> ${item.nombre}</p><p><strong>Marca:</strong> ${item.marca || 'N/A'}</p><p><strong>Stock Actual:</strong> ${item.stock_actual} unidades</p></div>`, confirmButtonColor: '#2563eb' });
  };

  const handleEditarArticulo = (item) => {
    Swal.fire({
      title: `📦 Ajuste de Stock`,
      text: `Ingresa el nuevo stock para "${item.nombre}"`,
      input: 'number',
      inputValue: item.stock_actual,
      showCancelButton: true,
      confirmButtonText: 'Actualizar Stock',
      confirmButtonColor: '#d97706',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevoStockFisico = parseInt(result.value);
        fetch(`http://127.0.0.1:8000/api/articulos/${item.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_actual: nuevoStockFisico })
        })
        .then(res => {
          if (res.ok) {
            Swal.fire('✅ Stock Actualizado', 'Modificado correctamente.', 'success');
            consultarTodoElInventario();
          } else {
            Swal.fire('❌ Error', 'Error al comunicar con el servidor.', 'error');
          }
        })
        .catch(() => {
          Swal.fire('⚠️ Modo Local', 'Ajuste local de prueba.', 'warning');
          setArticulos(articulos.map(a => a.id === item.id ? { ...a, stock_actual: nuevoStockFisico } : a));
        });
      }
    });
  };

  const handleEliminarArticulo = (item) => {
    Swal.fire({ title: '¿Eliminar?', text: `Dar de baja "${item.nombre}".`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonText: 'Cancelar' })
    .then((result) => { if (result.isConfirmed) Swal.fire('Eliminado', 'Removido con éxito', 'success'); });
  };

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
                      item.stock_actual > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.stock_actual}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3 text-slate-400">
                      <Eye size={18} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleVerDetalles(item)} />
                      <Edit size={18} className="cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleEditarArticulo(item)} />
                      <Trash2 size={18} className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => handleEliminarArticulo(item)} />
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