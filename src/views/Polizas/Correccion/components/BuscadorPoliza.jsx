/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { PiMagnifyingGlassBold } from "react-icons/pi";
import { MdOutlineEditNote } from "react-icons/md";
import { tokens } from "../../../../theme";
import { buscarPolizasCorreccion } from "../../../../services/Polizas/Query/buscarPolizasCorreccion";

const CRITERIOS = [
  { value: "id_remision", label: "ID de remisión" },
  { value: "no_poliza", label: "Número de póliza" },
  { value: "placa", label: "Placa" },
  { value: "documento", label: "Documento del cliente" },
];

const TIPOS_CLIENTE = [
  { value: "2", label: "Tomador" },
  { value: "1", label: "Asegurado" },
  { value: "3", label: "Beneficiario" },
];

/**
 * Paso 1 del módulo de corrección: ubicar la póliza a intervenir.
 * Reutiliza /Policy/retrievePolizasToQuery (mismo WS del Administrador de negocios).
 */
export const BuscadorPoliza = ({
  onSeleccionar,
  setLoading,
  criterioInicial = "id_remision",
  valorInicial = "",
  resultadosIniciales = null,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const [criterio, setCriterio] = useState(criterioInicial);
  const [tipoCliente, setTipoCliente] = useState("2");
  const [valor, setValor] = useState(valorInicial);
  const [resultados, setResultados] = useState(resultadosIniciales ?? []);
  const [buscado, setBuscado] = useState(resultadosIniciales !== null);

  const inputStyle = {
    height: 40,
    borderRadius: 6,
    padding: "0 10px",
    fontSize: "0.9rem",
    outline: "none",
    color: colors.gray[100],
    backgroundColor: isDark ? colors.primary[400] : "#ffffff",
    border: `1px solid ${colors.gray[isDark ? 600 : 800]}`,
  };

  const ejecutarBusqueda = async (criterioBusqueda, termino) => {
    if (!termino) return;

    setLoading?.(true);
    setBuscado(true);

    const filas = await buscarPolizasCorreccion({
      criterio: criterioBusqueda,
      termino,
      tipoCliente,
    });

    setResultados(filas);
    setLoading?.(false);
  };

  const buscar = (e) => {
    e?.preventDefault();
    ejecutarBusqueda(criterio, valor.trim());
  };

  // Resultados que ya resolvió la vista (entrada por ?no_remision=…)
  useEffect(() => {
    if (resultadosIniciales === null) return;
    setResultados(resultadosIniciales);
    setBuscado(true);
  }, [resultadosIniciales]);

  const accionBody = (row) => (
    <button
      type="button"
      onClick={() => onSeleccionar(row)}
      className="flex items-center gap-1 px-3 py-[6px] rounded-md text-xs font-semibold"
      style={{ backgroundColor: "#88d600", color: "#ffffff" }}
    >
      <MdOutlineEditNote size={16} /> Corregir
    </button>
  );

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: isDark ? colors.primary[400] : "#ffffff",
        border: `1px solid ${colors.gray[isDark ? 600 : 800]}`,
      }}
    >
      <h3
        className="text-sm font-semibold uppercase tracking-wide mb-4"
        style={{ color: colors.gray[isDark ? 300 : 600] }}
      >
        1. Ubicar la póliza
      </h3>

      <form
        onSubmit={buscar}
        className="flex flex-col md:flex-row gap-3 md:items-end"
      >
        <div className="flex flex-col gap-1 md:w-[220px]">
          <label
            className="text-[0.72rem] uppercase tracking-wide font-semibold"
            style={{ color: colors.primary[isDark ? 300 : 700] }}
          >
            Buscar por
          </label>
          <select
            value={criterio}
            onChange={(e) => {
              setCriterio(e.target.value);
              setValor("");
            }}
            style={inputStyle}
          >
            {CRITERIOS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {criterio === "documento" && (
          <div className="flex flex-col gap-1 md:w-[180px]">
            <label
              className="text-[0.72rem] uppercase tracking-wide font-semibold"
              style={{ color: colors.gray[isDark ? 300 : 600] }}
            >
              Rol del cliente
            </label>
            <select
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
              style={inputStyle}
            >
              {TIPOS_CLIENTE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1 flex-1">
          <label
            className="text-[0.72rem] uppercase tracking-wide font-semibold"
            style={{ color: colors.gray[isDark ? 300 : 600] }}
          >
            Valor exacto
          </label>
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={
              criterio === "placa"
                ? "Ej. ABC123"
                : criterio === "documento"
                ? "Ej. 1020304050"
                : criterio === "id_remision"
                ? "Ej. 18422"
                : "Ej. 40045678"
            }
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-5 rounded-md text-sm font-semibold"
          style={{ height: 40, backgroundColor: "#88d600", color: "#ffffff" }}
        >
          <PiMagnifyingGlassBold size={16} /> Buscar
        </button>
      </form>

      {buscado && (
        <div className="mt-5">
          {resultados.length === 0 ? (
            <p
              className="text-sm py-6 text-center"
              style={{ color: colors.gray[isDark ? 400 : 500] }}
            >
              No se encontraron pólizas con ese criterio.
            </p>
          ) : (
            <DataTable
              value={resultados}
              paginator
              rows={5}
              size="small"
              stripedRows
              dataKey="id_anexo_poliza"
              emptyMessage="Sin resultados"
            >
              <Column field="id_remision" header="Remisión" sortable />
              <Column field="no_poliza" header="No. Póliza" sortable />
              <Column field="no_certificado" header="Cert." sortable />
              <Column field="nombre_aseguradora" header="Aseguradora" />
              <Column field="nombre_ramo" header="Ramo" />
              <Column field="nombre_completo_tomador" header="Tomador" />
              <Column field="numero_documento_tomador" header="Documento" />
              <Column field="placa_veh_poliza" header="Placa" />
              <Column field="fecha_inicio_vig_poliza" header="Inicio vig." />
              <Column body={accionBody} header="" style={{ width: 120 }} />
            </DataTable>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorPoliza;
