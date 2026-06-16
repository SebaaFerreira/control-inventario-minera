import { useState, useEffect } from 'react';
// 1. Importamos Link de React Router para habilitar los botones dinámicos
import { Link } from 'react-router-dom';

function Articulos() {
  const [articulos, setArticulos] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(response => response.json())
      .then(data => setArticulos(data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
      
      {/* CABECERA CON TÍTULOS Y BOTONES */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sustancias Peligrosas (HazMat)</h1>
        <p className="text-gray-500 mt-1">Gestión de inventarios y movimientos.</p>
      </div>

      <div className="flex gap-4 mb-8">
        {/* Botón Nuevo Artículo (Estático temporalmente hasta crear su vista) */}
        <button className="bg-[#00a86b] text-white px-5 py-2.5 rounded-md font-semibold hover:bg-[#008f5d] shadow transition flex items-center gap-2">
          <span>+</span> Nuevo Artículo
        </button>
        
        {/* 2. REPARADO: El botón ahora te manda directo a la pantalla de Salidas con buscador */}
        <Link 
          to="/salidas" 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-semibold hover:bg-blue-700 shadow transition flex items-center gap-2"
        >
          <span>🚀</span> Oficina de Registro Salida
        </Link>
      </div>

      {/* TABLA DE DATOS ESTILIZADA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {articulos.length === 0 ? (
          <p className="text-gray-500 p-6 text-center animate-pulse">Buscando artículos en el servidor de Promet...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm font-semibold">
                  <th className="p-4">Código Interno</th>
                  <th className="p-4">Nombre del Artículo</th>
                  <th className="p-4">Marca</th>
                  <th className="p-4 text-center">Stock real</th>
                  <th className="p-4 text-center">Acciones (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {articulos.map(articulo => {
                  // Lógica para determinar el color del círculo de stock crítico
                  const esCritico = articulo.stock_actual <= articulo.stock_critico;
                  
                  return (
                    <tr key={articulo.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-800">{articulo.codigo_interno}</td>
                      <td className="p-4">{articulo.nombre}</td>
                      <td className="p-4 text-gray-500">{articulo.marca || 'N/A'}</td>
                      
                      {/* 3. REPARADO: Círculos de stock dinámicos verde/rojo según stock_critico */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          esCritico ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {articulo.stock_actual}
                        </span>
                      </td>

                      {/* 4. Iconos CRUD (Visuales con alertas de desarrollo para que no tiren error) */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-3 text-gray-400">
                          <button 
                            onClick={() => alert(`Visualizando detalles de: ${articulo.nombre}`)}
                            className="hover:text-blue-500 transition" title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => alert(`Módulo de edición en desarrollo para: ${articulo.nombre}`)}
                            className="hover:text-amber-500 transition" title="Editar"
                          >
                            📝
                          </button>
                          <button 
                            onClick={() => alert(`Módulo de eliminación en desarrollo`)}
                            className="hover:text-red-500 transition" title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Articulos;