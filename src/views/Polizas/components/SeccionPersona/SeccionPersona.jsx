import { AnimatePresence } from "framer-motion";
import { FormCliente } from "./FormCliente";
import { FormBeneficiario } from "./FormBeneficiario";

const ORDEN_ROLES = ["Tomador", "Asegurado", "Beneficiario"];

/**
 * Secciones de datos del Tomador / Asegurado / Beneficiario Oneroso que se
 * despliegan debajo de las cards (reemplazan ModalCliente y ModalOneroso en el
 * registro de pólizas). Hay máximo una por rol y se contraen sin desmontarse.
 *
 * secciones = { [rol]: { rol, modo: "ver" | "editar", tipoIdentificacion,
 *               numeroIdentificacion, nombre, nombres, apellidos, token,
 *               abierta, foco } }
 * `token` cambia cada vez que se crea para volver a consultar.
 * `documentosGuardados`: guardados desde esta vista, ya no se pueden editar.
 */
export const SeccionPersona = ({
  secciones,
  documentosGuardados,
  beneficiarios,
  setBeneficiarios,
  onClose,
  onCambiarModo,
  onCambiarAbierta,
  onSincronizar,
  onGuardado,
}) => (
  <AnimatePresence>
    {ORDEN_ROLES.filter((rol) => secciones[rol]).map((rol) => {
      const seccion = secciones[rol];
      const props = {
        seccion,
        cerrado: documentosGuardados.includes(seccion.numeroIdentificacion),
        onClose: () => onClose(rol),
        onCambiarModo: (modo) => onCambiarModo(rol, modo),
        onCambiarAbierta: (abierta) => onCambiarAbierta(rol, abierta),
        onSincronizar: (datos) => onSincronizar(rol, datos),
        onGuardado: (documento) => onGuardado(rol, documento),
      };
      return rol === "Beneficiario" ? (
        <FormBeneficiario
          key={`Beneficiario-${seccion.token}`}
          {...props}
          beneficiarios={beneficiarios}
          setBeneficiarios={setBeneficiarios}
        />
      ) : (
        <FormCliente key={`${rol}-${seccion.token}`} {...props} />
      );
    })}
  </AnimatePresence>
);
