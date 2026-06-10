import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TableDirectos } from "../../../components/Comisiones/Components/Tables/TableDirectos";
import { IoIosCloudDownload } from "react-icons/io";
import { MdAttachEmail } from "react-icons/md";
import { getSettlement } from "../../../services/Settlements/getSettlement";
import { getAllRet } from "../../../services/Comisiones/getAllRet";
import LogoGA from "../../../assets/img/LogoGA.png";
import { useReactToPrint } from "react-to-print";

const cmpPolizaAnexo = (a, b) => {
  const s = (v) => (v == null ? "" : String(v).trim());
  const byPoliza = s(a.poliza).localeCompare(s(b.poliza), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  if (byPoliza !== 0) return byPoliza;
  return s(a.anexo).localeCompare(s(b.anexo), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const headersAsesorFreelance = [
  "Fecha de expedición",
  "Ramo",
  "Aseguradora",
  "Poliza",
  "Anexo",
  "Asegurado",
  "Placa",
  "Prima sin IVA + asistencia",
  "Asesor Freelance",
  "Tipo expedición",
  "% Comisión",
  "Total Comisión",
];

// "fecha de expedición": "fecha_expedicion",
// ramo: "ramo",
// aseguradora: "aseguradora",
// poliza: "poliza",
// anexo: "anexo",
// asegurado: "asegurado",
// "identificación asegurado": "identificacion_asegurado",
// placa: "placa",
// "prima sin iva + asistencia": "prima_sin_iva_asistencia",
// "asesor 10": "asesor_10",
// "asesor ganador": "asesor_ganador",
// "asesor freelance": "asesor_freelance",
// "tipo expedición": "tipo_expedicion",
// "inicio vigencia": "inicio_vigencia",
// "% comisión": "porcentaje_comision",
// "total comisión": "total_comision",

const headersDirectos = [
  "Fecha de expedición",
  "Ramo",
  "Aseguradora",
  "Poliza",
  "Anexo",
  "Asegurado",
  "Placa",
  "Prima sin IVA + asistencia",
  "Tipo expedición",
  "% Comisión",
  "Total Comisión",
];

const headersAsesor10 = [
  "Fecha de expedición",
  "Ramo",
  "Aseguradora",
  "Poliza",
  "Anexo",
  "Asegurado",
  "Placa",
  "Prima sin IVA + asistencia",
  "Asesor 10",
  "Tipo expedición",
  "% Comisión",
  "Total Comisión",
];

const headersAsesorGanador = [
  "Fecha de expedición",
  "Ramo",
  "Aseguradora",
  "Poliza",
  "Anexo",
  "Asegurado",
  "Placa",
  "Prima sin IVA + asistencia",
  "Asesor Ganador",
  "Tipo expedición",
  "% Comisión",
  "Total Comisión",
];

const headersCancelaciones = [
  "Fecha de expedición",
  "Ramo",
  "Aseguradora",
  "Poliza",
  "Anexo",
  "Asegurado",
  "Placa",
  "Prima sin IVA + asistencia",
  "Unidad de negocio",
  "Tipo expedición",
  "% Comisión",
  "Total Comisión",
];

const nombresTablas = {
  directos: "Directos",
  asesor10: "Asesor 10",
  asesorGanador: "Asesor Ganador",
  asesorFreelance: "Asesor Freelance",
  cancelaciones: "Cancelaciones",
  modificaciones: "Modificaciones",
};

const nfCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const formatCOP = (value) => nfCOP.format(Number(value || 0));

const toNumberCOP = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  return (
    Number(
      s
        .replace(/[^\d.,-]/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    ) || 0
  );
};

const pickPct = (row) => {
  if (row.porcentaje_comision_pct != null) {
    const n = Number(row.porcentaje_comision_pct);
    return Number.isFinite(n) ? n : 0;
  }
  const raw = row.porcentaje_comision ?? row.porcentaje_comision_decimal ?? 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return n < 1 ? n * 100 : n;
};

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const hasBusinessValue = (value) => {
  const text = normalizeText(value);
  return (
    text !== "" &&
    text !== "n/a" &&
    text !== "na" &&
    text !== "null" &&
    text !== "undefined"
  );
};

const resolvePrintUnit = (liquidacion, rows = []) => {
  const roleFromSettlement = normalizeText(liquidacion?.tipo_usuario).replace(
    /\s+/g,
    "",
  );

  if (roleFromSettlement === "asesor10") {
    return { unitRole: "asesor10", unitLabel: "Asesor 10" };
  }
  if (roleFromSettlement === "asesorganador") {
    return { unitRole: "asesorGanador", unitLabel: "Asesor Ganador" };
  }
  if (roleFromSettlement === "freelance") {
    return { unitRole: "freelance", unitLabel: "Freelance" };
  }

  const source = Array.isArray(rows)
    ? rows.find(
        (row) =>
          hasBusinessValue(row?.asesor_10) ||
          hasBusinessValue(row?.asesor_ganador) ||
          hasBusinessValue(row?.asesor_freelance),
      )
    : null;

  if (!source) {
    return { unitRole: "freelance", unitLabel: "Freelance" };
  }

  if (hasBusinessValue(source.asesor_10)) {
    return { unitRole: "asesor10", unitLabel: "Asesor 10" };
  }

  if (hasBusinessValue(source.asesor_ganador)) {
    return { unitRole: "asesorGanador", unitLabel: "Asesor Ganador" };
  }

  return { unitRole: "freelance", unitLabel: "Freelance" };
};

const isCancellation = (row) =>
  normalizeText(row?.tipo_expedicion) === "cancelacion";

const isNewBusiness = (row) => normalizeText(row?.tipo_expedicion) === "nueva";

const formatPct = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
};

const toSafeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const formatPeriodo = (rows = []) => {
  const dates = rows
    .map((row) => {
      const raw = String(row?.fecha_expedicion ?? "").trim();
      if (!raw) return null;
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return { year: Number(match[1]), month: Number(match[2]) };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year || a.month - b.month);

  if (!dates.length) return "";

  const first = dates[0];
  const last = dates[dates.length - 1];

  const formatMonthYear = (d) => `${MONTHS_ES[d.month - 1]} ${d.year}`;

  if (first.year === last.year && first.month === last.month) {
    return formatMonthYear(first);
  }

  return `${formatMonthYear(first)} - ${formatMonthYear(last)}`;
};

export default function LiquidacionImpresion() {
  const location = useLocation();
  const nav = useNavigate();

  const query = new URLSearchParams(location.search);
  const id_liquidacion = query.get("id_liquidacion");

  const [loading, setLoading] = useState(true);
  const [liquidacion, setLiquidacion] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [retenciones, setRetenciones] = useState([]);

  const state = location.state;
  const usuario = state?.usuario || (detalles[0]?.usuario_sga ?? "");
  const emisor_liquidacion = liquidacion?.nombre_emisor_liq;

  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id_liquidacion) return;
      const [res, retData] = await Promise.all([
        getSettlement(id_liquidacion),
        getAllRet().catch(() => []),
      ]);
      if (res?.status === "Ok") {
        setLiquidacion(res.liquidacion);
        setDetalles(res.detalles);
      }
      setRetenciones(Array.isArray(retData) ? retData : []);
      setLoading(false);
      window.scrollTo(0, 0);
    };
    fetchData();
  }, [id_liquidacion]);

  const tablesPolizas = useMemo(() => {
    const t = {
      directos: [],
      asesor10: [],
      asesorFreelance: [],
      asesorGanador: [],
      cancelaciones: [],
      modificaciones: [],
    };

    detalles.forEach((poliza) => {
      const pct = pickPct(poliza);
      const base = toNumberCOP(
        poliza.prima_sin_iva_asistencia ?? poliza.base ?? 0,
      );
      const isCancel =
        String(poliza.tipo_expedicion).toLowerCase() === "cancelación";

      const totalBack = toNumberCOP(
        poliza.total_comision ?? poliza.valor_comision,
      );
      const total = isCancel ? totalBack : base * (pct / 100);

      const baseRow = {
        ...poliza,
        porcentaje_comision: pct,
        total_comision: total,
        prima_sin_iva_asistencia: base,
      };

      if (poliza.tipo === "directo") t.directos.push(baseRow);
      else if (isCancel) t.cancelaciones.push(baseRow);
      else if (
        (poliza.asesor_10 === "N/A" ||
          poliza.asesor_10 === "" ||
          poliza.asesor_10 == null) &&
        (poliza.asesor_ganador === "N/A" ||
          poliza.asesor_ganador === "" ||
          poliza.asesor_ganador == null) &&
        (poliza.asesor_freelance === "N/A" ||
          poliza.asesor_freelance === "" ||
          poliza.asesor_freelance == null)
      ) {
        t.directos.push(baseRow);
        // eliminar el indece 8
        headersAsesorFreelance.splice(8, 1);
      } else if (poliza.asesor_10 !== "N/A") t.asesor10.push(baseRow);
      else if (poliza.asesor_ganador !== "N/A") t.asesorGanador.push(baseRow);
      else if (poliza.asesor_freelance !== "N/A")
        t.asesorFreelance.push(baseRow);
    });

    Object.keys(t).forEach((k) => t[k].sort(cmpPolizaAnexo));
    return t;
  }, [detalles]);

  const unitInfo = useMemo(
    () => resolvePrintUnit(liquidacion, detalles),
    [liquidacion, detalles],
  );

  const isExternalLiquidacion = useMemo(() => {
    const normalized = normalizeText(liquidacion?.tipo_usuario).replace(
      /\s+/g,
      "",
    );
    if (
      normalized === "freelance" ||
      normalized === "asesor10" ||
      normalized === "asesorganador"
    ) {
      return true;
    }

    return detalles.some(
      (row) =>
        row.ga_comision_pct != null ||
        row.comision_ga != null ||
        row.comision_neta != null ||
        row.impuesto_aseguradora != null,
    );
  }, [liquidacion, detalles]);

  const printRows = useMemo(() => {
    return [...detalles]
      .map((row, index) => {
        const primaSinIva = Math.round(
          toNumberCOP(
            row.prima_sin_iva_asistencia ??
              row.prima_neta ??
              row.base_calculo ??
              0,
          ),
        );
        const gaPct = Number(
          row.ga_comision_pct ??
            row.ga_commission_pct ??
            row.porcentaje_comision_ga,
        );
        const safeGAPct = Number.isFinite(gaPct) ? gaPct : 0;

        const gaFromRow = toNumberCOP(
          row.comision_ga ?? row.ga_commission_value ?? row.valor_comision_ga,
        );
        const comisionGA =
          gaFromRow !== 0
            ? gaFromRow
            : Math.round((primaSinIva * safeGAPct) / 100);

        const impuestosFromRow = toNumberCOP(
          row.impuesto_aseguradora ?? row.impuestos_value ?? row.impuestos,
        );
        const impuestos =
          impuestosFromRow !== 0
            ? impuestosFromRow
            : Math.max(comisionGA - toNumberCOP(row.comision_neta), 0);

        const comisionNetaFromRow = toNumberCOP(
          row.comision_neta ?? row.comision_neta_value,
        );
        const comisionNeta =
          comisionNetaFromRow !== 0
            ? comisionNetaFromRow
            : comisionGA - impuestos;

        const participationPct = pickPct(row);
        const totalComision = toNumberCOP(
          row.total_comision ?? row.total_comision_value ?? row.valor_comision,
        );

        return {
          ...row,
          _print_id: `${row.id_detalle_liq ?? row.id_anexo_poliza ?? index}`,
          primaSinIva,
          gaPct: safeGAPct,
          comisionGA,
          impuestos,
          comisionNeta,
          participationPct,
          totalComision,
        };
      })
      .sort(cmpPolizaAnexo);
  }, [detalles]);

  const activePrintRows = useMemo(
    () => printRows.filter((row) => !isCancellation(row)),
    [printRows],
  );

  const cancelledPrintRows = useMemo(
    () => printRows.filter((row) => isCancellation(row)),
    [printRows],
  );

  const externalSummary = useMemo(() => {
    const totalPrimaSinIva = activePrintRows.reduce(
      (sum, row) => sum + row.primaSinIva,
      0,
    );
    const negociosNuevos = activePrintRows.filter(isNewBusiness).length;
    const negociosCancelados = cancelledPrintRows.length;
    const totalComisionFreelance = printRows.reduce(
      (sum, row) => sum + row.totalComision,
      0,
    );

    const pctValues = Array.from(
      new Set(
        activePrintRows
          .map((row) => Number(row.participationPct))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    );

    return {
      totalPrimaSinIva,
      negociosNuevos,
      negociosCancelados,
      totalComisionFreelance,
      participationPct: pctValues.length === 1 ? pctValues[0] : null,
    };
  }, [activePrintRows, cancelledPrintRows, printRows]);

  const periodo = useMemo(() => formatPeriodo(detalles), [detalles]);

  const printSummary = useMemo(() => {
    const totalPrimas = activePrintRows.reduce(
      (acc, row) => acc + toSafeNumber(row.primaSinIva),
      0,
    );
    const totalComisionGA = printRows.reduce(
      (acc, row) => acc + toSafeNumber(row.comisionGA),
      0,
    );
    const totalImpuestos = printRows.reduce(
      (acc, row) => acc + toSafeNumber(row.impuestos),
      0,
    );
    const totalComisionNeta = printRows.reduce(
      (acc, row) => acc + toSafeNumber(row.comisionNeta),
      0,
    );
    const totalComisionFreelance = printRows.reduce(
      (acc, row) => acc + toSafeNumber(row.totalComision),
      0,
    );

    const totalAntesImpuestos = toSafeNumber(totalComisionFreelance);

    const responsableIva =
      liquidacion?.responsable_iva ?? detalles[0]?.usu_freelance?.responsable_iva;
    const iva19 = String(responsableIva) === "1" ? totalAntesImpuestos * 0.19 : 0;

    const retencionesList = Array.isArray(retenciones) ? retenciones : [];
    const retencionId =
      liquidacion?.usu_retencion ?? detalles[0]?.usu_freelance?.u_retencion;
    const ret = retencionesList.find(
      (r) => String(r?.id) === String(retencionId),
    );
    const retencionesPorcentaje = toSafeNumber(ret?.porc_ret);
    const retencionesValue = (retencionesPorcentaje * totalAntesImpuestos) / 100;

    const totalAPagar = totalAntesImpuestos + iva19 - retencionesValue;

    return {
      totalPrimas,
      totalComisionGA,
      totalImpuestos,
      totalComisionNeta,
      totalComisionFreelance,
      totalAntesImpuestos,
      iva19,
      retencionesValue,
      retencionesPorcentaje,
      totalAPagar,
    };
  }, [activePrintRows, printRows, retenciones, liquidacion, detalles]);

  const isAnulada =
    String(liquidacion?.estado || "")
      .trim()
      .toLowerCase() === "anulada";

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: `Liquidacion_${id_liquidacion || "sin_id"}`,
    removeAfterPrint: true,
    pageStyle: `
      @page { size: A4; margin: 0mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .no-print { display:none !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      table, tr, td, th, section { break-inside: avoid; page-break-inside: avoid; }
      .page-break { break-after: page; }
      /* compacta el gap entre secciones en impresión */
      .space-y-10 > :not([hidden]) ~ :not([hidden]){ margin-top: 10px !important; }
      /* marca de agua */
      .wm-anulada {
        position: fixed;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-size: 120pt;
        font-weight: 900;
        letter-spacing: 8px;
        text-transform: uppercase;
        color: #dc2626;
        opacity: 0.12;
        z-index: 1;
        pointer-events: none;
        user-select: none;
        white-space: nowrap;
      }
      .adjust-total { margin-right: 5px !important; font-size: 15px; font-family: Arial, sans-serif; }
    `,
  });

  if (loading) return <p className="p-6">Cargando...</p>;

  if (!liquidacion) {
    return (
      <div className="p-6">
        <p>No se encontró la liquidación #{id_liquidacion}</p>
        <button
          className="no-print mt-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          onClick={() => nav("crm/comisiones/liquidacion")}
        >
          Volver
        </button>
      </div>
    );
  }

  const totalPagar = detalles.reduce((sum, d) => {
    const v = Number(d.valor_comision);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  const effectiveTotalPagar =
    isExternalLiquidacion &&
    Number.isFinite(externalSummary.totalComisionFreelance)
      ? externalSummary.totalComisionFreelance
      : totalPagar;

  /** ========= Paginación =========
   *  Para evitar huecos y no partir filas, usamos paginación fija.
   *  En la ÚLTIMA sección dejamos hueco para que quepa el bloque de "Total".
   */
  const ROWS_PER_PRINT_PAGE = 14; // filas normales por hoja
  const RESERVE_ROWS_FOR_SUMMARY = 3; // “hueco” aproximado para el total (ajústalo si hace falta)

  const paginate = (rows, perPage) => {
    const pages = [];
    for (let i = 0; i < rows.length; i += perPage) {
      pages.push(rows.slice(i, i + perPage));
    }
    return pages;
  };

  // Pagina la última sección reservando algunas filas para que el total quepa
  const paginateWithReserveOnLast = (rows, perPage, reserve = 3) => {
    const pages = [];
    let i = 0;
    while (i < rows.length) {
      const remaining = rows.length - i;
      if (remaining <= perPage) {
        // Última página de la sección -> deja hueco
        const take = Math.min(perPage - reserve, remaining);
        pages.push(rows.slice(i, i + take));
        i += take;
      } else {
        pages.push(rows.slice(i, i + perPage));
        i += perPage;
      }
    }
    return pages;
  };

  const sections = Object.entries(nombresTablas)
    .map(([key, title]) => ({ key, title, rows: tablesPolizas[key] || [] }))
    .filter((s) => s.rows.length);

  const lastIdx = sections.length - 1;

  const participationHeader =
    unitInfo.unitRole === "asesor10"
      ? "% Asesor 10"
      : unitInfo.unitRole === "asesorGanador"
        ? "% Asesor Ganador"
        : "% Freelance";

  const totalComisionHeader =
    unitInfo.unitRole === "asesor10"
      ? "Total comisión Asesor 10"
      : unitInfo.unitRole === "asesorGanador"
        ? "Total comisión Asesor Ganador"
        : "Total comisión Freelance";

  const renderExternalTable = (rows, { showFooterTotal = true } = {}) => {
    if (!rows.length) {
      // return <div className="text-sm text-gray-500">Sin registros</div>;
      return;
    }

    const totalTable = rows.reduce((sum, row) => sum + row.totalComision, 0);

    return (
      <div className="overflow-x-auto border border-gray-300">
        <table className="min-w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                Fecha expedición
              </th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Ramo</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Compañía</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap"># Póliza</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Anexo</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Asegurado</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Placa</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                Prima sin IVA
              </th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                % Com. GA
              </th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Com. GA</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">Impuestos</th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                Com. neta
              </th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                {participationHeader}
              </th>
              <th className="border border-gray-300 px-1 py-1 whitespace-nowrap">
                {totalComisionHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._print_id}>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.fecha_expedicion || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.ramo || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.aseguradora || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap w-[90px]">
                  {row.poliza || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.anexo || "0"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.asegurado || row.nombre_tomador || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">
                  {row.placa || "N/A"}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-right whitespace-nowrap">
                  {formatCOP(row.primaSinIva)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">{`${formatPct(row.gaPct)}%`}</td>
                <td className="border border-gray-300 px-1 py-1 text-right whitespace-nowrap">
                  {formatCOP(row.comisionGA)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-right whitespace-nowrap">
                  {formatCOP(row.impuestos)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-right whitespace-nowrap">
                  {formatCOP(row.comisionNeta)}
                </td>
                <td className="border border-gray-300 px-1 py-1 text-center whitespace-nowrap">{`${formatPct(row.participationPct)}%`}</td>
                <td className="border border-gray-300 px-1 py-1 text-right whitespace-nowrap">
                  {formatCOP(row.totalComision)}
                </td>
              </tr>
            ))}
            {showFooterTotal && (
              <tr className="font-semibold bg-gray-50">
                <td
                  colSpan={13}
                  className="border border-gray-300 px-2 py-2 text-right"
                >
                  Total
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right">
                  {formatCOP(totalTable)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white relative" ref={pdfRef}>
      <style>{`
        @page { size: A4 landscape; margin: 0mm; }
        @media print {
          .page-break { break-after: page; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          table { border-collapse: collapse; }
          table, tr, th, td { 
            break-inside: avoid; 
            page-break-inside: avoid; 
            padding: 1px !important;
            margin: 0 !important;
            font-size: 9px !important;
            line-height: 1 !important;
          }
          th, td {
            height: auto !important;
            vertical-align: middle !important;
          }
        }
        .wm-anulada{
          position: fixed;
          top: 50vh; left:50vw;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 120pt; font-weight: 900; letter-spacing: 8px;
          text-transform: uppercase; color: #dc2626; opacity: 0.10;
          z-index: 1; pointer-events:none; user-select:none; white-space:nowrap;
        }
      `}</style>

      {isAnulada && (
        <div aria-hidden className="wm-anulada">
          ANULADA
        </div>
      )}

      <header className="px-8 flex flex-row pt-4 justify-between relative">
        <div className="flex items-center gap-4 mt-9">
          <div className="flex flex-col">
            <img src={LogoGA} alt="Logo" className="h-12 w-40" />
            <div className="flex flex-col pt-2">
              <span className="h-[16px] text-gray-500">
                NIT: 900.600.470 - 8
              </span>
              <span className="h-[16px] text-gray-500">
                Calle 70 # 7T2 - 16
              </span>
              <span className="h-[14px] text-gray-500">3156091204</span>
            </div>
            {usuario && !isExternalLiquidacion && (
              <div className="flex gap-2 items-center pt-5">
                <span>Asesor:</span>
                <input
                  className="text-md border-[1px] w-40 border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={`${usuario}`}
                  readOnly
                />
                <span className="text-gray-600 ml-4">Periodo:</span>
                <input
                  className="text-md border-[1px] w-56 border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2 text-center"
                  value={periodo}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex items-center justify-center">
          <div className="flex flex-col border border-gray-300 p-2 text-lg rounded-lg">
            <p className="uppercase text-center text-[12px]">
              {isExternalLiquidacion
                ? "liquidación participación polizas generales - grupo asistencia"
                : `liquidación de comisiones - ${usuario}`}
            </p>
          </div>
        </div>

        <div
          className="flex flex-col gap-2 items-center justify-center"
          data-html2canvas-ignore="true"
        >
          <div className="flex flex-row gap-6 w-full justify-center no-print">
            <button
              type="button"
              title="Enviar por correo (pendiente)"
              className="p-1 rounded hover:bg-gray-100"
            >
              <MdAttachEmail size={40} className="text-lime-9000" />
            </button>
            <button
              type="button"
              title="Descargar PDF"
              onClick={handlePrint}
              className="p-1 rounded hover:bg-gray-100"
            >
              <IoIosCloudDownload size={40} className="text-lime-9000" />
            </button>
          </div>
          <div
            className={`flex flex-col gap-1 mt-6 ${isExternalLiquidacion ? "hidden" : "visible"}`}
          >
            <div
              style={{
                fontSize: 12,
                fontFamily: "Helvetica",
                lineHeight: "1.2",
              }}
            >
              Generado el: {new Date().toLocaleDateString()}
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "Helvetica",
                lineHeight: "1.2",
              }}
            >
              Liquidación #: {id_liquidacion || 0}
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 py-6 space-y-10 relative z-10">
        {isExternalLiquidacion ? (
          <>
            <section className="space-y-3">
              {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]"> */}
              <div className="flex flex-row gap-5 text-[12px] justify-between">
                <div className="flex gap-2 items-center flex-1">
                  <span>Asesor:</span>
                  <input
                    className="text-md border-[1px] w-40 border-gray-300 text-gray-900 focus:outline-none h-[28px] rounded-md p-2"
                    value={`${usuario}`}
                    readOnly
                  />
                </div>
                <div className="flex gap-2 items-center flex-1">
                  <span className="text-gray-600">Periodo:</span>
                  <input
                    className="text-md border-[1px] w-30 border-gray-300 text-gray-900 focus:outline-none h-[28px] rounded-md p-2 text-center"
                    value={periodo}
                    readOnly
                  />
                </div>
                <div className="flex items-center flex-1 justify-center gap-2">
                  <span className="text-gray-600">Unidad de negocio</span>
                  <input
                    readOnly
                    value={unitInfo.unitLabel}
                    className="h-[28px] border border-gray-300 px-2 rounded w-[65%]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className="text-gray-600"># Negocios nuevos</span>
                  <input
                    readOnly
                    value={externalSummary.negociosNuevos}
                    className="h-[28px] border border-gray-300 px-2 rounded w-[20%]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-600">% Comisión</span>
                  <input
                    readOnly
                    value={
                      externalSummary.participationPct == null
                        ? "Variable"
                        : `${formatPct(externalSummary.participationPct)}%`
                    }
                    className="h-[28px] border border-gray-300 px-2 rounded w-[40%]"
                  />
                </div>
                <div className="flex flex-col items-end gap-0 flex-1">
                  <div>
                    Generado el: {new Date().toLocaleDateString("es-CO")}
                  </div>
                  <div>Liquidación #: {id_liquidacion || 0}</div>
                </div>
              </div>

              {renderExternalTable(activePrintRows)}
            </section>

            <section className="space-y-2">
              <div className="flex justify-end gap-2 items-center text-[12px]">
                <span className="text-gray-600"># negocios cancelados</span>
                <input
                  readOnly
                  value={externalSummary.negociosCancelados}
                  className="h-[28px] border border-gray-300 px-2 rounded w-24"
                />
              </div>
              {renderExternalTable(cancelledPrintRows)}
            </section>
          </>
        ) : (
          sections.map((sec, idx) => {
            // Para todas menos la última: paginación normal.
            // Para la última: dejamos hueco para que quepa el total.
            const pages =
              idx === lastIdx
                ? paginateWithReserveOnLast(
                    sec.rows,
                    ROWS_PER_PRINT_PAGE,
                    RESERVE_ROWS_FOR_SUMMARY,
                  )
                : paginate(sec.rows, ROWS_PER_PRINT_PAGE);

            return pages.map((pageRows, p) => (
              <section
                key={`${sec.key}-${p}`}
                className={`print-keep ${
                  p < pages.length - 1 ? "page-break" : ""
                }`}
              >
                <h2 className="text-lg font-semibold mb-2">{sec.title}</h2>
                <TableDirectos
                  classname="w-full"
                  headers={
                    sec.key === "directos"
                      ? headersDirectos
                      : sec.key === "asesor10"
                        ? headersAsesor10
                        : sec.key === "asesorGanador"
                          ? headersAsesorGanador
                          : sec.key === "asesorFreelance"
                            ? headersAsesorFreelance
                            : sec.key === "cancelaciones"
                              ? headersCancelaciones
                              : []
                  }
                  data={pageRows}
                  readOnly
                  title={sec.title}
                  from=""
                  headerColor="bg-blue-300 border-blue-300"
                />
              </section>
            ));
          })
        )}

        {/* Bloque final: ya NO forzamos nueva hoja; irá en la misma si hay espacio */}
        <section className="print-keep" style={{ marginTop: 8 }}>
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-end">
              <p className="text-[12px] text-gray-600">
                Liquidación generada por:{" "}
                <span className="uppercase font-bold">{emisor_liquidacion}</span>
              </p>
            </div>

                        <div className="ml-auto grid  grid-cols-[150px_75px] gap-x-3 gap-y-1 rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-sm">
              {/* <span className="font-medium text-gray-600">
                Total prima sin IVA
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalPrimas)}
              </span>
              <span className="font-medium text-gray-600">
                Total comision GA
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionGA)}
              </span>
              <span className="font-medium text-gray-600">
                Total impuestos aseg
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalImpuestos)}
              </span>
              <span className="font-medium text-gray-600">
                Total comision neta
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionNeta)}
              </span>

              <hr className="col-span-2 border-gray-300" /> */}

              <span className="font-medium text-gray-600 text-right">
                Total antes de impuestos
              </span>
              {/* <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.totalComisionFreelance)}
              </span> */}
              <input className="text-center font-semibold text-gray-900 border-[1px] border-gray-300" value={formatCOP(printSummary.totalComisionFreelance)} />
              <span className="font-medium text-gray-600 text-right">IVA</span>
              {/* <span className="text-right font-semibold text-gray-900">
                {formatCOP(
                  summary?.iva19 == 0 || summary?.iva19 == null
                    ? settlementData?.responsable_iva === "1"
                      ? summary?.totalComisionFreelance * 0.19
                      : 0
                    : summary?.iva19,
                )}
              </span> */}
              <input className="text-center font-semibold text-gray-900 border-[1px] border-gray-300" value={formatCOP(printSummary?.iva19 === 0 || printSummary?.iva19 == null ? (settlementData?.responsable_iva === "1" ? printSummary?.totalComisionFreelance * 0.19 : 0) : printSummary?.iva19)} />
              <span className="font-medium text-gray-600 text-right">
                Retenciones
                {/* {summary.retencionesPorcentaje} */}
                
              </span>
              {/* <span className="text-right font-semibold text-gray-900">
                {formatCOP(summary.retencionesValue)}
              </span> */}
              <input className="text-center font-semibold text-gray-900 border-[1px] border-gray-300" value={formatCOP(printSummary.retencionesValue)} />
              

              <hr className="col-span-2 border-gray-300" />

              <span className="font-medium text-gray-600 text-right">Valor total a pagar</span>
              {/* <span className="text-right text-base font-bold text-gray-900">
                {formatCOP(summary.totalAPagar)}
              </span> */}
              <input className="text-center font-semibold text-gray-900 border-[1px] border-gray-300" value={formatCOP(printSummary.totalAPagar)} />
            </div>

            {/* <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 border border-gray-300 rounded-lg bg-gray-50 text-[12px] w-[400px]">
              <span className="font-medium text-gray-600">Total prima sin IVA</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.totalPrimas)}
              </span>
              <span className="font-medium text-gray-600">Total comisión GA</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.totalComisionGA)}
              </span>
              <span className="font-medium text-gray-600">Total impuestos aseguradora</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.totalImpuestos)}
              </span>
              <span className="font-medium text-gray-600">Total comisión neta</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.totalComisionNeta)}
              </span>

              <hr className="col-span-2 border-gray-300" />

              <span className="font-medium text-gray-600">Total comisión freelance</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.totalComisionFreelance)}
              </span>
              <span className="font-medium text-gray-600">IVA (19%)</span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.iva19)}
              </span>
              <span className="font-medium text-gray-600">
                Retenciones ({printSummary.retencionesPorcentaje}%)
              </span>
              <span className="text-right font-semibold text-gray-900">
                {formatCOP(printSummary.retencionesValue)}
              </span>

              <hr className="col-span-2 border-gray-300" />

              <span className="font-semibold text-gray-800">Total a pagar</span>
              <span className="text-right text-base font-bold text-gray-900">
                {formatCOP(printSummary.totalAPagar)}
              </span>
            </div> */}
          </div>

          {/* <div className="w-full">
            <div
              className="adjust-total flex flex-row gap-3 justify-end text-right font-bold text-[14.5px]"
              style={{ marginRight: "24px" }}
            >
              <span>Total a pagar:</span>
              <span className="text-right">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }).format(
                  isExternalLiquidacion
                    ? printSummary.totalAPagar
                    : effectiveTotalPagar
                )}
              </span>
            </div>
          </div> */}
          {/* <ul style={{ marginTop: 5, listStyleType: "disc", paddingLeft: 12 }}>
            <li style={{ marginTop: 5 }}>
              La participación se calcula sobre las comisiones netas promedio de
              la agencia (después de impuestos).
            </li>
            <li className="break-words" style={{ marginTop: 5 }}>
              Enviar cuenta de cobro o factura electrónica al correo{" "}
              <b>administracion@grupoasistencia.com</b>, adjuntando copia del
              RUT, cédula, la liquidación enviada y certificación bancaria en un
              solo PDF.
            </li>
            <li className="break-words" style={{ marginTop: 5 }}>
              Tener en cuenta que al valor total de la liquidación se le
              aplicarán las retenciones a las que haya lugar de acuerdo a la
              información que se encuentre registrada en el RUT.
            </li>
          </ul> */}
        </section>
      </main>
    </div>
  );
}
