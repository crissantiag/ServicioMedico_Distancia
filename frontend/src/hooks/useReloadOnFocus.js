import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

// Recarga los datos cuando la pantalla vuelve a estar visible (por ejemplo, después de editar).
// Se salta la primera vez porque useResource ya carga al abrir la pantalla.
export function useReloadOnFocus(reload) {
  const reloadRef = useRef(reload);
  useEffect(() => { reloadRef.current = reload; }, [reload]);
  const primera = useRef(true);
  useFocusEffect(useCallback(() => {
    if (primera.current) { primera.current = false; return; }
    reloadRef.current();
  }, []));
}
