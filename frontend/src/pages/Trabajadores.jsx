import { useState, useEffect } from 'react';
import { Plus, UserPlus, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  // Campos formulario nuevo trabajador
  const [rut, setRut] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('');
  const [turno, setTurno] = useState('DIA');

  const cargarTrabajadores = () => {
    setCargando(true);
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(data => {
        setTrabajadores(data);
        setCargando(false);
      })
      .catch(() => {
        // Resguardo local si el backend no responde
        setTrabajadores([
          { id: 1, rut: '12.345.678-9', nombre_completo: 'Juan Pérez', rol: 'Operario Rigger', turno_asignado: 'DIA' },
          { id: 2, rut: '98.765.432-1', nombre_completo: 'Pedro Morales', rol: 'Capataz de Obras', turno_asignado: 'NOCHE' },
          { id: 3, rut: '17.894.231-k', nombre_completo: 'Romina Silva', rol: 'Soldador Calificado', turno_asignado: 'A' }
        ]);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevoOperario = {
      rut,
      nombre_completo: nombre,
      rol,
      turno_asignado: turno
    };

    fetch('http://127.0.0.1:8000/api/trabajadores/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoOperario)
    })
    .then(res => {
      if (res.ok) {
        Swal.fire('✅ Éxito', 'Trabajador registrado en la base de datos.', 'success');
        setMostrarModal(false);
        setRut(''); setNombre(''); setRol(''); setTurno('DIA');
        cargarTrabajadores();
      } else {
        Swal.fire('❌ Error', 'No se pudo crear el registro.', 'error');
      }
    })
    .catch(() => {
      Swal.fire('⚠️ Modo Local', 'Operario agregado localmente.', 'warning');
      setTrabajadores([...trabajadores, { id: Date.now(), ...nuevoOperario }]);
      setMostrarModal(false);
      setRut(''); setNombre(''); setRol(''); setTurno('DIA');
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Control de Personal (Operarios)</h2>
          <p className="text-slate-500 mt-1">Registro oficial de personal autorizado para retirar insumos de bodega.</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-medium"
        >
          <Plus size={18} /> Nuevo Trabajador
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {cargando ? (
          <p className="p-6 text-center text-slate-400 animate-pulse">Consultando listado de personal...</p>
        ) : trabajadores.length === 0 ? (
          <p className="p-6 text-center text-slate-500">No hay operarios registrados en la base de datos.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold">
                <th className="p-4">RUT</th>
                <th className="p-4">Nombre Completo</th>
                <th className="p-4">Cargo / Rol</th>
                <th className="p-4 text-center">Turno Asignado</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
              {trabajadores.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono font-semibold text-slate-600">{t.rut}</td>
                  <td className="p-4 font-medium text-slate-900">{t.nombre_completo}</td>
                  <td className="p-4 text-slate-500">{t.rol}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {t.turno_asignado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🎬 MODAL FLOTANTE OSCURO: REGISTRAR OPERARIO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#111827] px-6 py-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                <UserPlus size={22} /> Registrar Nuevo Operario
              </h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white transition"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">RUT *</label>
                  <input type="text" required placeholder="Ej. 12.345.678-9" value={rut} onChange={(e) => setRut(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Turno Operativo *</label>
                  <select value={turno} onChange={(e) => setTurno(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500">
                    <option value="DIA">Turno Día</option>
                    <option value="NOCHE">Turno Noche</option>
                    <option value="A">Turno A</option>
                    <option value="B">Turno B</option>
                    <option value="E">Turno E</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo *</label>
                <input type="text" required placeholder="Ej. Juan Carlos Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cargo o Rol en Faena *</label>
                <input type="text" required placeholder="Ej. Soldador, Rigger, Capataz" value={rol} onChange={(e) => setRol(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition font-semibold shadow-md">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}