import { useEffect, useState } from 'react';

// Ignora respuestas anteriores al cambiar filtros o salir de una pantalla.
export function useResource(loader) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return undefined;
      setResult({ data: null, loading: true, error: '' });
      return loader();
    }).then(data => {
      if (active) setResult({ data, loading: false, error: '' });
    }).catch(error => {
      if (active) setResult({ data: null, loading: false, error: error.message });
    });
    return () => { active = false; };
  }, [loader, version]);
  return { ...result, reload: () => setVersion(value => value + 1) };
}
