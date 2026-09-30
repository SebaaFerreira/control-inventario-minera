import { useRecords } from '../useRecords';
import { apiFetch as fetch } from '../api';
import { useState, useRef } from 'react';
// 1. Importamos el nuevo componente de búsqueda
import Select from 'react-select';

function Salidas() {
  const { data, recargar: cargarArticulos } = useRecords('articulos', 'trabajadores');
  const articulos = data?.[0] || [];
  const trabajadores = data?.[1] || [];
  const enviando = useRef(false);
  const claveSalida = useRef(null);
  const [procesando, setProcesando] = useState(false);

  // Estados para los campos del formulario
  const [trabajadorId, setTrabajadorId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [capataz, setCapataz] = useState('');
  const [destino, setDestino] = useState('');
  const [turno, setTurno] = useState('Día');



  // 2. Formateamos la lista de trabajadores para que react-select la entienda
  // Mostrará: "RUT - Nombre Completo (Rol)" y guardará el ID interno.
  const opcionesTrabajadores = trabajadores.filter(t => t.habilitado_retiro).map(t => ({
    value: t.id,
    label: `${t.rut} - ${t.nombre_completo} [${t.rol}]`,
    // Guardamos el turno asignado en el backend para usarlo después si es necesario
    turno: t.turno_asignado
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (enviando.current) return;
    enviando.current = true; setProcesando(true);

    const nuevaSalida = {
      clave_operacion: claveSalida.current ||= crypto.randomUUID(),
      tipo_movimiento: 'SALIDA',
      trabajador: trabajadorId,
      articulo: articuloId,
      cantidad: cantidad,
      capataz_autoriza: capataz,
      destino_uso: destino,
      turno: turno,
    };

    fetch('/movimientos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaSalida)
    })
    .then(response => {
      if(response.ok) {
        alert('✅ Salida registrada con éxito. El stock ha sido descontado.');
        claveSalida.current = null;
        setArticuloId('');
        setCantidad('');
        setDestino('');
        cargarArticulos();
      } else {
        alert('❌ Error al registrar la salida. Revisa los datos.');
      }
    })
    .catch(error => alert(error.message))
    .finally(() => { enviando.current = false; setProcesando(false); });
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Registro de Salidas (Vale de Consumo)</h1>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Fila 1: Trabajador con Buscador y Capataz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trabajador que retira *</label>
              {/* 3. Reemplazamos el select nativo por el buscador dinámico */}
              <Select
                required
                placeholder="Digita RUT o nombre..."
                options={opcionesTrabajadores}
                value={opcionesTrabajadores.find(o => o.value === trabajadorId) || null}
                onChange={(option) => {
                  setTrabajadorId(option ? option.value : '');
                  // Tu observación: Auto-completar el turno del trabajador si viene de la base de datos
                  if (option && option.turno) {
                    // Mapeamos los códigos del backend a los del formulario visual
                    const turnoMap = { 'DIA': 'Día', 'NOCHE': 'Noche', 'A': 'Turno A', 'B': 'Turno B', 'E': 'Turno E' };
                    setTurno(turnoMap[option.turno] || option.turno);
                  }
                }}
                className="text-gray-800"
              />
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
                {articulos.filter(a => a.estado === 'OPERATIVO' && Number(a.stock_actual) > 0).map(a => (
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
                <option value="Turno A">Turno A</option>
                <option value="Turno B">Turno B</option>
                <option value="Turno E">Turno E</option>
                {!['Día', 'Noche', 'Turno A', 'Turno B', 'Turno E'].includes(turno) && <option value={turno}>{turno}</option>}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit" disabled={procesando}
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
