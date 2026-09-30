const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const apiUrl = (path) => `${baseUrl}/${path.replace(/^\//, '')}`;

export function errorMessage(data) {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(errorMessage).join('\n');
  if (data && typeof data === 'object') return Object.entries(data).map(([key, value]) => `${key}: ${errorMessage(value)}`).join('\n');
  return 'No se pudo completar la operación.';
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await globalThis.fetch(apiUrl(path), { ...options, signal: controller.signal });
    if (!response.ok) {
      const data = await response.clone().json().catch(() => ({ error: `Error del servidor (${response.status}).` }));
      throw new Error(errorMessage(data));
    }
    return response;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('El servidor tardó demasiado. Actualice los datos antes de volver a enviar.', { cause: error });
    if (error instanceof TypeError) throw new Error('No hay conexión con el servidor. Compruebe que Django esté iniciado.', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestJson(path, options = {}) {
  const response = await apiFetch(path, options);
  return response.status === 204 ? null : response.json();
}
