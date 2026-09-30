import Swal from 'sweetalert2';
import { requestJson } from './api';

export async function recibirDevolucion(movimiento, nombreArticulo, nombreTrabajador, recargar) {
  const resultado = await Swal.fire({
    title: '¿Confirmar Devolución?',
    text: `Recibir ${movimiento.cantidad} de ${nombreArticulo} entregado a ${nombreTrabajador}. Se devolverá la cantidad completa a la bodega.`,
    icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, recibir insumo', cancelButtonText: 'Cancelar', confirmButtonColor: '#d97706',
    showLoaderOnConfirm: true, allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async () => {
      try {
        await requestJson(`/movimientos/${movimiento.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_prestamo: 'DEVUELTO' }) });
        return true;
      } catch (error) { Swal.showValidationMessage(error.message); return false; }
    },
  });
  if (resultado.isConfirmed) { recargar(); await Swal.fire('Insumo Recibido', 'El stock volvió a la bodega.', 'success'); }
}
