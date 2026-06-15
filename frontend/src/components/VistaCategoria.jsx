import { useParams } from 'react-router-dom';
import { Plus, Send, Inbox, Eye, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function VistaCategoria() {
  const { categoriaId } = useParams();

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

  const articulosMock = [
    { id: 1, codigo_interno: 'ART-001', nombre: 'Guantes de Cabritilla', marca: 'Steelpro', stock_actual: 45 },
    { id: 2, codigo_interno: 'ART-002', nombre: 'Antiparras Transparentes', marca: '3M', stock_actual: 12 },
  ];

  // --- FUNCIONES DE SWEETALERT2 ---

  // 1. Modal para Eliminar un Artículo (Confirmación de Seguridad)
  const handleEliminarArticulo = (articulo) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar "${articulo.nombre}" del catálogo. Esto no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí conectaremos con la API para borrar en Django en el futuro
        Swal.fire(
          '¡Eliminado!',
          'El artículo ha sido borrado del catálogo.',
          'success'
        );
      }
    });
  };

  // 2. Modal para Agregar Nuevo Artículo
  const handleNuevoArticulo = () => {
    Swal.fire({
      title: `Nuevo Artículo - ${vistaActual.titulo}`,
      html: `
        <div class="text-left">
          <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Código Interno</label>
          <input id="swal-codigo" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ej. EPP-005">
          
          <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Nombre del Artículo</label>
          <input id="swal-nombre" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ej. Casco de Seguridad">
          
          <label class="block text-sm font-medium text-gray-700 mb-1 mt-3">Marca</label>
          <input id="swal-marca" class="w-full border border-gray-300 rounded px-3 py-2" placeholder="Ej. MSA">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Artículo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981', // Verde esmeralda para crear
      preConfirm: () => {
        // Capturamos los datos ingresados en el modal
        const codigo = document.getElementById('swal-codigo').value;
        const nombre = document.getElementById('swal-nombre').value;
        const marca = document.getElementById('swal-marca').value;

        if (!codigo || !nombre) {
          Swal.showValidationMessage('El Código y el Nombre son obligatorios');
          return false;
        }

        return { codigo, nombre, marca };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí enviaremos el POST a Django más adelante
        console.log("Datos a enviar a Django:", result.value);
        Swal.fire({
          icon: 'success',
          title: 'Artículo Creado',
          text: `El artículo ${result.value.nombre} se guardó con éxito.`
        });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">{vistaActual.titulo}</h2>
        <p className="text-slate-500 mt-1">Gestión de inventario y movimientos</p>
      </div>

      <div className="flex gap-4 mb-6">
        {/* Conectamos el botón Nuevo Artículo al SweetAlert */}
        <button 
          onClick={handleNuevoArticulo}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition shadow-sm font-medium"
        >
          <Plus size={18} />
          Nuevo Artículo
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium">
          <Send size={18} />
          Registrar Salida
        </button>

        {vistaActual.retornable && (
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-md hover:bg-amber-600 transition shadow-sm font-medium">
            <Inbox size={18} />
            Registrar Devolución
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
            {articulosMock.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="p-4 text-slate-800 font-medium">{item.codigo_interno}</td>
                <td className="p-4 text-slate-700">{item.nombre}</td>
                <td className="p-4 text-slate-700">{item.marca}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    item.stock_actual > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.stock_actual}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-3">
                    <button className="text-slate-400 hover:text-blue-600 transition" title="Ver Detalles">
                      <Eye size={20} />
                    </button>
                    <button className="text-slate-400 hover:text-amber-500 transition" title="Editar Artículo">
                      <Edit size={20} />
                    </button>
                    {/* Conectamos el botón de Basurero al SweetAlert de eliminar */}
                    <button 
                      onClick={() => handleEliminarArticulo(item)}
                      className="text-slate-400 hover:text-red-600 transition" 
                      title="Eliminar Artículo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}