import { useState, useEffect } from 'react';

function Salidas() {
  const [articulos, setArticulos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);

  const [trabajadorId, setTrabajadorId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [capataz, setCapataz] = useState('');
  const [destino, setDestino] = useState('');
  const [turno, setTurno] = useState('Día');

  // 1. NUEVO: Separamos la llamada a la API en una función independiente
  const cargarArticulos = () => {
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(res => res.json())
      .then(data => setArticulos(data));
  };

  // 2. Modificamos el useEffect para que use nuestra nueva función
  useEffect(() => {
    cargarArticulos(); // Carga el stock inicial al abrir la página
    
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(data => setTrabajadores(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault(); 

    const nuevaSalida = {
      tipo_movimiento: 'SALIDA',
      trabajador: trabajadorId,
      articulo: articuloId,
      cantidad: cantidad,
      capataz_autoriza: capataz,
      destino_uso: destino,
      turno: turno,
      devuelto: false
    };

    fetch('http://127.0.0.1:8000/api/movimientos/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevaSalida)
    })
    .then(response => {
      if(response.ok) {
        alert('✅ Salida registrada con éxito. El stock ha sido descontado.');
        setArticuloId('');
        setCantidad('');
        setDestino('');
        
        // 3. NUEVO: Llamamos a la función para refrescar la lista en milisegundos
        cargarArticulos();
        
      } else {
        alert('❌ Error al registrar la salida. Revisa los datos.');
      }
    })
    .catch(error => console.error("Error en la conexión:", error));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Registro de Salidas (Vale de Consumo)</h1>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Fila 1: Trabajador y Capataz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trabajador que retira *</label>
              <select 
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={trabajadorId}
                onChange={(e) => setTrabajadorId(e.target.value)}
              >
                <option value="">Seleccione un trabajador...</option>
                {trabajadores.map(t => (
                  <option key={t.id} value={t.id}>{t.rut} - {t.nombre_completo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capataz que autoriza *</label>
              <input 
                type="text" required placeholder="Ej. Pedro Morales"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={capataz} onChange={(e) => setCapataz(e.target.value)}
              />
            </div>
          </div>

          {/* Fila 2: Artículo y Cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Artículo *</label>
              <select 
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={articuloId}
                onChange={(e) => setArticuloId(e.target.value)}
              >
                <option value="">Seleccione un artículo...</option>
                {articulos.map(a => (
                  <option key={a.id} value={a.id}>{a.codigo_interno} | {a.nombre} (Stock: {a.stock_actual})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
              <input 
                type="number" required min="0.01" step="0.01" placeholder="Ej. 2"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
          </div>

          {/* Fila 3: Destino y Turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destino / Uso</label>
              <input 
                type="text" placeholder="Ej. Instalación de faena sector B"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={destino} onChange={(e) => setDestino(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Turno *</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={turno} onChange={(e) => setTurno(e.target.value)}
              >
                <option value="Día">Turno Día</option>
                <option value="Noche">Turno Noche</option>
              </select>
            </div>
          </div>

          {/* Botón de Enviar */}
          <div className="pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="w-full md:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 shadow-md transition"
            >
              Registrar Salida de Bodega
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default Salidas;