import Swal from 'sweetalert2';
import { requestJson } from './api';

export function verArticulo(item) {
  return Swal.fire({ title: 'Detalle de Artículo', text: `${item.codigo_interno} — ${item.nombre}\nMarca: ${item.marca || 'N/A'}\nStock: ${item.stock_actual} ${item.unidad_medida}\nEstado: ${item.estado}\nControl: ${item.tipo_control}`, confirmButtonColor: '#2563eb' });
}

export async function editarArticulo(item, recargar) {
  const campo = await Swal.fire({
    title: 'Editar artículo', input: 'select',
    inputOptions: { stock_actual: 'Stock físico (registra entrada/baja)', nombre: 'Nombre', codigo_interno: 'Código interno', marca: 'Marca', stock_critico: 'Stock crítico', unidad_medida: 'Unidad de medida', factor_conversion: 'Factor de conversión' },
    showCancelButton: true, confirmButtonText: 'Continuar', confirmButtonColor: '#d97706',
  });
  if (!campo.isConfirmed) return;
  const numerico = ['stock_actual', 'stock_critico', 'factor_conversion'].includes(campo.value);
  await Swal.fire({
    title: 'Editar artículo', text: `Nuevo valor para ${campo.value.replaceAll('_', ' ')} de ${item.nombre}`,
    input: numerico ? 'number' : 'text', inputValue: item[campo.value] ?? '',
    inputAttributes: numerico ? { min: '0', step: campo.value === 'factor_conversion' ? '0.0001' : '0.01' } : {},
    showCancelButton: true, confirmButtonText: 'Guardar', confirmButtonColor: '#d97706',
    showLoaderOnConfirm: true, allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async (value) => {
      try {
        await requestJson(`/articulos/${item.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [campo.value]: value }) });
        await recargar();
        return true;
      } catch (error) { Swal.showValidationMessage(error.message); return false; }
    },
  });
}

export async function eliminarArticulo(item, recargar) {
  const resultado = await Swal.fire({
    title: '¿Eliminar artículo?', text: `Eliminar ${item.nombre}. Los artículos con historial se conservan; puede cambiar su estado a BAJA.`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonText: 'Cancelar',
    showLoaderOnConfirm: true, allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async () => {
      try {
        await requestJson(`/articulos/${item.id}/`, { method: 'DELETE' });
        return true;
      } catch (error) { Swal.showValidationMessage(error.message); return false; }
    },
  });
  if (resultado.isConfirmed) { await recargar(); await Swal.fire('Eliminado', 'Artículo eliminado correctamente.', 'success'); }
}
