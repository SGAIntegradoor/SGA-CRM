// El input type="date" acepta años de hasta 6 dígitos (ej. "20266-11-01") y el
// backend los guardaba como 0000-00-00. Toda fecha de póliza pasa por aquí.

const ANIO_MIN = 1900;
const ANIO_MAX = 2100;

// Devuelve "AAAA-MM-DD" si es una fecha real con año entre 1900 y 2100; si no, null.
export const fechaValida = (valor) => {
  if (typeof valor !== "string") return null;
  const match = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
  if (!match) return null;
  const [, anio, mes, dia] = match.map(Number);
  if (anio < ANIO_MIN || anio > ANIO_MAX) return null;
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
  return fecha.toISOString().split("T")[0];
};

// Suma días/años a una fecha válida; null si la fecha no es válida (nunca lanza).
export const sumarAFecha = (valor, { dias = 0, anios = 0 } = {}) => {
  const base = fechaValida(valor);
  if (!base) return null;
  const fecha = new Date(`${base}T00:00:00Z`);
  fecha.setUTCFullYear(fecha.getUTCFullYear() + anios);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().split("T")[0];
};

const ETIQUETAS_FECHA = {
  fechaExpedicion: "Fecha de expedición",
  fechaInicioVigencia: "Fecha inicio de vigencia",
  fechaFinVigencia: "Fecha fin de vigencia",
  fechaRegistro: "Fecha de registro",
};

// Valida las fechas del cabezote de la póliza. Devuelve el mensaje de error o null.
export const validarFechasPoliza = (cabezote) => {
  for (const [campo, etiqueta] of Object.entries(ETIQUETAS_FECHA)) {
    if (!fechaValida(cabezote?.[campo])) {
      return `La ${etiqueta.toLowerCase()} no es válida. Revise el año (entre ${ANIO_MIN} y ${ANIO_MAX}).`;
    }
  }
  if (fechaValida(cabezote.fechaFinVigencia) < fechaValida(cabezote.fechaInicioVigencia)) {
    return "La fecha fin de vigencia no puede ser anterior a la fecha inicio de vigencia.";
  }
  return null;
};
