export function crearCSV(encabezados, filas) {
  const celda = (value) => {
    let texto = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [encabezados, ...filas].map(fila => fila.map(celda).join(';')).join('\r\n');
}

export function descargarCSV(encabezados, filas, nombre) {
  const url = URL.createObjectURL(new Blob([crearCSV(encabezados, filas)], { type: 'text/csv;charset=utf-8;' }));
  const enlace = document.createElement('a');
  enlace.href = url; enlace.download = nombre;
  enlace.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
