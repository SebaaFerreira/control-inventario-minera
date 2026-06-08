import { useState, useEffect } from 'react';

function Articulos() {
  const [articulos, setArticulos] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(response => response.json())
      .then(data => setArticulos(data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">Listado de Artículos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow transition">
          + Nuevo Artículo
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {articulos.length === 0 ? (
          <p className="text-gray-500 animate-pulse">Buscando artículos en el servidor...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articulos.map(articulo => (
              <div key={articulo.id} className="p-5 border border-gray-200 rounded-lg hover:shadow-md transition bg-gray-50">
                <div className="text-xs font-bold text-blue-600 mb-1">{articulo.codigo_interno}</div>
                <div className="font-semibold text-gray-800 text-lg mb-2">{articulo.nombre}</div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">Stock Actual:</span>
                  <span className="text-lg font-bold text-gray-700">
                    {articulo.stock_actual} <span className="text-sm font-normal">{articulo.unidad_medida}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Articulos;