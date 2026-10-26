import { AnimatePresence } from "framer-motion";
import { FormCliente } from "./FormCliente";
import { FormBeneficiario } from "./FormBeneficiario";

/**
 * Sección de datos del Tomador / Asegurado / Beneficiario Oneroso que se
 * despliega debajo de las cards (reemplaza ModalCliente y ModalOneroso en el
 * registro de pólizas).
 *
 * seccion = { rol, modo: "ver" | "editar", tipoIdentificacion,
 *             numeroIdentificacion, nombre, token }
 * `token` cambia en cada apertura para volver a consultar.
 */
export const SeccionPersona = ({
  seccion,
  userData,
  beneficiarios,
  setBeneficiarios,
  onClose,
  onCambiarModo,
  onSincronizar,
}) => (
  <AnimatePresence mode="wait">
    {seccion &&
      (seccion.rol === "Beneficiario" ? (
        <FormBeneficiario
          key={`Beneficiario-${seccion.token}`}
          seccion={seccion}
          beneficiarios={beneficiarios}
          setBeneficiarios={setBeneficiarios}
          onClose={onClose}
          onCambiarModo={onCambiarModo}
          onSincronizar={(datos) => onSincronizar(seccion.rol, datos)}
        />
      ) : (
        <FormCliente
          key={`${seccion.rol}-${seccion.token}`}
          seccion={seccion}
          userData={userData}
          onClose={onClose}
          onCambiarModo={onCambiarModo}
          onSincronizar={(datos) => onSincronizar(seccion.rol, datos)}
        />
      ))}
  </AnimatePresence>
);
