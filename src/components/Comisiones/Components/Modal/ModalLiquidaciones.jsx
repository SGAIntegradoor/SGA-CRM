import { useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { GeneralBox } from "../../../GeneralBox/GeneralBox";
import { NavContext } from "../../../../context/NavContext";
import BtnGeneral from "../../../BtnGeneral/BtnGeneral";
import { useNavigate } from "react-router-dom";
import { TableDirectos } from "../Tables/TableDirectos";
import { createSettlement } from "../../../../services/Settlements/createSettlement";
import { updateSettlement } from "../../../../services/Settlements/updateSettlement";

const ModalLiquidaciones = ({
  show,
  onClose,
  selectedPolizas,
  setIsLoading,
  handleReloadPolizas,
  handlerCleanModal,
  mode = "create",
  settlementId = null,
  settlementData = null,
  onRemovePoliza = () => {},
  onSuccess = () => {},
}) => {
  const cmpPolizaAnexo = (a, b) => {
    const s = (v) => (v == null ? "" : String(v).trim());
    const byPoliza = s(a.id).localeCompare(s(b.id), undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (byPoliza !== 0) return byPoliza;
    return s(a.id).localeCompare(s(b.id), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  const {} = useContext(NavContext);
  const nav = useNavigate();
  const hadSelectedPolizasRef = useRef(selectedPolizas.length > 0);
  const [id, setId] = useState(0);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  useEffect(() => {
    if (selectedPolizas.length > 0) {
      hadSelectedPolizasRef.current = true;
      return;
    }

    if (hadSelectedPolizasRef.current) {
      onClose?.();
      return;
    }

    if (show !== false) {
      Swal.fire("Error", "No hay pólizas seleccionadas", "error").then(() => {
        onClose?.();
      });
    }
  }, [selectedPolizas, onClose, show]);

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",
    padding: "24px",
    zIndex: "110 !important",
  };

  const panelStyle = {
    position: "relative",
    maxWidth: "1300px",
    width: "100%",
  };

  const headersAsesorFreelance = [
    "id",
    "Fecha de expedición",
    "Ramo",
    "Aseguradora",
    "Poliza",
    "Anexo",
    "Asegurado",
    "Identificación Asegurado",
    "Placa",
    "Prima sin IVA + asistencia",
    "Asesor Freelance",
    "Tipo expedición",
    "% Comisión",
    "Total Comisión",
    "Accion",
  ];

  const headersDirectos = [
    "id",
    "Fecha de expedición",
    "Ramo",
    "Aseguradora",
    "Poliza",
    "Anexo",
    "Asegurado",
    "Identificación Asegurado",
    "Placa",
    "Prima sin IVA + asistencia",
    // "Asesor Freelance",
    "Tipo expedición",
    "% Comisión",
    "Total Comisión",
    "Accion",
  ];

  const [tablesPolizas, setTablesPolizas] = useState({
    directos: [],
    asesor10: [],
    asesorGanador: [],
    asesorFreelance: [],
    cancelaciones: [],
    modificaciones: [],
  });
  const [headersTables, setHeadersTables] = useState({
    directos: headersDirectos,
    asesor10: headersAsesorFreelance,
    asesorGanador: headersAsesorFreelance,
    asesorFreelance: headersAsesorFreelance,
    cancelaciones: headersAsesorFreelance,
    modificaciones: headersAsesorFreelance,
  });

  const [editedTables, setEditedTables] = useState({});

 useEffect(() => {
  if (selectedPolizas.length === 0) return;

  const sourcePolizas = selectedPolizas;

  const newTables = {
    directos: [],
    asesor10: [],
    negociosDirectos: [],
    asesorFreelance: [],
    asesorGanador: [],
    cancelaciones: [],
    modificaciones: [],
  };

  // contador local para asignar ID de fila de forma determinista
  let localId = 1;

  sourcePolizas.forEach((poliza) => {
    if (poliza.tipo === "directo") {
      newTables.directos.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        asesor_freelance: poliza.asesor_freelance,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    } else if (
      poliza.asesor_10 !== "N/A" &&
      poliza.tipo_expedicion !== "Cancelación"
    ) {
      newTables.asesor10.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        asesor_freelance: poliza.asesor_freelance,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    } else if (
      poliza.asesor_ganador !== "N/A" &&
      poliza.tipo_expedicion !== "Cancelación"
    ) {
      newTables.asesorGanador.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        asesor_freelance: poliza.asesor_freelance,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    } else if (
      poliza.asesor_freelance !== "N/A" &&
      poliza.tipo_expedicion !== "Cancelación"
    ) {
      newTables.asesorFreelance.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        asesor_freelance: poliza.asesor_freelance,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    } else if (poliza.tipo_expedicion === "Cancelación") {
      newTables.cancelaciones.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        asesor_freelance: poliza.asesor_freelance,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    } else if (
      poliza.asesor_ganador == "N/A" &&
      poliza.asesor_10 == "N/A" &&
      poliza.asesor_freelance == "N/A" &&
      poliza.tipo_expedicion !== "Cancelación"
    ) {
      newTables.directos.push({
        id: localId++,
        id_poliza: poliza.id_poliza,
        anexo: poliza.anexo,
        aseguradora: poliza.aseguradora,
        id_anexo_poliza: poliza.id_anexo_poliza,
        fecha_expedicion: poliza.fecha_expedicion,
        ramo: poliza.ramo,
        poliza: poliza.poliza,
        asegurado: poliza.asegurado,
        identificacion_asegurado: poliza.identificacion_asegurado,
        placa: poliza.placa,
        prima_sin_iva_asistencia: poliza.prima_sin_iva_asistencia,
        forma_de_pago: poliza.forma_de_pago,
        usuario_sga: poliza.usuario_sga,
        usuario_sga_documento: poliza.usuario_sga_documento,
        asesor_10: poliza.asesor_10,
        asesor_ganador: poliza.asesor_ganador,
        porcentaje_comision_decimal: poliza.porcentaje_comision_decimal,
        porcentaje_comision_pct: poliza.porcentaje_comision_pct,
        valor_a_reversar: poliza.valor_a_reversar,
        valor_comision: poliza.valor_comision,
        estado_liquidacion: poliza.estado_liquidacion,
        tipo_expedicion: poliza.tipo_expedicion,
        porcentaje_comision: poliza.porcentaje_comision_pct,
        total_comision: poliza.valor_comision,
        seleccionado: poliza.seleccionado,
      });
    }
  });

  // ordenar cada tabla
  Object.keys(newTables).forEach((k) => newTables[k].sort(cmpPolizaAnexo));

  // actualizar estados en un solo paso
  setTablesPolizas(newTables);
  setHeadersTables({
    directos: headersDirectos,
    asesor10: headersDirectos,
    asesorGanador: headersDirectos,
    asesorFreelance: headersAsesorFreelance,
    cancelaciones: headersAsesorFreelance,
    modificaciones: headersAsesorFreelance,
  });
  setEditedTables({});
  // actualizar estado id con el último localId asignado (opcional)
  setId(localId - 1);
}, [selectedPolizas]);

  const handleRemoveFromModal = async (poliza) => {
    const removed = await onRemovePoliza?.(poliza);
    if (removed === false) {
      return;
    }
  };

  const nombresTablas = {
    asesor10: "Asesor 10",
    asesorGanador: "Asesor Ganador",
    asesorFreelance: "Asesor Freelance",
    cancelaciones: "Cancelaciones",
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

  const userData = JSON.parse(localStorage.getItem("userData"));
  const hasSelectedPolizas = selectedPolizas.length > 0;

  if (!hasSelectedPolizas) return null;

  const handleSaveSettlement = async (estado = "Por pagar") => {
    const liquidacion = {
      id_liquidacion: settlementId,
      usuario_sga: selectedPolizas[0]?.usuario_sga || "Sistema",
      identificacion_usuario_sga:
        selectedPolizas[0]?.usuario_sga_documento || "N/A",
      observaciones:
        settlementData?.observaciones || "Liquidación generada desde frontend",
      nombre_emisor_liq: userData?.nombre + " " + userData?.apellido,
      cc_emisor_liq: userData?.documento,
      estado: estado,
    };

    // Filas editadas si existen; si no, usa originales
    const detallesCrudos = Object.keys(tablesPolizas).flatMap((k) =>
      editedTables[k]?.length ? editedTables[k] : tablesPolizas[k]
    );

    const detalles = detallesCrudos.map((r) => {
      const limpio = { ...r };

      // 1) % en UI (0.09 = 0.09%)
      const pctUI =
        limpio.porcentaje_comision != null
          ? Number(limpio.porcentaje_comision) || 0
          : Number(limpio.porcentaje_comision_pct ?? 0) || 0;

      // -> lo que espera backend (fracción)
      const pctFrac = pctUI / 100;

      // 2) base numérica (entero COP)
      const baseNum =
        typeof r.__baseNum === "number" &&
        isFinite(r.__baseNum) &&
        r.__baseNum > 0
          ? Math.round(r.__baseNum)
          : Math.round(toNumberCOP(r.prima_sin_iva_asistencia ?? r.base ?? 0));

      // 3) total: si NO es cancelación, recalcúlalo; si es cancelación, respeta
      const isCancel =
        String(r.tipo_expedicion).toLowerCase() === "cancelación";
      let totalNum;
      if (isCancel) {
        const back = toNumberCOP(
          limpio.total_comision ?? limpio.valor_comision
        );
        totalNum = Math.round(back || 0);
      } else {
        totalNum = Math.round(baseNum * pctFrac);
      }

      // 4) set de campos consistentes para backend + impresión posterior
      limpio.porcentaje_comision_pct = pctUI; // 0.09 (unidades de %)
      limpio.porcentaje_comision = pctFrac; // 0.00090 (fracción)
      limpio.porcentaje_comision_decimal = pctFrac.toFixed(5); // "0.00090"
      limpio.prima_sin_iva_asistencia = baseNum; // entero
      limpio.total_comision = totalNum; // entero
      limpio.valor_comision = totalNum; // espejo

      // limpia internos
      delete limpio.__baseNum;
      delete limpio.__isNA;

      return limpio;
    });

    liquidacion.valor_liquidacion_total = Math.round(
      detalles.reduce((acc, r) => {
        const v =
          typeof r.total_comision === "number"
            ? r.total_comision
            : toNumberCOP(r.total_comision ?? r.valor_comision ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0)
    );

    const body = {
      ...liquidacion,
      detalles,
    };

    const response =
      mode === "update"
        ? await updateSettlement(body)
        : await createSettlement(body);

    const idLiquidacion =
      response?.id_liquidacion ??
      response?.data?.id_liquidacion ??
      response?.liquidacion?.id_liquidacion ??
      null;

    if (idLiquidacion) return idLiquidacion;
    return null;
  };

  const content = (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <GeneralBox
          titulo="Liquidación de comisiones"
          textButton={["X"]}
          width={"w-full"}
          onClose={onClose}
          classname={"shadow-lg"}
        >
          <div className="bg-white rounded-b-xl pl-4 pr-7 pb-6 pt-3 w-full">
            {/* Usuario */}
            <section className="flex flex-row justify-start items-center gap-3 mt-14 mb-14 pl-5">
              <p className="text-[17px]">Usuario: </p>
              <input
                type="text"
                name="inptUser"
                className="text-md border-[1px]  border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                value={selectedPolizas[0].usuario_sga || ""}
                disabled
              />
            </section>

            {Object.keys(tablesPolizas).map((table, index) => {
              if (tablesPolizas[table].length === 0) return null;
              return (
                <section key={index}>
                  <p className="font-semibold text-lg mb-2">
                    {{
                      directos: "Negocios Directos",
                      asesor10: "Asesor 10",
                      asesorGanador: "Asesor Ganador",
                      asesorFreelance: "Asesor Freelance",
                      cancelaciones: "Cancelaciones",
                    }[table] ?? table}
                  </p>
                  <TableDirectos
                    classname="w-full"
                    headerColor="bg-blue-500"
                    headers={headersTables[table] || headersAsesorFreelance}
                    data={tablesPolizas[table]}
                    from="modal"
                    onRemoveRow={handleRemoveFromModal}
                    onRowsChange={(rowsActualizadas) => {
                      setEditedTables((prev) => {
                        const prevRows = prev[table];
                        if (prevRows === rowsActualizadas) return prev;
                        if (
                          Array.isArray(prevRows) &&
                          prevRows.length === rowsActualizadas.length &&
                          prevRows.every((r, i) => r === rowsActualizadas[i])
                        ) {
                          return prev;
                        }
                        return { ...prev, [table]: rowsActualizadas };
                      });
                    }}
                  />
                </section>
              );
            })}

            <section className="flex justify-end items-center gap-2 mt-14">
              <BtnGeneral
                funct={onClose}
                className={
                  "bg-gray-300 text-black border-gray-600 py-[7.5px] px-10 border-0 rounded hover:bg-gray-400 transition duration-300 ease-in-out"
                }
              >
                Cerrar
              </BtnGeneral>
              <BtnGeneral
                funct={async () => {
                  const win = window.open("", "_blank");
                  try {
                    const id = await handleSaveSettlement();
                    if (id && win) {
                      const url = new URL(
                        `crm1/comisiones/liquidacion/impresion?id_liquidacion=${encodeURIComponent(
                          id
                        )}`,
                        window.location.origin
                      ).href;
                      handlerCleanModal?.();
                      await handleReloadPolizas?.();
                      await onSuccess?.(id);
                      onClose();
                      win.opener = null;
                      win.location.href = url;
                    } else {
                      win && win.close();
                      Swal.fire(
                        "Error",
                        mode === "update"
                          ? "No se pudo actualizar la liquidación. Intente nuevamente."
                          : "No se pudo generar la liquidación. Intente nuevamente.",
                        "error",
                      );
                    }
                  } catch (err) {
                    win && win.close();
                    console.error(err);
                  }
                }}
                className={
                  "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
              >
                {mode === "update" ? "Actualizar Liquidación" : "Generar Liquidación"}
              </BtnGeneral>
              <BtnGeneral
                funct={async () => {
                  try {
                    const id = await handleSaveSettlement("Borrador");
                    if (id) {
                      handlerCleanModal?.();
                      await handleReloadPolizas?.();
                      await onSuccess?.(id);
                      onClose();
                    } else {
                      Swal.fire(
                        "Error",
                        mode === "update"
                          ? "No se pudo actualizar el borrador. Intente nuevamente."
                          : "No se pudo generar el borrador. Intente nuevamente.",
                        "error",
                      );
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={
                  "bg-black text-white px-10 h-[35px] m-[2px] rounded hover:bg-gray-800 transition duration-300 ease-in-out"
                }
              >
                {mode === "update" ? "Guardar Borrador" : "Generar Borrador"}
              </BtnGeneral>
            </section>
          </div>
        </GeneralBox>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ModalLiquidaciones;
