import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { requestJson } from './api';

export function useRemoteData(loader) {
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState(null);
  useEffect(() => {
    let activo = true;
    loader().then(data => {
      if (activo) setResultado({ loader, revision, data });
    }).catch(error => {
      if (!activo) return;
      setResultado({ loader, revision, data: null });
      Swal.fire('Error al cargar', error.message, 'error');
    });
    return () => { activo = false; };
  }, [loader, revision]);
  const recargar = useCallback(() => setRevision(value => value + 1), []);
  const vigente = resultado?.loader === loader && resultado.revision === revision;
  return { data: vigente ? resultado.data : null, cargando: !vigente, recargar };
}

export function useRecords(...recursos) {
  const clave = JSON.stringify(recursos);
  const loader = useCallback(() => Promise.all(JSON.parse(clave).map(recurso => requestJson(`/${recurso}/`))), [clave]);
  return useRemoteData(loader);
}
