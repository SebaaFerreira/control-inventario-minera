import { useState, useEffect } from 'react';
import { History, Download, ArrowUpRight, ArrowDownRight, RefreshCcw, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Historial() {
  const [movimientos, setMovimientos] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = () => {
    setCargando(true);
    // Hacemos 3 llamadas simultáneas para cruzar los IDs con los nombres reales
    Promise.all([
      fetch('http://127.0.0.1:8000/api/movimientos/').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/articulos/').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/trabajadores/').then(res => res.json())
    ])
    .then(([movs, arts, trabs]) => {
      setMovimientos(movs);
      setArticulos(arts);
      setTrabajadores(trabs);
      setCargando(false);
    })
    .catch(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones para buscar los nombres según el ID
  const getNombreArticulo = (id) => articulos.find(a => a.id === id)?.nombre || `ID: ${id}`;
  const getCodigoArticulo = (id) => articulos.find(a => a.id === id)?.codigo_interno || '-';
  const getNombreTrabajador = (id) => trabajadores.find(t => t.id === id)?.nombre_completo || `ID: ${id}`;

  // Función de Excel (Misma tecnología robusta que usamos en Configuración)
  const handleExportarExcel = () => {
    if (movimientos.length === 0) return Swal.fire('Vacio', 'No hay registros', 'info');
    
    const encabezados = ['ID Movimiento', 'Fecha', 'Tipo', 'Código Artículo', 'Artículo', 'Cantidad', 'Trabajador', 'Autoriza', 'Turno', 'Estado Préstamo'];
    
    const filas = movimientos.map(m => [
      m.id,
      new Date(m.fecha_hora).toLocaleString(),
      m.tipo_movimiento,
      getCodigoArticulo(m.articulo),
      getNombreArticulo(m.articulo),
      m.cantidad,
      getNombreTrabajador(m.trabajador),
      m.capataz_autoriza,
      m.turno,
      m.estado_prestamo
    ]);

    const contenidoCSV = [
      encabezados.join(';'),
      ...filas.map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `Bitacora_Movimientos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    Swal.fire('✅ Exportado', 'Bitácora descargada en Excel.', 'success');
  };

  // Función para marcar como devuelto
  const handleRecibirDevolucion = (movimiento) => {
    Swal.fire({
      title: '¿Confirmar Devolución?',
      text: `Recibir ${movimiento.cantidad} unidad(es) de ${getNombreArticulo(movimiento.articulo)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar ingreso',
      confirmButtonColor: '#059669'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/movimientos/${movimiento.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado_prestamo: 'DEVUELTO', fecha_devolucion: new Date().toISOString() })
        }).then(() => {
          Swal.fire('✅ Recibido', 'El stock ha vuelto a la bodega automáticamente.', 'success');
          cargarDatos(); // Refrescamos la tabla
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <History className="text-amber-500" size={32} />
            Bitácora General de Movimientos
          </h2>
          <p className="text-slate-500 mt-1">Historial completo de salidas, entradas y devoluciones de la faena.</p>
        </div>
        
        <button onClick={handleExportarExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-semibold">
          <Download size={20} />
          Exportar a Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {cargando ? (
          <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse">Cargando bitácora...</div>
        ) : movimientos.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-slate-500">No hay movimientos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800 text-white text-sm">
                  <th className="p-4 font-semibold">Fecha y Hora</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Artículo</th>
                  <th className="p-4 text-center font-semibold">Cant.</th>
                  <th className="p-4 font-semibold">Operario</th>
                  <th className="p-4 text-center font-semibold">Estado Préstamo</th>
                  <th className="p-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                {movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500">
                      {new Date(m.fecha_hora).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    
                    <td className="p-4 font-bold">
                      {m.tipo_movimiento === 'SALIDA' ? <span className="text-blue-600 flex items-center gap-1"><ArrowUpRight size={16}/> Salida</span> :
                       m.tipo_movimiento === 'ENTRADA' ? <span className="text-emerald-600 flex items-center gap-1"><ArrowDownRight size={16}/> Entrada</span> :
                       m.tipo_movimiento === 'DEVOLUCION' ? <span className="text-amber-600 flex items-center gap-1"><RefreshCcw size={16}/> Devolución</span> :
                       <span className="text-red-600">Baja</span>}
                    </td>

                    <td className="p-4 font-medium text-slate-900">{getNombreArticulo(m.articulo)}</td>
                    <td className="p-4 text-center font-bold">{m.cantidad}</td>
                    <td className="p-4">{getNombreTrabajador(m.trabajador)}</td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        m.estado_prestamo === 'PENDIENTE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        m.estado_prestamo === 'DEVUELTO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {m.estado_prestamo}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {m.estado_prestamo === 'PENDIENTE' && (
                        <button 
                          onClick={() => handleRecibirDevolucion(m)}
                          className="flex items-center justify-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition font-medium text-xs mx-auto shadow-sm"
                        >
                          <CheckCircle size={14} /> Recibir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}