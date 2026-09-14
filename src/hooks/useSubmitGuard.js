import { useCallback, useRef, useState } from "react";

/**
 * Bloquea envíos duplicados por doble clic.
 *
 * El ref corta de forma sincrónica los clics que llegan antes de que React
 * repinte el botón deshabilitado; el estado `busy` sirve para deshabilitar
 * el botón y mostrar "Guardando...".
 *
 * Uso:
 *   const { busy, guard } = useSubmitGuard();
 *   const handlerSave = guard(async () => { ... });
 *   <button onClick={handlerSave} disabled={busy}>
 *
 * Si el handler devuelve `KEEP_LOCKED`, la guarda NO se libera (útil cuando
 * el flujo termina en window.location.reload()).
 */
export const KEEP_LOCKED = Symbol("useSubmitGuard.keepLocked");

export const useSubmitGuard = () => {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const guard = useCallback(
    (fn) =>
      async (...args) => {
        if (busyRef.current) return undefined;
        busyRef.current = true;
        setBusy(true);
        let result;
        try {
          result = await fn(...args);
          return result;
        } finally {
          if (result !== KEEP_LOCKED) {
            busyRef.current = false;
            setBusy(false);
          }
        }
      },
    []
  );

  return { busy, guard };
};
