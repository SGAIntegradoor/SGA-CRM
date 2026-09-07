/* eslint-disable react/prop-types */
import { useState } from "react";
import { useTheme } from "@mui/material";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { tokens } from "../../../../theme";

/**
 * Panel plegable con la bitácora de la póliza (bitacora_control_polizas).
 * Resalta las filas de tipo "Corrección".
 */
export const HistorialBitacora = ({ registros = [] }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";
  const [abierto, setAbierto] = useState(false);

  const correcciones = registros.filter(
    (r) => (r.tipo_interaccion || "").toLowerCase() === "corrección"
  ).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: isDark ? colors.primary[400] : "#ffffff",
        border: `1px solid ${colors.gray[isDark ? 600 : 800]}`,
      }}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <span
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: colors.gray[isDark ? 300 : 600] }}
        >
          Historial de la póliza
          <span
            className="ml-2 text-[0.7rem] font-normal normal-case"
            style={{ color: colors.gray[isDark ? 400 : 500] }}
          >
            ({registros.length} movimientos · {correcciones} correcciones)
          </span>
        </span>
        {abierto ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
      </button>

      {abierto && (
        <div
          className="px-5 pb-4 max-h-[320px] overflow-y-auto"
          style={{ borderTop: `1px solid ${colors.gray[isDark ? 600 : 800]}` }}
        >
          {registros.length === 0 ? (
            <p
              className="text-sm py-4"
              style={{ color: colors.gray[isDark ? 400 : 500] }}
            >
              Sin movimientos registrados.
            </p>
          ) : (
            <ul className="flex flex-col">
              {registros.map((r, i) => {
                const esCorreccion =
                  (r.tipo_interaccion || "").toLowerCase() === "corrección";
                return (
                  <li
                    key={`${r.id_interaccion}-${i}`}
                    className="py-3 flex flex-col gap-1"
                    style={{
                      borderBottom:
                        i < registros.length - 1
                          ? `1px solid ${colors.gray[isDark ? 800 : 900]}`
                          : "none",
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[0.68rem] px-2 py-[2px] rounded-full font-semibold"
                        style={{
                          color: esCorreccion
                            ? colors.blueAccent[300]
                            : colors.gray[isDark ? 300 : 600],
                          border: `1px solid ${
                            esCorreccion
                              ? colors.blueAccent[400]
                              : colors.gray[isDark ? 600 : 800]
                          }`,
                        }}
                      >
                        {r.tipo_interaccion || "—"}
                      </span>
                      <span
                        className="text-[0.72rem]"
                        style={{ color: colors.gray[isDark ? 400 : 500] }}
                      >
                        {r.fecha_interaccion} ·{" "}
                        {r.usuario_interactor || `Usuario ${r.id_usuario_interactor}`}
                      </span>
                      <span
                        className="text-[0.72rem] font-mono"
                        style={{ color: colors.gray[isDark ? 400 : 500] }}
                      >
                        {r.tabla_interaccion}
                        {r.campos_interaccion ? `.${r.campos_interaccion}` : ""}
                      </span>
                    </div>
                    <p
                      className="text-[0.82rem]"
                      style={{ color: colors.gray[100] }}
                    >
                      {r.descripcion_interaccion}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorialBitacora;
