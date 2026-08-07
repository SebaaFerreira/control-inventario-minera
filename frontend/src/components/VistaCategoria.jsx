import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Send, Eye, Edit, Trash2, X, PackagePlus, Barcode, Wrench } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';

export default function VistaCategoria() {
  const { categoriaId } = useParams();
  const [articulos, setArticulos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para abrir/cerrar los modales
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // Estados del formulario de Salida
  const [trabajadorId, setTrabajadorId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [capataz, setCapataz] = useState('');
  const [destino, setDestino] = useState('');
  const [turno, setTurno] = useState('Día');
  const [codigoEscaneado, setCodigoEscaneado] = useState('');

  // Estados del formulario de Nuevo Artículo
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevoStock, setNuevoStock] = useState('');
  const [nuevoCritico, setNuevoCritico] = useState('');

  const configuracionVistas = {
    epp: { titulo: 'Elementos de Protección Personal (EPP)', retornable: false },
    fijaciones: { titulo: 'Fijaciones y Sujeciones', retornable: false },
    tuberias: { titulo: 'Tuberías y Fitting', retornable: false },
    sustancias: { titulo: 'Sustancias Peligrosas (HazMat)', retornable: false },
    manuales: { titulo: 'Herramientas Manuales', retornable: true },
    electricas: { titulo: 'Herramientas Eléctricas', retornable: true },
    leime: { titulo: 'Registro LEIME', retornable: true },
  };

  const vistaActual = configuracionVistas[categoriaId] || { titulo: 'Categoría no encontrada', retornable: false };

  const consultarArticulosBackend = () => {
    setCargando(true);
    fetch(`http://127.0.0.1:8000/api/articulos/?categoria=${categoriaId}`)
      .then(res => res.json())
      .then(data => {
        setArticulos(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  };

  useEffect(() => {
    consultarArticulosBackend();
    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(data => setTrabajadores(data))
      .catch(() => {});
  }, [categoriaId]);

  const opcionesTrabajadores = trabajadores.map(t => ({
    value: t.id, label: `${t.rut} - ${t.nombre_completo} [${t.rol}]`, turno: t.turno_asignado 
  }));

  // =========================================================================
  // 🔫 LÓGICA DEL ESCÁNER LÁSER
  // =========================================================================
  const handleEscanearCodigo = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const articuloEncontrado = articulos.find(a => a.codigo_interno.toUpperCase() === codigoEscaneado.trim().toUpperCase());
      
      if (articuloEncontrado) {
        if (articuloEncontrado.estado === 'MANTENIMIENTO' || articuloEncontrado.estado === 'BAJA') {
          Swal.fire({ icon: 'error', title: '⛔ Herramienta Bloqueada', text: `Esta herramienta está en estado "${articuloEncontrado.estado}".`, confirmButtonColor: '#ef4444' });
          setCodigoEscaneado('');
          return;
        }
        setArticuloId(articuloEncontrado.id);
        setCodigoEscaneado('');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `¡${articuloEncontrado.nombre} detectado!`, showConfirmButton: false, timer: 1500 });
      } else {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Código no reconocido', showConfirmButton: false, timer: 2000 });
        setCodigoEscaneado('');
      }
    }
  };

  // =========================================================================
  // 💾 GUARDAR NUEVO ARTÍCULO
  // =========================================================================
  const handleSubmitNuevoArticulo = (e) => {
    e.preventDefault();
    const payloadArticulo = { 
      codigo_interno: nuevoCodigo, 
      nombre: nuevoNombre, 
      marca: nuevaMarca, 
      stock_actual: parseInt(nuevoStock), 
      stock_critico: parseInt(nuevoCritico) || 10, 
      estado: 'OPERATIVO', 
      categoria: categoriaId // Se asigna automáticamente a la vista actual
    };
    
    fetch('http://127.0.0.1:8000/api/articulos/', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payloadArticulo) 
    })
    .then(res => { 
      if(res.ok) { 
        Swal.fire('✅ Éxito', 'Artículo registrado en bodega.', 'success'); 
        setMostrarModalNuevo(false); 
        consultarArticulosBackend(); 
        setNuevoCodigo(''); setNuevoNombre(''); setNuevaMarca(''); setNuevoStock('');
      } 
    })
    .catch(() => {
      Swal.fire('❌ Error', 'No se pudo conectar con el servidor.', 'error');
    });
  };

  // =========================================================================
  // 📦 REGISTRAR SALIDA A TERRENO
  // =========================================================================
  const handleSubmitSalida = (e) => {
    e.preventDefault();
    if (!articuloId) return Swal.fire('⚠️ Cuidado', 'Debes escanear o seleccionar un artículo primero.', 'warning');
    
    const nuevaSalida = { 
      tipo_movimiento: 'SALIDA', 
      trabajador: trabajadorId, 
      articulo: articuloId, 
      cantidad: cantidad, 
      capataz_autoriza: capataz, 
      destino_uso: destino, 
      turno: turno, 
      estado_prestamo: vistaActual.retornable ? 'PENDIENTE' : 'N/A' 
    };
    
    fetch('http://127.0.0.1:8000/api/movimientos/', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(nuevaSalida) 
    })
    .then(res => { 
      if(res.ok) { 
        Swal.fire('✅ Éxito', 'Salida registrada. El stock ha sido descontado.', 'success'); 
        setMostrarModalSalida(false); 
        consultarArticulosBackend(); 
      } 
    })
    .catch(() => setMostrarModalSalida(false));
  };

  // =========================================================================
  // 🛠️ MÓDULO DE MANTENIMIENTO
  // =========================================================================
  const handleCambiarEstado = (item) => {
    Swal.fire({
      title: `Estado Técnico`, html: `Modificando disponibilidad de: <b>${item.nombre}</b>`, input: 'select',
      inputOptions: { 'OPERATIVO': '🟢 Operativo (Disponible)', 'MANTENIMIENTO': '🟠 En Mantenimiento (Taller)', 'BAJA': '🔴 Dado de Baja' },
      inputValue: item.estado || 'OPERATIVO', showCancelButton: true, confirmButtonText: 'Actualizar Estado', confirmButtonColor: '#2563eb'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/articulos/${item.id}/`, { 
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: result.value }) 
        })
        .then(() => { Swal.fire('✅ Actualizado', `El equipo ahora figura como ${result.value}.`, 'success'); consultarArticulosBackend(); });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{vistaActual.titulo}</h2>
        <p className="text-slate-500 mt-1">Gestión de inventarios y mantenimientos.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => setMostrarModalNuevo(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition font-medium"><Plus size={18} /> Nuevo Artículo</button>
        <button onClick={() => setMostrarModalSalida(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"><Send size={18} /> Oficina de Registro Salida</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {cargando ? (
          <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse">Consultando base de datos...</div>
        ) : articulos.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-slate-500">No hay insumos registrados.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Nombre del Artículo</th>
                <th className="p-4 font-semibold">Marca</th>
                <th className="p-4 font-semibold text-center">Existencias</th>
                <th className="p-4 font-semibold text-center">Estado Técnico</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-mono font-medium">{item.codigo_interno}</td>
                  <td className="p-4 text-slate-700">{item.nombre}</td>
                  <td className="p-4 text-slate-700">{item.marca || 'N/A'}</td>
                  <td className="p-4 text-center"><span className="px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">{item.stock_actual}</span></td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded text-xs font-bold tracking-wide ${item.estado === 'MANTENIMIENTO' ? 'bg-amber-100 text-amber-700 border border-amber-200' : item.estado === 'BAJA' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      {item.estado || 'OPERATIVO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-3 text-slate-400">
                      <Eye size={18} className="cursor-pointer hover:text-blue-600" />
                      <Edit size={18} className="cursor-pointer hover:text-amber-500" />
                      <Wrench size={18} className="cursor-pointer hover:text-indigo-600" title="Cambiar Estado Técnico" onClick={() => handleCambiarEstado(item)} />
                      <Trash2 size={18} className="cursor-pointer hover:text-red-600" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================= */}
      {/* 🎬 MODAL 1: NUEVO ARTÍCULO */}
      {/* ========================================================= */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center bg-[#111827] px-6 py-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400"><PackagePlus size={22} /> Ingresar Nuevo Artículo</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmitNuevoArticulo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-slate-300">Código Interno / Barra *</label>
                  <input type="text" required value={nuevoCodigo} onChange={e => setNuevoCodigo(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300">Nombre del Artículo *</label>
                  <input type="text" required value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300">Marca</label>
                  <input type="text" value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300">Stock Inicial (Unidades) *</label>
                  <input type="number" required min="0" value={nuevoStock} onChange={e => setNuevoStock(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-4 py-2 bg-slate-600 rounded text-white hover:bg-slate-500 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 rounded text-white font-bold hover:bg-emerald-500 transition shadow-md">Guardar en Inventario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🎬 MODAL 2: REGISTRAR SALIDA */}
      {/* ========================================================= */}
      {mostrarModalSalida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center bg-[#111827] px-6 py-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2 text-blue-400"><Send size={22} /> Registrar Salida</h3>
              <button onClick={() => setMostrarModalSalida(false)} className="text-slate-400 hover:text-white"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmitSalida} className="p-6 space-y-5">
              
              {/* Lector Láser */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 flex items-center gap-4">
                <div className="p-3 bg-[#0f172a] rounded-lg border border-blue-500/30">
                  <Barcode className="text-blue-400 animate-pulse" size={28} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-blue-400 uppercase mb-1">Escanear Código (Láser)</label>
                  <input type="text" autoFocus value={codigoEscaneado} onChange={(e) => setCodigoEscaneado(e.target.value)} onKeyDown={handleEscanearCodigo} className="w-full bg-transparent text-white font-mono text-lg border-b border-slate-500 focus:border-blue-400 focus:outline-none py-1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Trabajador que retira *</label>
                <Select required options={opcionesTrabajadores} onChange={(o) => setTrabajadorId(o ? o.value : '')} placeholder="Buscar operario por nombre o RUT..." className="text-slate-900" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Artículo (Solo Herramientas Operativas) *</label>
                <select required value={articuloId} onChange={(e) => setArticuloId(e.target.value)} className={`w-full bg-[#0f172a] border rounded-md p-2.5 text-white focus:outline-none ${articuloId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-600'}`}>
                  <option value="" className="text-slate-400">Seleccione el insumo manualmente...</option>
                  {articulos
                    .filter(a => a.estado === 'OPERATIVO' || !a.estado)
                    .map(a => ( 
                      <option key={a.id} value={a.id}>{a.codigo_interno} - {a.nombre} (Stock: {a.stock_actual})</option> 
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad a Entregar *</label>
                  <input type="number" required min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Jefatura / Capataz Autoriza *</label>
                  <input type="text" required value={capataz} onChange={(e) => setCapataz(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setMostrarModalSalida(false)} className="px-4 py-2 bg-slate-600 text-white rounded font-medium hover:bg-slate-500 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-semibold shadow-md hover:bg-blue-500 transition">Confirmar Vale Salida</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}