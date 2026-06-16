import { useState, useEffect } from 'react';
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
          { id: 3, articulo_nombre: 'Taladro Percutor 18V', tipo_movimiento: 'SALIDA', cantidad: 1, trabajador_nombre: 'Romina', fecha_hora: '2026-06-16T11:00:00Z', devuelto: false }
        ]);
        setCargando(false);
      });
  }, []);

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
        
        // 🛠️ AQUÍ ESTÁ LA MAGIA: Enviamos la actualización a Django
        fetch(`http://127.0.0.1:8000/api/movimientos/${id}/`, {
          method: 'PATCH', // Usamos PATCH porque solo actualizamos 1 campo (devuelto)
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ devuelto: true })
        })
        .then(response => {
          if (response.ok) {
            Swal.fire('✅ Recibido', 'Devolución registrada con éxito en la base de datos.', 'success');
            
            // 🔄 Actualizamos la tabla visualmente sin recargar la página
            setMovimientos(movimientosAnteriores => 
              movimientosAnteriores.map(mov => 
                mov.id === id ? { ...mov, devuelto: true } : mov
              )
            );
          } else {
            Swal.fire('❌ Error', 'No se pudo registrar la devolución en el servidor.', 'error');
          }
        })
        .catch(() => {
          // Si el servidor está apagado, simulamos el éxito visualmente para no trabar la maqueta
          Swal.fire('⚠️ Modo Local', 'Devolución simulada con éxito (Backend desconectado).', 'warning');
          setMovimientos(movimientosAnteriores => 
            movimientosAnteriores.map(mov => 
              mov.id === id ? { ...mov, devuelto: true } : mov
            )
          );
        });

      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Historial de Consumos y Movimientos</h2>
        <p className="text-slate-500 mt-1">Bitácora general de entradas, salidas y devoluciones de herramientas en faena.</p>
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
                <th className="p-4 font-semibold text-center">Cantidad</th>
                <th className="p-4 font-semibold">Operario</th>
                <th className="p-4 font-semibold text-center">Estado Retornable</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm">
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="p-4 text-slate-500">
                    {/* Verificamos si hay fecha real, si no, mostramos un texto por defecto */}
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
                        <span className="text-green-600 font-semibold flex items-center justify-center gap-1">
                          ✔ Recibido
                        </span>
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