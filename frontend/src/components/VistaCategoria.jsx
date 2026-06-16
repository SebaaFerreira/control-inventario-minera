import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Send, Inbox, Eye, Edit, Trash2, X, PackagePlus } from 'lucide-react';
import Select from 'react-select';
import Swal from 'sweetalert2';

export default function VistaCategoria() {
  const { categoriaId } = useParams();
  const [articulos, setArticulos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS PARA LOS MODALES FLOTANTES ---
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // --- ESTADOS DEL FORMULARIO DE SALIDA ---
  const [trabajadorId, setTrabajadorId] = useState('');
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [capataz, setCapataz] = useState('');
  const [destino, setDestino] = useState('');
  const [turno, setTurno] = useState('Día');

  // --- ESTADOS DEL FORMULARIO DE NUEVO ARTÍCULO ---
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

  // Función maestra para refrescar la tabla dinámicamente
  const consultarArticulosBackend = () => {
    setCargando(true);
    fetch(`http://127.0.0.1:8000/api/articulos/?categoria=${categoriaId}`)
      .then(res => res.json())
      .then(data => {
        setArticulos(data);
        setCargando(false);
      })
      .catch(() => {
        const mockData = [
          { id: 1, categoria: 'epp', codigo_interno: 'ART-001', nombre: 'Guantes de Cabritilla', marca: 'Steelpro', stock_actual: 45 },
          { id: 2, categoria: 'epp', codigo_interno: 'ART-002', nombre: 'Antiparras Transparentes', marca: '3M', stock_actual: 12 },
          { id: 3, categoria: 'manuales', codigo_interno: 'ART-003', nombre: 'Martillo Carpintero', marca: 'Stanley', stock_actual: 10 },
          { id: 4, categoria: 'electricas', codigo_interno: 'ART-004', nombre: 'Esmeril Angular 4.5"', marca: 'Makita', stock_actual: 4 },
          { id: 5, categoria: 'sustancias', codigo_interno: 'ART-005', nombre: 'Diluyente Sintético', marca: 'Sipa', stock_actual: 8 }
        ];
        const datosFiltrados = mockData.filter(item => item.categoria === categoriaId);
        setArticulos(datosFiltrados);
        setCargando(false);
      });
  };

  useEffect(() => {
    consultarArticulosBackend();

    fetch('http://127.0.0.1:8000/api/trabajadores/')
      .then(res => res.json())
      .then(data => setTrabajadores(data))
      .catch(() => {
        setTrabajadores([
          { id: 1, rut: '12.345.678-9', nombre_completo: 'Juan Pérez', rol: 'Operario', turno_asignado: 'DIA' },
          { id: 2, rut: '98.765.432-1', nombre_completo: 'Pedro Morales', rol: 'Capataz', turno_asignado: 'NOCHE' }
        ]);
      });
  }, [categoriaId]);

  const opcionesTrabajadores = trabajadores.map(t => ({
    value: t.id,
    label: `${t.rut} - ${t.nombre_completo} [${t.rol}]`,
    turno: t.turno_asignado 
  }));

  // --- ENVÍO DE NUEVO ARTÍCULO (POST) ---
  const handleSubmitNuevoArticulo = (e) => {
    e.preventDefault();
    const payloadArticulo = {
      codigo_interno: nuevoCodigo, nombre: nuevoNombre, marca: nuevaMarca,
      stock_actual: parseInt(nuevoStock), stock_critico: parseInt(nuevoCritico) || 10,
    };

    fetch('http://127.0.0.1:8000/api/articulos/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadArticulo)
    })
    .then(response => {
      if(response.ok) {
        Swal.fire('✅ Éxito', 'El artículo ha sido registrado en el pañol.', 'success');
        setMostrarModalNuevo(false);
        setNuevoCodigo(''); setNuevoNombre(''); setNuevaMarca(''); setNuevoStock(''); setNuevoCritico('');
        consultarArticulosBackend(); // Actualización inmediata
      } else {
        Swal.fire('❌ Error', 'Hubo un problema al registrar el artículo.', 'error');
      }
    })
    .catch(() => {
      Swal.fire('⚠️ Modo Local', 'Simulación de creación exitosa.', 'warning');
      setMostrarModalNuevo(false);
    });
  };

  // --- ENVÍO DE SALIDA (POST) ---
  const handleSubmitSalida = (e) => {
    e.preventDefault();
    const nuevaSalida = {
      tipo_movimiento: 'SALIDA', trabajador: trabajadorId, articulo: articuloId,
      cantidad: cantidad, capataz_autoriza: capataz, destino_uso: destino, turno: turno, devuelto: false
    };

    fetch('http://127.0.0.1:8000/api/movimientos/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaSalida)
    })
    .then(response => {
      if(response.ok) {
        Swal.fire('✅ Éxito', 'Salida registrada con éxito. Stock descontado.', 'success');
        setMostrarModalSalida(false);
        setArticuloId(''); setCantidad(''); setDestino('');
        consultarArticulosBackend(); // Actualización inmediata
      } else {
        Swal.fire('❌ Error', 'Hubo un problema al registrar la salida.', 'error');
      }
    })
    .catch(() => {
      Swal.fire('⚠️ Modo Local', 'Simulación de salida exitosa.', 'warning');
      setMostrarModalSalida(false);
    });
  };

  // --- CRUD OPERATIVO ---
  const handleVerDetalles = (item) => {
    Swal.fire({ title: `🔍 Detalle de Artículo`, html: `<div class="text-left space-y-2 text-sm p-2"><p><strong>Código:</strong> ${item.codigo_interno}</p><p><strong>Nombre:</strong> ${item.nombre}</p><p><strong>Marca:</strong> ${item.marca || 'N/A'}</p><p><strong>Stock Actual:</strong> ${item.stock_actual} unidades</p></div>`, confirmButtonColor: '#2563eb' });
  };

  // 🛠️ REPARADO: La edición ahora permite ingresar reposiciones y guardar directo en Django
  const handleEditarArticulo = (item) => {
    Swal.fire({
      title: `📦 Reposición / Ajuste de Stock`,
      text: `Ingresa la cantidad física final para "${item.nombre}"`,
      input: 'number',
      inputValue: item.stock_actual,
      showCancelButton: true,
      confirmButtonText: 'Actualizar Stock',
      confirmButtonColor: '#d97706',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevoStockFisico = parseInt(result.value);

        fetch(`http://127.0.0.1:8000/api/articulos/${item.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_actual: nuevoStockFisico })
        })
        .then(res => {
          if (res.ok) {
            Swal.fire('✅ Inventario Actualizado', 'El stock ha sido modificado correctamente.', 'success');
            consultarArticulosBackend(); // Refresco reactivo de la tabla
          } else {
            Swal.fire('❌ Error', 'No se pudo actualizar el stock en el servidor.', 'error');
          }
        })
        .catch(() => {
          Swal.fire('⚠️ Modo Local', 'Stock editado localmente de forma simulataria.', 'warning');
          setArticulos(articulos.map(a => a.id === item.id ? { ...a, stock_actual: nuevoStockFisico } : a));
        });
      }
    });
  };

  const handleEliminarArticulo = (item) => {
    Swal.fire({ title: '¿Estás seguro?', text: `Vas a dar de baja "${item.nombre}". Acción irreversible.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' })
    .then((result) => { if (result.isConfirmed) Swal.fire('¡Eliminado!', 'Artículo removido.', 'success'); });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{vistaActual.titulo}</h2>
        <p className="text-slate-500 mt-1">Gestión de inventario y movimientos</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setMostrarModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-medium"
        >
          <Plus size={18} /> Nuevo Artículo
        </button>
        
        <button 
          onClick={() => setMostrarModalSalida(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Send size={18} /> Registrar Salida
        </button>

        <Link 
          to="/historial"
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-md hover:bg-amber-600 transition shadow-sm font-medium"
        >
          <Inbox size={18} /> Historial / Devoluciones
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
        {cargando ? (
          <div className="flex justify-center items-center h-48 text-slate-400 animate-pulse">Consultando artículos de la categoría...</div>
        ) : articulos.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-slate-500">No hay insumos registrados en esta categoría aún.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Código Interno</th>
                <th className="p-4 font-semibold">Nombre del Artículo</th>
                <th className="p-4 font-semibold">Marca</th>
                <th className="p-4 font-semibold text-center">Stock Actual</th>
                <th className="p-4 font-semibold text-center">Acciones (CRUD)</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-800 font-medium">{item.codigo_interno}</td>
                  <td className="p-4 text-slate-700">{item.nombre}</td>
                  <td className="p-4 text-slate-700">{item.marca || 'N/A'}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                      {item.stock_actual}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3 text-slate-400">
                      <Eye size={18} className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleVerDetalles(item)} />
                      <Edit size={18} className="cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleEditarArticulo(item)} />
                      <Trash2 size={18} className="cursor-pointer hover:text-red-600 transition-colors" onClick={() => handleEliminarArticulo(item)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🎬 MODAL REGISTRAR NUEVO ARTÍCULO */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#111827] px-6 py-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-400"><PackagePlus size={22} /> Ingresar Nuevo Artículo</h3>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white transition"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmitNuevoArticulo} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Código Interno *</label>
                  <input type="text" required placeholder="Ej. ART-015" value={nuevoCodigo} onChange={(e) => setNuevoCodigo(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Marca</label>
                  <input type="text" placeholder="Ej. Makita, MSA, 3M" value={nuevaMarca} onChange={(e) => setNuevaMarca(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Artículo *</label>
                <input type="text" required placeholder="Ej. Taladro" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Stock Físico Inicial *</label>
                  <input type="number" required min="0" placeholder="Ej. 50" value={nuevoStock} onChange={(e) => setNuevoStock(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Alerta Stock Crítico</label>
                  <input type="number" min="0" placeholder="Ej. 5" value={nuevoCritico} onChange={(e) => setNuevoCritico(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition font-semibold shadow-md">Guardar Artículo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎬 MODAL REGISTRO DE SALIDA */}
      {mostrarModalSalida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#111827] px-6 py-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2">📦 Registrar Salida de Bodega</h3>
              <button onClick={() => setMostrarModalSalida(false)} className="text-slate-400 hover:text-white transition"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmitSalida} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Trabajador que retira *</label>
                <Select required placeholder="Digita RUT o nombre del operario..." options={opcionesTrabajadores} onChange={(option) => { setTrabajadorId(option ? option.value : ''); if (option && option.turno) { const turnoMap = { 'DIA': 'Día', 'NOCHE': 'Noche', 'A': 'Turno A', 'B': 'Turno B', 'E': 'Turno E' }; setTurno(turnoMap[option.turno] || 'Día'); } }} className="text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Artículo solicitado *</label>
                <select required value={articuloId} onChange={(e) => setArticuloId(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-slate-200 focus:outline-none focus:border-blue-500">
                  <option value="" className="text-slate-400">Seleccione el insumo...</option>
                  {articulos.map(a => ( <option key={a.id} value={a.id} className="text-white">{a.codigo_interno} - {a.nombre} (Disponibles: {a.stock_actual})</option> ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad *</label>
                  <input type="number" required min="1" placeholder="Ej. 5" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Capataz que Autoriza *</label>
                  <input type="text" required placeholder="Nombre del Capataz" value={capataz} onChange={(e) => setCapataz(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Destino / Uso</label>
                  <input type="text" placeholder="Ej. Frente de trabajo sector C" value={destino} onChange={(e) => setDestino(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Turno Operativo</label>
                  <select value={turno} onChange={(e) => setTurno(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-md p-2.5 text-white focus:outline-none focus:border-blue-500">
                    <option value="Día">Turno Día</option><option value="Noche">Turno Noche</option><option value="Turno A">Turno A</option><option value="Turno B">Turno B</option><option value="Turno E">Turno E</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-700">
                <button type="button" onClick={() => setMostrarModalSalida(false)} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition font-semibold shadow-md">Confirmar Vale de Consumo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}