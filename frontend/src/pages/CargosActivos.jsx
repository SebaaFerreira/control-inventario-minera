import { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, Clock, CheckCircle2, RefreshCcw, FileSpreadsheet, HardHat, RefreshCw } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';

export default function CargosActivos() {
  const [cargando, setCargando] = useState(true);
  const [articulos, setArticulos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  
  // Estado para el buscador
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

  const cargarDatosGlobales = () => {
    setCargando(true);
    Promise.all([
      fetch('http://127.0.0.1:8000/api/movimientos/').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/articulos/').then(res => res.json()),
      fetch('http://127.0.0.1:8000/api/trabajadores/').then(res => res.json())
    ])
    .then(([movs, arts, trabs]) => {
      setMovimientos(Array.isArray(movs) ? movs.sort((a, b) => b.id - a.id) : []);
      setArticulos(Array.isArray(arts) ? arts : []);
      setTrabajadores(Array.isArray(trabs) ? trabs : []);
      setCargando(false);
    })
    .catch(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatosGlobales();
  }, []);

  const opcionesTrabajadores = trabajadores.map(t => ({
    value: t.id, 
    label: `${t.rut} - ${t.nombre_completo} [${t.especialidad || t.rol}]`,
    datos: t
  }));

  // =========================================================
  // 🧠 LÓGICA DE FILTRADO (A PRUEBA DE BALAS)
  // =========================================================
  
  // 1. Convertimos el ID a string para evitar choques entre Textos y Números
  const idBuscado = trabajadorSeleccionado ? String(trabajadorSeleccionado.value) : null;

  const movimientosDelTrabajador = idBuscado 
    ? movimientos.filter(m => {
        // A veces Django manda el trabajador como objeto, a veces como número. Esto lo ataja todo:
        const idMovimiento = typeof m.trabajador === 'object' ? String(m.trabajador.id) : String(m.trabajador);
        return idMovimiento === idBuscado;
      })
    : [];

  // 2. Lo que tiene en sus manos HOY (Comparamos en MAYÚSCULAS y limpiamos espacios)
  const cargosPendientes = movimientosDelTrabajador.filter(m => {
    const tipo = String(m.tipo_movimiento).toUpperCase().trim();
    const estado = String(m.estado_prestamo).toUpperCase().trim();
    // Exigimos que sea una Salida y que NO esté devuelto
    return tipo === 'SALIDA' && estado !== 'DEVUELTO';
  });

  // 3. Lo que ya devolvió históricamente
  const cargosDevueltos = movimientosDelTrabajador.filter(m => {
    const estado = String(m.estado_prestamo).toUpperCase().trim();
    return estado === 'DEVUELTO';
  });

  // Utilidades
  const getNombreArticulo = (id) => articulos.find(a => String(a.id) === String(id))?.nombre || `Insumo ID: ${id}`;
  const getCodigoArticulo = (id) => articulos.find(a => String(a.id) === String(id))?.codigo_interno || '-';
  
  const calcularDiasEnTerreno = (fechaString) => {
    const fechaEntrega = new Date(fechaString);
    const hoy = new Date();
    const diferenciaMs = hoy - fechaEntrega;
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    return dias;
  };

  // =========================================================
  // 🔄 RECIBIR DEVOLUCIÓN DIRECTO DESDE LA FICHA
  // =========================================================
  const handleRecibirDevolucion = (movimiento) => {
    Swal.fire({
      title: '¿Confirmar Devolución?',
      html: `¿Estás seguro de que <b>${trabajadorSeleccionado.datos.nombre_completo}</b> está devolviendo <b>${movimiento.cantidad}x ${getNombreArticulo(movimiento.articulo)}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, recibir insumo',
      confirmButtonColor: '#d97706',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/movimientos/${movimiento.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado_prestamo: 'DEVUELTO' })
        }).then(res => {
          if (res.ok) {
            Swal.fire('✅ Recibido', 'El stock volvió a la bodega.', 'success');
            cargarDatosGlobales(); 
          }
        });
      }
    });
  };

  // =========================================================
  // 📥 EXPORTAR COMPROBANTE DE CARGOS (PAZ Y SALVO)
  // =========================================================
  const handleExportarComprobante = () => {
    if (cargosPendientes.length === 0) return Swal.fire('Sin Cargos', 'Este trabajador no tiene deudas pendientes con bodega.', 'info');
    
    const encabezados = ['RUT Operario', 'Nombre', 'Código Artículo', 'Herramienta / EPP', 'Cantidad Adeudada', 'Fecha de Entrega', 'Días en Terreno'];
    
    const filas = cargosPendientes.map(m => [
      trabajadorSeleccionado.datos.rut,
      trabajadorSeleccionado.datos.nombre_completo,
      getCodigoArticulo(m.articulo),
      getNombreArticulo(m.articulo),
      m.cantidad,
      new Date(m.fecha_hora).toLocaleDateString(),
      `${calcularDiasEnTerreno(m.fecha_hora)} días`
    ]);

    const contenidoCSV = [
      encabezados.join(';'),
      ...filas.map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `Cargos_Pendientes_${trabajadorSeleccionado.datos.rut}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <UserCheck className="text-indigo-600" size={32} />
            Rastreador y Ficha de Cargos
          </h2>
          <p className="text-slate-500 mt-1">Consulta exactamente qué insumos tiene asignados cada trabajador.</p>
        </div>
        
        {/* Botón para refrescar la ficha sin recargar toda la página */}
        <button onClick={cargarDatosGlobales} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition">
          <RefreshCw size={18} className={cargando ? "animate-spin" : ""} />
          Actualizar Datos
        </button>
      </div>

      {/* ========================================================= */}
      {/* 🔍 BUSCADOR DE TRABAJADOR */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 z-50 relative">
        <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
          <HardHat size={18} className="text-amber-500"/> Buscar Operario en Faena
        </label>
        <Select 
          options={opcionesTrabajadores} 
          onChange={setTrabajadorSeleccionado}
          isLoading={cargando}
          placeholder="Escribe el nombre o RUT del trabajador para ver su ficha..."
          className="text-lg text-slate-900"
        />
      </div>

      {trabajadorSeleccionado && (
        <div className="space-y-8 animate-fade-in-up">
          
          {/* ========================================================= */}
          {/* 🚨 SECCIÓN: PENDIENTES DE DEVOLUCIÓN (LO QUE DEBE) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertCircle size={22} /> Cargos Activos (Pendientes de Devolución)
              </h3>
              <button onClick={handleExportarComprobante} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 transition shadow-sm">
                <FileSpreadsheet size={16}/> Reporte de Deuda
              </button>
            </div>
            
            <div className="p-0">
              {cargosPendientes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
                  <CheckCircle2 size={48} className="text-emerald-400 mb-2"/>
                  Este operario está al día. No tiene herramientas ni insumos pendientes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                        <th className="p-4 font-semibold">Código</th>
                        <th className="p-4 font-semibold">Artículo en su poder</th>
                        <th className="p-4 text-center font-semibold">Cantidad</th>
                        <th className="p-4 font-semibold">Fecha Entrega</th>
                        <th className="p-4 text-center font-semibold">Tiempo Transcurrido</th>
                        <th className="p-4 text-center font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                      {cargosPendientes.map((m) => {
                        const dias = calcularDiasEnTerreno(m.fecha_hora);
                        return (
                          <tr key={m.id} className="hover:bg-red-50/50 transition">
                            <td className="p-4 font-mono">{getCodigoArticulo(m.articulo)}</td>
                            <td className="p-4 font-bold text-slate-900">{getNombreArticulo(m.articulo)}</td>
                            <td className="p-4 text-center font-bold text-red-600">{m.cantidad}</td>
                            <td className="p-4 text-slate-500">{new Date(m.fecha_hora).toLocaleDateString()}</td>
                            <td className="p-4 text-center">
                              <span className={`flex items-center justify-center gap-1 font-bold ${dias > 7 ? 'text-red-600' : 'text-amber-600'}`}>
                                <Clock size={16} /> Hace {dias} días
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleRecibirDevolucion(m)} className="flex items-center justify-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition font-medium text-xs mx-auto shadow-sm">
                                <RefreshCcw size={14} /> Recibir Insumo
                              </button>
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

          {/* ========================================================= */}
          {/* 📜 SECCIÓN: HISTORIAL DE DEVOLUCIONES (LO QUE YA ENTREGÓ) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-500"/> Historial de Insumos Devueltos
              </h3>
            </div>
            
            <div className="p-0 max-h-[400px] overflow-y-auto">
              {cargosDevueltos.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">Aún no registra devoluciones en el sistema.</div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs border-b">
                      <th className="p-3 font-semibold">Artículo Devuelto</th>
                      <th className="p-3 text-center font-semibold">Cant.</th>
                      <th className="p-3 font-semibold">Fecha Original de Salida</th>
                      <th className="p-3 text-center font-semibold">Estado Actual</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 text-sm divide-y divide-slate-100">
                    {cargosDevueltos.map((m) => (
                      <tr key={m.id}>
                        <td className="p-3 font-medium">{getNombreArticulo(m.articulo)}</td>
                        <td className="p-3 text-center">{m.cantidad}</td>
                        <td className="p-3 text-slate-400">{new Date(m.fecha_hora).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">DEVUELTO</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}