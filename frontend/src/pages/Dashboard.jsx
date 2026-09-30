import { useRecords } from '../useRecords';
import { Package, AlertTriangle, Clock, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data, cargando } = useRecords('articulos', 'movimientos');
  const articulos = data?.[0] || [];
  const movimientos = data?.[1] || [];
  const hoy = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
  const stats = {
    totalArticulos: articulos.length,
    stockCritico: articulos.filter(a => Number(a.stock_actual) <= Number(a.stock_critico)).length,
    pendientesDevolucion: movimientos.filter(m => m.tipo_movimiento === 'SALIDA' && m.estado_prestamo === 'PENDIENTE').length,
    movimientosHoy: movimientos.filter(m => new Date(m.fecha_hora).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) === hoy).length,
  };
  const movimientosRecientes = movimientos.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Resumen Operativo</h2>
        <p className="text-slate-500 mt-1">Panel general de control de Bodega Promet.</p>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse font-medium">
          Calculando indicadores...
        </div>
      ) : (
        <>
          {/* ======================= TARJETAS DE KPIs ======================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* KPI 1: Artículos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Package size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Insumos</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.totalArticulos}</h3>
              </div>
            </div>

            {/* KPI 2: Stock Crítico */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Alertas de Stock</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.stockCritico}</h3>
              </div>
            </div>

            {/* KPI 3: Devoluciones Pendientes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Falta Devolver</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.pendientesDevolucion}</h3>
              </div>
            </div>

            {/* KPI 4: Movimientos Hoy */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <ArrowRightLeft size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Transacciones Hoy</p>
                <h3 className="text-2xl font-bold text-slate-800">{stats.movimientosHoy}</h3>
              </div>
            </div>

          </div>

          {/* ======================= TABLA DE ÚLTIMOS MOVIMIENTOS ======================= */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
              <Link to="/historial" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                Ver historial completo &rarr;
              </Link>
            </div>

            {movimientosRecientes.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No hay movimientos recientes.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Operario</th>
                    <th className="px-6 py-3 font-semibold">Artículo</th>
                    <th className="px-6 py-3 font-semibold text-center">Tipo</th>
                    <th className="px-6 py-3 font-semibold text-right">Fecha/Hora</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {movimientosRecientes.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium">{m.trabajador_nombre || `ID: ${m.trabajador}`}</td>
                      <td className="px-6 py-4">{m.articulo_nombre || `ID: ${m.articulo}`}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          m.tipo_movimiento === 'SALIDA' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {m.tipo_movimiento}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {m.fecha_hora ? new Date(m.fecha_hora).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
