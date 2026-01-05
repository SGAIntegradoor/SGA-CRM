import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TableDirectos } from "../../../components/Comisiones/Components/Tables/TableDirectos";
import { IoIosCloudDownload } from "react-icons/io";
import { MdAttachEmail } from "react-icons/md";
import { getSettlement } from "../../../services/Settlements/getSettlement";
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

export default function LiquidacionImpresion() {
  const location = useLocation();
  const nav = useNavigate();

  const query = new URLSearchParams(location.search);
  const id_liquidacion = query.get("id_liquidacion");

  const [loading, setLoading] = useState(true);
  const [liquidacion, setLiquidacion] = useState(null);
  const [detalles, setDetalles] = useState([]);

  const state = location.state;
  const usuario = state?.usuario || (detalles[0]?.usuario_sga ?? "");
  const emisor_liquidacion = liquidacion?.nombre_emisor_liq;

  const pdfRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id_liquidacion) return;
      const res = await getSettlement(id_liquidacion);
      if (res?.status === "Ok") {
        setLiquidacion(res.liquidacion);
        setDetalles(res.detalles);
      }
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
        poliza.prima_sin_iva_asistencia ?? poliza.base ?? 0
      );
      const isCancel =
        String(poliza.tipo_expedicion).toLowerCase() === "cancelación";

      const totalBack = toNumberCOP(
        poliza.total_comision ?? poliza.valor_comision
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

  return (
    <div className="min-h-screen bg-white relative" ref={pdfRef}>
      <style>{`
        @media print {
          .page-break { break-after: page; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          table, tr, th, td { break-inside: avoid; page-break-inside: avoid; }
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

      <header className="px-8 flex flex-row pt-4 justify-between">
        <div className="flex items-center gap-4 mt-9">
          <div className="flex flex-col">
            <img src={LogoGA} alt="Logo" className="h-12 w-44" />
            <div className="flex flex-col pt-2">
              <span className="h-[16px] text-gray-500">
                NIT: 900.600.470 - 8
              </span>
              <span className="h-[16px] text-gray-500">
                Calle 70 # 7T2 - 16
              </span>
              <span className="h-[14px] text-gray-500">3156091204</span>
            </div>
            {usuario && (
              <div className="flex gap-2 items-center pt-5">
                <span>Asesor:</span>
                <input
                  className="text-md border-[1px] w-36 border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={`${usuario}`}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-[-40px] ml-[-30px]">
          <div className="flex flex-col border border-gray-300 p-2 text-lg rounded-lg">
            <p className="uppercase text-center text-[12px]">
              liquidación de comisiones - {usuario}
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
          <div className="flex flex-col gap-1 mt-6">
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
        {sections.map((sec, idx) => {
          // Para todas menos la última: paginación normal.
          // Para la última: dejamos hueco para que quepa el total.
          const pages =
            idx === lastIdx
              ? paginateWithReserveOnLast(
                  sec.rows,
                  ROWS_PER_PRINT_PAGE,
                  RESERVE_ROWS_FOR_SUMMARY
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
        })}

        {/* Bloque final: ya NO forzamos nueva hoja; irá en la misma si hay espacio */}
        <section className="print-keep" style={{ marginTop: 8 }}>
          <div className="w-full">
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
                }).format(totalPagar)}
              </span>
            </div>
          </div>

          <p className="mt-2">
            Liquidación generada por:{" "}
            <span className="uppercase font-bold">{emisor_liquidacion}</span>
          </p>
          <ul style={{ marginTop: 5, listStyleType: "disc", paddingLeft: 12 }}>
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
          </ul>
        </section>
      </main>
    </div>
  );
}
