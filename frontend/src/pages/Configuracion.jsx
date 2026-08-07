import { Download, Upload, Database, Users, Package, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRef } from 'react';

export default function Configuracion() {
  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);

  const descargarExcel = (datos, encabezados, mapeoFila, nombreArchivo) => {
    if (!datos || datos.length === 0) return Swal.fire('Sin datos', 'No hay registros para exportar.', 'info');
    const filas = datos.map(mapeoFila);
    const contenidoCSV = [
      encabezados.join(';'),
      ...filas.map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  const handleExportarTrabajadores = () => {
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(datos => {
        descargarExcel(
          datos,
          ['RUT', 'Nombre Completo', 'Nivel/Jerarquía', 'Cargo', 'Ciclo', 'Sistema', 'Habitación', 'Teléfono'],
          (t) => [t.rut, t.nombre_completo, t.rol, t.especialidad || 'N/A', t.turno_asignado, t.sistema_turno || 'N/A', t.habitacion || 'N/A', t.telefono || 'N/A'],
          'Reporte_Trabajadores'
        );
      });
  };

  const handleExportarInventario = () => {
    fetch('http://127.0.0.1:8000/api/articulos/')
      .then(res => res.json())
      .then(datos => {
        descargarExcel(
          datos,
          ['Código Interno', 'Nombre Artículo', 'Marca', 'Stock Actual', 'Estado Técnico', 'Tipo'],
          (a) => [a.codigo_interno, a.nombre, a.marca || 'N/A', a.stock_actual, a.estado, a.tipo_control],
          'Reporte_Inventario'
        );
      });
  };

  // ============================================================
  // 🟢 MEGA-IMPORTADOR INTELIGENTE (ACTUALIZADO CON LA RUTA NUEVA)
  // ============================================================
  const handleImportarTarja = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);

    Swal.fire({
      title: 'Procesando Planilla...',
      text: 'Analizando múltiples hojas y actualizando bases de datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 👇 LA RUTA NUEVA ESTÁ AQUÍ 👇
    fetch('http://127.0.0.1:8000/api/importar-tarja/', {
      method: 'POST',
      body: formData
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido del servidor');
      }
      return data;
    })
    .then(data => {
      Swal.fire({ 
        icon: 'success', 
        title: '¡Tarja Sincronizada!', 
        html: `<div class="text-lg font-bold text-emerald-700 mt-2">${data.mensaje}</div>`,
        confirmButtonColor: '#059669'
      });
      e.target.value = ''; 
    })
    .catch((err) => {
      Swal.fire({ icon: 'error', title: 'Error de Lectura', text: err.message });
      e.target.value = '';
    });
  };

  const handleBackupSistema = () => window.open('http://127.0.0.1:8000/api/respaldos/exportar/', '_blank');
  
  const handleRestaurarSistema = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Swal.fire({
      title: '⚠️ ¿Sobrescribir Base de Datos?', text: 'Esto restaurará el sistema completo.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626'
    }).then((result) => {
      if (result.isConfirmed) {
        const formData = new FormData();
        formData.append('archivo', file);
        fetch('http://127.0.0.1:8000/api/respaldos/importar/', { method: 'POST', body: formData })
        .then(() => Swal.fire('Éxito', 'Sistema restaurado.', 'success'));
      }
      e.target.value = '';
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Database className="text-slate-700" size={32} /> Reportes y Configuración</h2>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">📂 Carga Masiva de Datos</h3>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg"><FileSpreadsheet size={24} /></div>
          <div>
            <h3 className="text-lg font-bold">Importar Tarja de Personal (.xlsm / .xlsx)</h3>
            <p className="text-sm text-slate-500">Sube la planilla original de recursos humanos. El sistema detectará automáticamente los RUT, Cargos, Habitaciones y Turnos.</p>
          </div>
        </div>
        
        <input type="file" accept=".xlsx, .xls, .xlsm" ref={excelInputRef} onChange={handleImportarTarja} className="hidden" />
        <button onClick={() => excelInputRef.current.click()} className="mt-4 w-full py-3 bg-[#107c41] text-white rounded-lg font-bold hover:bg-[#0c5e31] transition shadow-sm flex justify-center items-center gap-2">
          <Upload size={20} /> Sincronizar Planilla de Trabajadores
        </button>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">📥 Descargas Modulares (Excel)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-blue-600" /> Nómina de Trabajadores</h3>
          <button onClick={handleExportarTrabajadores} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex justify-center gap-2"><Download size={18} /> Exportar Excel</button>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Package className="text-emerald-600" /> Maestro de Inventario</h3>
          <button onClick={handleExportarInventario} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex justify-center gap-2"><Download size={18} /> Exportar Excel</button>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2 text-red-700 flex items-center gap-2"><AlertTriangle size={24} /> Opciones Avanzadas (JSON)</h3>
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <button onClick={handleBackupSistema} className="w-full py-2 border-2 border-slate-400 text-slate-700 rounded hover:bg-slate-200 font-bold">Clonar DB (JSON)</button>
        </div>
        <div>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestaurarSistema} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="w-full py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Restaurar DB (JSON)</button>
        </div>
      </div>
    </div>
  );
}