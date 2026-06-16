import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock, ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalArticulos: 0,
    stockCritico: 0,
    pendientesDevolucion: 0,
    movimientosHoy: 0
  });
  const [movimientosRecientes, setMovimientosRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Usamos Promise.all para hacer las dos consultas a Django al mismo tiempo
    Promise.all([
      fetch('http://127.0.0.1:8000/api/articulos/').then(res => res.ok ? res.json() : []),
      fetch('http://127.0.0.1:8000/api/movimientos/').then(res => res.ok ? res.json() : [])
    ])
    .then(([articulos, movimientos]) => {
      calcularEstadisticas(articulos, movimientos);
      setCargando(false);
    })
    .catch(() => {
      // Mock de respaldo por si Django está apagado
      const mockArticulos = [
        { stock_actual: 5, stock_critico: 10 },
        { stock_actual: 50, stock_critico: 10 },
        { stock_actual: 2, stock_critico: 5 },
      ];
      // Simulamos la fecha de hoy
      const hoyISO = new Date().toISOString(); 
      const mockMovimientos = [
        { id: 1, articulo_nombre: 'Taladro Percutor 18V', tipo_movimiento: 'SALIDA', devuelto: false, fecha_hora: hoyISO, trabajador_nombre: 'Miguel' },
        { id: 2, articulo_nombre: 'Esmeril Angular 4.5"', tipo_movimiento: 'SALIDA', devuelto: true, fecha_hora: hoyISO, trabajador_nombre: 'Romina' },
        { id: 3, articulo_nombre: 'Guantes de Cabritilla', tipo_movimiento: 'SALIDA', devuelto: false, fecha_hora: new Date(Date.now() - 86400000).toISOString(), trabajador_nombre: 'Pedro' }
      ];
      calcularEstadisticas(mockArticulos, mockMovimientos);
      setCargando(false);
    });
  }, []);

  const calcularEstadisticas = (articulos, movimientos) => {
    // 1. Total de Artículos en catálogo
    const totalArticulos = articulos.length;
    
    // 2. Stock Crítico: Cantidad actual <= Cantidad crítica (o 10 por defecto)
    const stockCritico = articulos.filter(a => a.stock_actual <= (a.stock_critico || 10)).length;
    
    // 3. Herramientas prestadas que no han sido devueltas
    const pendientesDevolucion = movimientos.filter(m => m.tipo_movimiento === 'SALIDA' && m.devuelto === false).length;
    
    // 4. Movimientos realizados en el día actual
    const hoyStr = new Date().toLocaleDateString();
    const movimientosHoy = movimientos.filter(m => {
      const fechaMov = new Date(m.fecha_hora).toLocaleDateString();
      return fechaMov === hoyStr;
    }).length;

    setStats({ totalArticulos, stockCritico, pendientesDevolucion, movimientosHoy });
    
    // Extraemos los últimos 5 movimientos para la tabla resumen
    setMovimientosRecientes(movimientos.slice(0, 5));
  };

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