import { Download, Upload, Database, Users, Package, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useRef } from 'react';

export default function Configuracion() {
  const fileInputRef = useRef(null);

  // Función mágica para convertir datos a CSV/Excel con codificación perfecta
  const descargarExcel = (datos, encabezados, mapeoFila, nombreArchivo) => {
    if (!datos || datos.length === 0) {
      Swal.fire('Sin datos', 'No hay registros para exportar.', 'info');
      return;
    }
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
    Swal.fire('✅ Exportación Exitosa', 'Planilla Excel descargada.', 'success');
  };

  const handleExportarTrabajadores = () => {
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(datos => {
        descargarExcel(
          datos,
          // 🛠️ ACÁ AGREGAMOS LA COLUMNA DE ESPECIALIDAD A LOS ENCABEZADOS
          ['ID', 'RUT', 'Nombre Completo', 'Nivel/Jerarquía', 'Especialidad', 'Turno', 'Estado'],
          // 🛠️ Y ACÁ MAPEAMOS EL DATO (Si viene vacío, ponemos 'N/A')
          (t) => [t.id, t.rut, t.nombre_completo, t.rol, t.especialidad || 'N/A', t.turno_asignado, t.activo ? 'Activo' : 'Inactivo'],
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

  // --- BOTONES DE SISTEMA AVANZADO (Backup JSON) ---
  const handleBackupSistema = () => window.open('http://127.0.0.1:8000/api/respaldos/exportar/', '_blank');
  
  const handleRestaurarSistema = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Swal.fire({
      title: '⚠️ ¿Sobrescribir Base de Datos?',
      text: 'Esto restaurará el sistema completo desde un archivo JSON.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626'
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
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Database className="text-slate-700" size={32} />
          Reportes y Configuración
        </h2>
        <p className="text-slate-500 mt-1">Descarga planillas independientes o gestiona el respaldo del sistema.</p>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">📥 Descargas Modulares (Excel)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        
        {/* Trabajadores Excel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><Users size={24} /></div>
            <h3 className="text-lg font-bold">Nómina de Trabajadores</h3>
          </div>
          <button onClick={handleExportarTrabajadores} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex justify-center gap-2">
            <Download size={18} /> Exportar Trabajadores (Excel)
          </button>
        </div>

        {/* Inventario Excel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg"><Package size={24} /></div>
            <h3 className="text-lg font-bold">Maestro de Inventario</h3>
          </div>
          <button onClick={handleExportarInventario} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex justify-center gap-2">
            <Download size={18} /> Exportar Inventario (Excel)
          </button>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2 text-red-700 flex items-center gap-2">
        <AlertTriangle size={24} /> Opciones Avanzadas de Sistema
      </h3>
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-slate-600 mb-3">Descarga una copia de seguridad técnica (formato JSON) con claves foráneas para migrar el sistema.</p>
          <button onClick={handleBackupSistema} className="w-full py-2 border-2 border-slate-400 text-slate-700 rounded hover:bg-slate-200 font-bold">Clonar DB (JSON)</button>
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-3">Restaura el sistema completo a un punto anterior usando un archivo JSON. Sobrescribirá todo.</p>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestaurarSistema} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="w-full py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Restaurar DB (JSON)</button>
        </div>
      </div>
    </div>
  );
}