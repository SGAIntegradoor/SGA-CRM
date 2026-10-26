import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineUser } from "react-icons/ai";
import { FiChevronUp } from "react-icons/fi";

const EASE = [0.22, 1, 0.36, 1];

export const TIPOS_DOCUMENTO = {
  1: "CC",
  2: "NIT",
  3: "CE",
  4: "Pasaporte",
};

const ROLES = {
  Tomador: "Tomador",
  Asegurado: "Asegurado",
  Beneficiario: "Beneficiario Oneroso",
};

// "Datos del Tomador - CC 38644808"
export const tituloSeccion = (rol, tipoDocumento, documento) => {
  const tipo = TIPOS_DOCUMENTO[tipoDocumento];
  const doc = documento ? ` - ${tipo ? `${tipo} ` : ""}${documento}` : "";
  return `Datos del ${ROLES[rol] ?? rol}${doc}`;
};

export const inputCls =
  "w-full h-[32px] rounded-md border border-gray-400 bg-white px-2 text-sm text-gray-900 transition focus:outline-none focus:border-lime-9000 focus:ring-2 focus:ring-lime-9000/20 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

const TONOS = {
  nuevo: "bg-[#fff4d6] text-[#b7791f] border-[#f5dc9a]",
  existente: "bg-lime-50 text-lime-700 border-lime-200",
  consultando: "bg-gray-100 text-gray-500 border-gray-200 animate-pulse",
  error: "bg-red-50 text-red-600 border-red-200",
};

export const Badge = ({ tono, children }) => (
  <motion.span
    key={`${tono}-${children}`}
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ type: "spring", stiffness: 420, damping: 26 }}
    className={`inline-flex items-center rounded-md border px-3 py-0.5 text-[12px] font-medium ${TONOS[tono]}`}
  >
    {children}
  </motion.span>
);

// Entrada escalonada de cada bloque del formulario
export const Bloque = ({ i = 0, className = "", children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.12 + i * 0.06, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Campo = ({ label, htmlFor, className = "", children }) => (
  <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-gray-800">
      {label}
    </label>
    {children}
  </div>
);

export const Principal = ({ activo, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={activo ? "Principal" : "Marcar como principal"}
    className={`flex items-center gap-2 whitespace-nowrap text-[13px] transition-colors disabled:cursor-default ${
      activo ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
    }`}
  >
    <motion.span
      animate={{
        scale: activo ? 1 : 0.8,
        backgroundColor: activo ? "#88d600" : "#d1d5db",
      }}
      transition={{ duration: 0.2 }}
      className="h-3 w-3 rounded-full"
    />
    Principal
  </button>
);

export const Agregar = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="self-start text-[13px] text-gray-400 transition-colors hover:text-lime-700 disabled:opacity-50 disabled:hover:text-gray-400"
  >
    + {children}
  </button>
);

// Fila que entra/sale con altura animada (celulares, correos, direcciones)
export const FilaAnimada = ({ children, className = "" }) => (
  <motion.div
    layout
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.25, ease: EASE }}
    className={`overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

export const Esqueleto = () => (
  <div className="flex flex-col gap-4">
    {[0, 1, 2].map((fila) => (
      <div key={fila} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col gap-2">
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-[32px] rounded-md bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const BtnCancelar = ({ onClick, children = "Cancelar", disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-[38px] min-w-[150px] rounded-md bg-gray-400 px-6 font-semibold text-white shadow-sm transition hover:bg-gray-500 disabled:opacity-50"
  >
    {children}
  </button>
);

export const BtnGuardar = ({ onClick, children = "Guardar", disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-[38px] min-w-[150px] rounded-md bg-lime-9000 px-6 font-semibold text-white shadow-sm transition hover:bg-lime-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </button>
);

// Contenedor de la sección: encabezado con título + badge, contraer/expandir
// y entrada/salida animada. El padre lo monta dentro de un AnimatePresence.
export const SeccionShell = ({ titulo, badge, modo, footer, children }) => {
  const [abierta, setAbierta] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mx-6 mb-2 scroll-mt-6 overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-lg"
    >
      <motion.div
        className="h-[3px] origin-left bg-lime-9000"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
      />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <AiOutlineUser size={22} className="shrink-0 text-gray-700" />
          <p className="truncate text-[15px] font-semibold text-gray-800">
            {titulo}
          </p>
          <AnimatePresence mode="wait">{badge}</AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          {modo && (
            <span className="text-[11px] uppercase tracking-wider text-gray-400">
              {modo === "ver" ? "Consulta" : "Edición"}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAbierta((v) => !v)}
            className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <motion.span
              animate={{ rotate: abierta ? 0 : 180 }}
              transition={{ duration: 0.25 }}
              className="flex"
            >
              <FiChevronUp size={16} />
            </motion.span>
            {abierta ? "Contraer" : "Expandir"}
          </button>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div
            key="cuerpo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 px-5 py-4">{children}</div>
            {footer && (
              <div className="flex flex-wrap justify-end gap-4 px-5 pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
