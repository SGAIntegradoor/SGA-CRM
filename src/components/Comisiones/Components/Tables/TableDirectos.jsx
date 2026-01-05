import React, { useEffect, useMemo, useRef, useState } from "react";

export const TableDirectos = ({
  headers = [],
  data = [],
  classname = "",
  onRowsChange,
  readOnly = false,
  headerColor = "",
  title = "",
  from = ""
}) => {

  console.log(data)
  // --- Utils ---
  const toNumberCOP = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v ?? "").trim();
    if (!s) return 0;
    return (
      Number(
        s
          .replace(/[^\d.,-]/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0
    );
  };

  const nfCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
  const formatCOP = (n) => nfCOP.format(Number(n || 0));

  // Mapa de encabezado -> clave del objeto fila
  const keyByHeader = useMemo(() => {
    const map = {
      "fecha de expedición": "fecha_expedicion",
      ramo: "ramo",
      aseguradora: "aseguradora",
      poliza: "poliza",
      anexo: "anexo",
      asegurado: "asegurado",
      "identificación asegurado": "identificacion_asegurado",
      placa: "placa",
      "prima sin iva + asistencia": "prima_sin_iva_asistencia",
      "asesor 10": "asesor_10",
      "unidad de negocio": "unidad_negocio",
      "asesor ganador": "asesor_ganador",
      "asesor freelance": "asesor_freelance",
      "tipo expedición": "tipo_expedicion",
      "inicio vigencia": "inicio_vigencia",
      "% comisión": "porcentaje_comision",
      "total comisión": "total_comision",
    };
    return map;
  }, []);

  // Normaliza cada fila
  const normalizeRow = (r) => {
    const base = toNumberCOP(r.prima_sin_iva_asistencia ?? r.base ?? 0);
    // UI usa unidades de % (0.09 = 0.09%)
    const pct = Number(r.porcentaje_comision ?? 0) || 0;

    const isNA =
      String(r.valor_comision ?? "").trim().toUpperCase() === "N/A";

    let totalNum = isNA ? 0 : toNumberCOP(r.total_comision ?? r.valor_comision);
    if (!totalNum && base) totalNum = base * (pct / 100);

    return {
      ...r,
      __baseNum: base,
      __isNA: isNA,
      porcentaje_comision: pct,
      total_comision: totalNum,
    };
  };

  const [rows, setRows] = useState(() => data.map(normalizeRow));

  // Resincroniza si cambia la prop data
  useEffect(() => {
    setRows(data.map(normalizeRow));
  }, [data]);

  // Avisar al padre sin re-ejecutar por cambio de identidad del callback
  const onRowsChangeRef = useRef(onRowsChange);
  useEffect(() => {
    onRowsChangeRef.current = onRowsChange;
  }, [onRowsChange]);

  useEffect(() => {
    if (typeof onRowsChangeRef.current === "function") {
      onRowsChangeRef.current(rows);
    }
  }, [rows]);

  // Recalcular una fila cuando cambie el %
  const recalcRow = (row) => {
    const base = row.__baseNum ?? toNumberCOP(row.prima_sin_iva_asistencia ?? 0);
    const pct = Number(row.porcentaje_comision ?? 0) || 0;
    const total = row.__isNA ? 0 : base * (pct / 100);
    return { ...row, __baseNum: base, total_comision: total };
  };

  const handlePctChange = (rowIndex, value) => {
    const pct = Number(value);
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? recalcRow({ ...r, porcentaje_comision: isNaN(pct) ? 0 : pct })
          : r
      )
    );
  };

  const unidadesNegocioOptions = {
    1: "Freelance",
    2: "Negocio Directo",
    3: "Asesor 10",
    4: "Asesor Ganador",
  }

  const renderCell = (row, header, rowIndex) => {
    const key = keyByHeader[header.toLowerCase()] ?? header;
    const lower = header.toLowerCase();
    const isPct = lower.includes("% comisión");
    const isTotal = lower.includes("total comisión");
    const isBase = lower.includes("prima sin iva + asistencia");
    const isUnidadNegocio = lower.includes("unidad de negocio");

    if (isPct) {
      const disabledPct =
        readOnly || String(row.tipo_expedicion).toLowerCase() === "cancelación";
      return (
        <div className="relative inline-flex items-center">
          <input
            type="number"
            step="0.001"
            min="0"
            max="1"
            className="w-11 text-center py-2"
            value={rows[rowIndex].porcentaje_comision ?? 0}
            onChange={(e) => handlePctChange(rowIndex, e.target.value)}
            placeholder="0.07"
            // disabled={disabledPct}
          />
          <span className="absolute right-2 text-gray-500 select-none" aria-hidden="true">
            %
          </span>
        </div>
      );
    }

    if (isTotal) {
      if (rows[rowIndex].__isNA) return "N/A";
      return formatCOP(rows[rowIndex].total_comision || 0);
    }

    if (isBase) {
      const base = rows[rowIndex].__baseNum ?? toNumberCOP(row[key]);
      return formatCOP(base);
    }

    if (isUnidadNegocio) {
      return unidadesNegocioOptions[row[key]] ?? row[key];
    }

    const val = row[key];
    if (typeof val === "number" && !Number.isNaN(val)) return String(val);
    if (typeof val === "string") {
      const looksMoney = /\$|(\d+\.\d{3})/.test(val);
      if (looksMoney) return formatCOP(toNumberCOP(val));
      return val;
    }
    return val ?? "";
  };

  const totalTabla = useMemo(
    () =>
      rows.reduce((acc, r) => {
        var total = Math.ceil(Number(r.total_comision) || 0);
        return acc + (r.__isNA ? 0 : total);
      }, 0),
    [rows]
  );
  return (
    <table className={classname}>
      <thead>
        <tr className={"border-gray-300 border-[1.5px]"}>
          {headers.map((header, index) => (
            <th key={index} className={`border-gray-300 w-[25px] py-2 border-[1.5px] text-[12px] ${title != "" && title == "Asesor Freelance" ? headerColor : ""}`}>
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-gray-300 border-[1.5px]">
            {headers.map((header, cellIndex) => (
              <td key={cellIndex} className="border-gray-300 border-[1.5px] text-center text-[12px]">
                {renderCell(row, header, rowIndex)}
              </td>
            ))}
          </tr>
        ))}

        <tr>
          <td colSpan={Math.max(headers.length - 2, 0)}></td>
          <td className="border-gray-300 border-[1.5px] text-center font-bold text-[14.5]">{title == "Cancelaciones" ? "Total a descontar" : "Total"}</td>
          <td className="border-gray-300 border-[1.5px] text-center font-bold">
            {formatCOP(totalTabla)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};
