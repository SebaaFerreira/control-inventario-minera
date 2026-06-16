import { useState, useEffect } from 'react';
import { FileSpreadsheet, Clock, ArrowLeftRight } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Historial() {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/movimientos/')
      .then(res => res.json())
      .then(data => {
        setMovimientos(data);
        setCargando(false);
      })
      .catch(() => {
        // Mock de respaldo por si el backend está desconectado temporalmente
        setMovimientos([
          { id: 1, articulo_nombre: 'Guantes de Cabritilla', tipo_movimiento: 'SALIDA', cantidad: 5, trabajador_nombre: 'Juan Pérez', fecha_hora: '2026-06-16T10:00:00Z', devuelto: false },
          { id: 2, articulo_nombre: 'Arnés de Seguridad Altura', tipo_movimiento: 'SALIDA', cantidad: 1, trabajador_nombre: 'Miguel Ángel', fecha_hora: '2026-06-15T14:30:00Z', devuelto: true },
          { id: 3, articulo_nombre: 'Taladro Percutor 18V', tipo_movimiento: 'SALIDA', cantidad: 1, trabajador_nombre: 'Romina Silva', fecha_hora: '2026-06-16T11:00:00Z', devuelto: false }
        ]);
        setCargando(false);
      });
  }, []);

  // =========================================================================
  // 📥 LÓGICA DE EXPORTACIÓN A EXCEL (CSV COMPATIBLE)
  // =========================================================================
  const exportarReporteExcel = () => {
    if (movimientos.length === 0) {
      Swal.fire('⚠️ Sin registros', 'No hay datos en la bitácora para poder exportar.', 'info');
      return;
    }

    // 1. Definimos los títulos de las columnas de la planilla
    const encabezados = ['ID Movimiento', 'Fecha y Hora', 'Artículo / Insumo', 'Tipo de Movimiento', 'Cantidad', 'Operario / Trabajador', 'Estado Retornable'];

    // 2. Mapeamos cada registro a una fila de Excel limpiando los campos
    const filas = movimientos.map(m => [
      m.id,
      m.fecha_hora ? new Date(m.fecha_hora).toLocaleString() : 'No registrada',
      m.articulo_nombre || `ID Artículo: ${m.articulo}`,
      m.tipo_movimiento,
      m.cantidad,
      m.trabajador_nombre || `ID Trabajador: ${m.trabajador}`,
      m.tipo_movimiento === 'SALIDA' ? (m.devuelto ? 'Devuelto y Recibido' : 'Pendiente de Entrega') : 'N/A'
    ]);

    // 3. Unimos todo usando punto y coma (separador por defecto de Excel en español) y comillas de seguridad
    const contenidoCSV = [
      encabezados.join(';'),
      ...filas.map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    // 4. Creamos el archivo binario (Blob) con la firma '\uFEFF' (BOM UTF-8) para que reconozca tildes y la Ñ
    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const urlDescarga = URL.createObjectURL(blob);
    
    // 5. Creamos un enlace invisible en el navegador para forzar la descarga de la planilla
    const enlace = document.createElement('a');
    const fechaHoy = new Date().toISOString().split('T')[0];
    enlace.setAttribute('href', urlDescarga);
    enlace.setAttribute('download', `Reporte_Movimientos_Promet_${fechaHoy}.csv`);
    enlace.style.visibility = 'hidden';
    
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    Swal.fire('📥 Exportación Exitosa', 'La planilla de movimientos se descargó correctamente.', 'success');
  };

  const handleProcesarDevolucion = (id) => {
    Swal.fire({
      title: '¿Confirmar Devolución?',
      text: '¿Esta herramienta retornable está ingresando de vuelta al pañol?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, recibir en Bodega',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/movimientos/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ devuelto: true })
        })
        .then(response => {
          if (response.ok) {
            Swal.fire('✅ Recibido', 'Devolución registrada con éxito. Stock restaurado.', 'success');
            setMovimientos(prev => prev.map(mov => mov.id === id ? { ...mov, devuelto: true } : mov));
          } else {
            Swal.fire('❌ Error', 'No se pudo guardar en el servidor.', 'error');
          }
        })
        .catch(() => {
          Swal.fire('⚠️ Modo Local', 'Devolución simulada con éxito.', 'warning');
          setMovimientos(prev => prev.map(mov => mov.id === id ? { ...mov, devuelto: true } : mov));
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Historial de Consumos y Movimientos</h2>
          <p className="text-slate-500 mt-1">Bitácora general de entradas, salidas y devoluciones de herramientas en faena.</p>
        </div>
        
        {/* 🛠️ BOTÓN DE EXPORTACIÓN A EXCEL */}
        <button
          onClick={exportarReporteExcel}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-semibold text-sm"
        >
          <FileSpreadsheet size={18} />
          Exportar Reporte (Excel)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {cargando ? (
          <p className="p-6 text-center text-slate-500 animate-pulse">Cargando bitácora de movimientos...</p>
        ) : movimientos.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No se registran movimientos en el historial todavía.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Fecha / Hora</th>
                <th className="p-4 font-semibold">Artículo</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 text-center font-semibold">Cantidad</th>
                <th className="p-4 font-semibold">Operario</th>
                <th className="p-4 text-center font-semibold">Estado Retornable</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="p-4 text-slate-500">
                    {m.fecha_hora ? new Date(m.fecha_hora).toLocaleString() : 'Fecha no registrada'}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{m.articulo_nombre || `Artículo ID: ${m.articulo}`}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      m.tipo_movimiento === 'SALIDA' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>{m.tipo_movimiento}</span>
                  </td>
                  <td className="p-4 text-center font-bold">{m.cantidad}</td>
                  <td className="p-4">{m.trabajador_nombre || `Operario ID: ${m.trabajador}`}</td>
                  <td className="p-4 text-center">
                    {m.tipo_movimiento === 'SALIDA' ? (
                      m.devuelto ? (
                        <span className="text-green-600 font-semibold flex items-center justify-center gap-1">✔ Recibido</span>
                      ) : (
                        <button 
                          onClick={() => handleProcesarDevolucion(m.id)}
                          className="px-3 py-1 bg-amber-500 text-slate-900 rounded text-xs font-bold hover:bg-amber-600 transition shadow-sm"
                        >
                          🔄 Pendiente (Recibir)
                        </button>
                      )
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
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