import { useState, useEffect } from 'react';
import { UserSearch, Wrench, AlertCircle, Clock } from 'lucide-react';
import Select from 'react-select';

export default function CargosActivos() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Traemos a los trabajadores
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(data => setTrabajadores(data));

    // Traemos todos los movimientos para filtrarlos acá
    fetch('http://127.0.0.1:8000/api/movimientos/')
      .then(res => res.json())
      .then(data => {
        setMovimientos(data);
        setCargando(false);
      });
  }, []);

  const opcionesTrabajadores = trabajadores.map(t => ({
    value: t.id,
    label: `${t.rut} - ${t.nombre_completo} [${t.rol}]`,
    datos: t
  }));

  // Filtramos solo las herramientas que ESTE trabajador tiene PENDIENTES de devolver
  const herramientasPendientes = movimientos.filter(
    m => m.trabajador === trabajadorSeleccionado?.value && m.estado_prestamo === 'PENDIENTE'
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserSearch className="text-indigo-600" size={32} />
          Ficha de Cargos Activos
        </h2>
        <p className="text-slate-500 mt-1">Consulta en tiempo real las herramientas asignadas a cada operario.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Seleccionar Trabajador</label>
        <Select 
          options={opcionesTrabajadores} 
          placeholder="Busca por RUT o nombre..."
          onChange={(opcion) => setTrabajadorSeleccionado(opcion)}
          className="text-slate-900"
        />
      </div>

      {trabajadorSeleccionado && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-3">
            <AlertCircle className="text-indigo-600" size={24} />
            <h3 className="font-bold text-indigo-900">
              Herramientas en poder de {trabajadorSeleccionado.datos.nombre_completo}
            </h3>
          </div>
          
          {herramientasPendientes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <span className="text-4xl block mb-3">✅</span>
              Este trabajador no tiene herramientas pendientes de devolución.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold">Fecha de Retiro</th>
                  <th className="p-4 font-semibold">Artículo</th>
                  <th className="p-4 text-center font-semibold">Cantidad</th>
                  <th className="p-4 font-semibold">Autorizó</th>
                </tr>
              </thead>
              <tbody>
                {herramientasPendientes.map(h => (
                  <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-600 flex items-center gap-2">
                      <Clock size={16} className="text-amber-500" />
                      {new Date(h.fecha_hora).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                      <Wrench size={16} className="text-slate-400" />
                      {h.articulo_nombre || `ID: ${h.articulo}`}
                    </td>
                    <td className="p-4 text-center font-bold">{h.cantidad}</td>
                    <td className="p-4 text-slate-600">{h.capataz_autoriza}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}