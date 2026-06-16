import { useState, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import { NavContext } from "../../context/NavContext";
import Loader from "../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import { TableComisiones } from "../../components/Comisiones/TablaComisiones";
import { getPolizas } from "../../services/Polizas/getPolizas";
import { selectPoliza } from "../../services/Comisiones/selectPoliza";
import { selectPolizaBatch } from "../../services/Comisiones/selectPolizaBatch";
import Swal from "sweetalert2";
import { FiChevronDown, FiChevronUp } from "react-icons/fi"; // <<< NUEVO
import ModalLiquidaciones from "../../components/Comisiones/Components/Modal/ModalLiquidaciones";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getAsesoresSGA } from "../../services/Users/getAsesoresSGA";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getTiposPoliza } from "../../services/Polizas/getTiposPoliza";
import { TableAdminLiq } from "../../components/Comisiones/Components/Tables/TableAdminLiq";
import { getPreSettlements } from "../../services/Settlements/getPreSettlements";

export const Comisiones = ({ setLoading, loading }) => {
  const initialState = {
    unidadnegocio: "",
    usuario: "",
    aseguradora: "",
    ramo: "",
    tiponegocio: "",
    tipoexpedicion: "",
    fechainiciovigdesde: "",
    fechafinvighasta: "",
    estadoliquidacion: "",
  };

  const [polizas, setPolizas] = useState([]);
  const [appersBox, setAppersBox] = useState(false);
  const [formStates, setFormStates] = useState(initialState);

  const [reloadScreen, setReloadScreen] = useState(false);
  const [selectedPolizas, setSelectedPolizas] = useState([]);
  const [liquidacionModal, setLiquidacionModal] = useState(false);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [liqAdminData, setLiqAdminData] = useState([]);
  const [usuariosInput, setUsuariosInput] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);

  const handlerLoadUnidadesNegocio = async () => {
    try {
      const rows = await getUnidadesNegocio();
      setUnidadesNegocio(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Error en la carga de unidades de negocio", e);
    }
  };

  const handlerLoadFilterUsuarios = async (unidad) => {
    try {
      const [internalData, externalData] = await Promise.all([
        getAsesoresSGA(unidad || null, "internal"),
        getAsesoresSGA(unidad || null, "external"),
      ]);
      const internals = Array.isArray(internalData) ? internalData : [];
      const externals = Array.isArray(externalData) ? externalData : [];
      const merged = [...internals, ...externals];
      const unique = merged.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.value === item.value),
      );
      setUsuariosInput(unique);
    } catch (e) {
      console.error("Error en la carga de usuarios", e);
    }
  };

  const handlerLoaderAseguradoras = async () => {
    try {
      const data = await obtenerAseguradoras();
      setAseguradoras(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de aseguradoras", e);
    }
  };

  const handlerLoadTiposExpedicion = async () => {
    try {
      const data = await getTiposPoliza();
      setTiposExpedicion(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de tipos de expedicion", e);
    }
  };

  const handlerLoadRamo = async () => {
    try {
      const data = await obtenerRamo();
      setRamos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de ramo", e);
    }
  };

  const handlerGetLiqAdmin = async () => {
    try {
      const data = await getPreSettlements();
      let preTreated = [];
      if (Array.isArray(data)) {
        preTreated = data.filter((item) => item.usuario_data?.rol != "19");
      }
      setLiqAdminData(preTreated);
    } catch (e) {
      console.error("Error en la carga de liquidaciones", e);
      setLiqAdminData([]);
    }
  };

  const handlerLoadPolizasUser = async () => {
    setSelectedPolizas([]);
    setPolizas([]);
    // if (formStates.unidadnegocio === "") {
    //   // Swal.fire("Error", "Debe seleccionar una unidad de negocio", "error");
    //   // return;
    // }
    if (formStates.usuario === "") {
      Swal.fire("Error", "Debe seleccionar un usuario", "warning");
      return;
    }

    if (formStates.unidadnegocio === "" && formStates.usuario !== "67038128") {
      Swal.fire("Aviso", "Debe seleccionar una unidad de negocio", "warning");
      return;
    }

    if (
      formStates.fechainiciovigdesde &&
      formStates.fechafinvighasta &&
      formStates.fechainiciovigdesde > formStates.fechafinvighasta
    ) {
      Swal.fire(
        "Aviso",
        "La fecha de inicio no puede ser mayor a la fecha de fin",
        "warning",
      );
      return;
    } else if (
      formStates.fechainiciovigdesde &&
      formStates.fechafinvighasta &&
      formStates.fechafinvighasta < formStates.fechainiciovigdesde
    ) {
      Swal.fire(
        "Aviso",
        "La fecha de fin no puede ser menor a la fecha de inicio",
        "warning",
      );
      return;
    } else if (
      formStates.fechainiciovigdesde == "" ||
      formStates.fechafinvighasta == ""
    ) {
      Swal.fire("Aviso", "Se debe indicar el periodo a liquidar", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await getPolizas(formStates);
      const rows = Array.isArray(data) ? data : [];

      if (rows.length === 0) {
        setPolizas([]);
        Swal.fire(
          "Error",
          "No se encontraron polizas para el usuario",
          "error",
        );
        return;
      }

      setPolizas(rows);
    } catch (e) {
      console.error("Error en la consulta de polizas", e);
      Swal.fire("Error", "No fue posible consultar las polizas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          handlerLoadUnidadesNegocio(),
          handlerLoaderAseguradoras(),
          handlerLoadFilterUsuarios(null),
          handlerLoadRamo(),
          handlerLoadTiposExpedicion(),
          handlerGetLiqAdmin(),
        ]);
      } catch (error) {
        console.error("Error en la carga inicial", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    handlerLoadUnidadesNegocio();
  }, [reloadScreen]);

  useEffect(() => {
    handlerLoadFilterUsuarios(formStates.unidadnegocio || null);
    setSelectedPolizas([]);
    setPolizas([]);
  }, [formStates.unidadnegocio]);

  useEffect(() => {
    setSelectedPolizas([]);
    setPolizas([]);
  }, [formStates.usuario]);

  // cargar objeto con las polizas seleccionadas actualmente en la BD y asi renderizar el objeto o colocarlo cada que se carge la vista
  useEffect(() => {
    if (!Array.isArray(polizas) || polizas.length === 0) return;

    const isSelected = (v) => v === true || v === 1 || v === "1";

    const preselected = polizas
      .filter((p) => isSelected(p.seleccionado) || isSelected(p.seleccionada))
      .map((p) => ({
        id: p.id_anexo_poliza,
        ...p,
      }));

    setSelectedPolizas((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      preselected.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    });
  }, [polizas]);

  const handleToggleSelect = async (row, checked) => {
    const id = row.id_anexo_poliza;
    const next = typeof checked === "boolean" ? checked : !row.seleccionado;
    setPolizas((prev) =>
      prev.map((p) =>
        p.id_anexo_poliza === id ? { ...p, seleccionado: next } : p,
      ),
    );
    setSelectedPolizas((prev) =>
      next
        ? [
            ...prev,
            {
              id,
              ...row,
            },
          ]
        : prev.filter((p) => p.id !== id),
    );

    try {
      const res = await selectPoliza(id, next);
      if (res?.status !== "Ok") {
        throw new Error(res?.message || "Error al actualizar");
      } else {
      }
    } catch (err) {
      // Si falla → revertir
      setPolizas((prev) =>
        prev.map((p) =>
          p.id_anexo_poliza === id ? { ...p, seleccionado: !next } : p,
        ),
      );
      Swal.fire(
        "Error",
        err.message || "No se pudo actualizar la selección",
        "error",
      );
    }
  };

  const handleTogglePageSelect = async (rowsPage = [], checked) => {
    const ids = rowsPage
      .map((row) => row.id_anexo_poliza)
      .filter((id) => id !== undefined && id !== null);

    if (!ids.length) return;

    const idsSet = new Set(ids);
    const prevPolizas = polizas;
    const prevSelected = selectedPolizas;

    setPolizas((prev) =>
      prev.map((p) =>
        idsSet.has(p.id_anexo_poliza) ? { ...p, seleccionado: checked } : p,
      ),
    );

    setSelectedPolizas((prev) => {
      if (checked) {
        const byId = new Map(prev.map((x) => [x.id, x]));
        rowsPage.forEach((row) => {
          byId.set(row.id_anexo_poliza, {
            id: row.id_anexo_poliza,
            id_remision: row.id_remision,
            ...row,
            seleccionado: true,
          });
        });
        return Array.from(byId.values());
      }

      return prev.filter((p) => !idsSet.has(p.id));
    });

    try {
      const res = await selectPolizaBatch(ids, checked);
      if (res?.status !== "Ok") {
        throw new Error(
          res?.message || "Error actualizando selección por página",
        );
      }
    } catch (err) {
      setPolizas(prevPolizas);
      setSelectedPolizas(prevSelected);
      Swal.fire(
        "Error",
        err?.message || "No se pudo actualizar la selección por página",
        "error",
      );
      throw err;
    }
  };

  const headersAdminLiq = [
    { field: "id_liquidacion", header: "ID Liquidacion" },
    { field: "doc_usuario", header: "Doc Usuario" },
    { field: "nombre_usuario", header: "Usuario SGA" },
    { field: "fecha", header: "Fecha liquidacion" },
    { field: "estado", header: "Estado" },
    { field: "valor_total_comision", header: "Valor total comision" },
    // { field: "doc_liquidador", header: "Doc Liquidador" },
    { field: "nombre_emisor_liq", header: "Nombre emisor" },
    { field: "ids_anexos", header: "Remisiones liquidadas" },
    { field: "accion", header: "Accion" },
  ];

  const headers = [
    { field: "id_remision", header: "ID Remisión" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Póliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asist" },
    { field: "prima_neta", header: "Prima" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "fecha_inicio_vigencia", header: "Inicio Vig" },
    { field: "aseguradora", header: "Compañía" },
    {
      field: "tipo_expedicion",
      header: "Tipo",
      style: { color: "red" },
    },
    { field: "asesor_freelance", header: "Freelance" },
    { field: "usuario_sga", header: "Asesor SGA" },
    { field: "unidad_negocio", header: "Unidad Negocio" },
    { field: "forma_de_pago", header: "Forma Pago" },
    { field: "financiera", header: "Financiera" },
    { field: "cuotas", header: "Cuotas" },
    { field: "estado_cartera", header: "Estado Cartera" },
    { field: "analista_comercial", header: "Analista" },
    { field: "porcentaje_comision_decimal", header: "% Comisión" },
    { field: "valor_comision", header: "Valor Comisión" },
    { field: "estado_liquidacion", header: "Estado Liquidación" },
    { field: "fecha_generacion_liquidacion", header: "Fecha Gen. Liq." },
    { field: "fecha_pago_liquidacion", header: "Fecha Pago Liq." },
    { field: "observaciones", header: "Observaciones" },
    { field: "seleccionado", header: "Seleccionar" },
  ];

  const headersDirectos = [
    { field: "id_remision", header: "ID Remisión" },
    { field: "fecha_expedicion", header: "Fecha Exp" },
    { field: "ramo", header: "Ramo" },
    { field: "poliza", header: "# Póliza" },
    { field: "nombre_tomador", header: "Tomador" },
    { field: "documento_tomador", header: "Doc Tomador" },
    { field: "placa", header: "Placa" },
    { field: "asistencia", header: "Asist" },
    { field: "prima_neta", header: "Prima" },
    { field: "gastos_expedicion", header: "Gastos" },
    { field: "iva", header: "IVA" },
    { field: "valor_total", header: "Valor Total" },
    { field: "fecha_inicio_vigencia", header: "Inicio Vig" },
    { field: "aseguradora", header: "Compañía" },
    {
      field: "tipo_expedicion",
      header: "Tipo",
      style: { color: "red" },
    },
    { field: "usuario_sga", header: "Asesor SGA" },
    { field: "unidad_negocio", header: "Unidad Negocio" },
    { field: "forma_de_pago", header: "Forma Pago" },
    { field: "financiera", header: "Financiera" },
    { field: "cuotas", header: "Cuotas" },
    { field: "estado_cartera", header: "Estado Cartera" },
    { field: "analista_comercial", header: "Analista" },
    { field: "porcentaje_comision_decimal", header: "% Comisión" },
    { field: "valor_comision", header: "Valor Comisión" },
    { field: "estado_liquidacion", header: "Estado Liquidación" },
    { field: "fecha_generacion_liquidacion", header: "Fecha Gen. Liq." },
    { field: "fecha_pago_liquidacion", header: "Fecha Pago Liq." },
    { field: "observaciones", header: "Observaciones" },
    { field: "seleccionado", header: "Seleccionar" },
  ];

  const customNewStyles = {
    indicatorSeparator: () => ({
      display: "none",
    }),
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 35,
      fontSize: "14px",
      marginTop: 0,
      paddingTop: 0,
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: 0, // menos padding
      marginRight: 4, // opcional: separa de borde derecho
      cursor: "pointer",
      svg: { width: 12, height: 12 }, // achica el ícono
    }),
    indicatorsContainer: (base) => ({
      ...base,
      paddingRight: 4, // reduce el espacio del contenedor de íconos
      gap: 2, // compacta íconos (clear + dropdown)
    }),
    valueContainer: (base) => ({
      ...base,
      paddingRight: 4, // evita que la “x” empuje el texto
    }),
  };

  const stylesSingleLine = {
    control: (base) => ({
      ...base,
      minHeight: 35,
    }),
    valueContainer: (base) => ({
      ...base,
      flexWrap: "nowrap", // ⬅️ no permitir salto de línea
      overflowX: "auto", // ⬅️ scroll horizontal
      scrollbarWidth: "none", // Firefox
      msOverflowStyle: "none", // IE/Edge
      WebkitOverflowScrolling: "touch",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      display: "flex",
      flexShrink: 0, // que no se comprima la zona de iconos
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    multiValue: (base) => ({
      ...base,
      marginRight: 0,
      whiteSpace: "nowrap", // evita que un chip se parta
    }),
  };

  const cleanTableAndFilters = () => {
    setFormStates(initialState);
    setSelectedPolizas([]);
    setPolizas([]);
  };

  const handlerCloseModal = () => {
    setLiquidacionModal(false);
    handlerGetLiqAdmin();
  };

  const handlerCleanModal = () => {
    setSelectedPolizas([]);
    // window.location.reload();
  };

  return (
    <div className="flex flex-col">
      <Loader isLoading={loading} />
      {liquidacionModal && (
        <ModalLiquidaciones
          onClose={() => handlerCloseModal()}
          selectedPolizas={selectedPolizas}
          isLoading={loading}
          setIsLoading={setLoading}
          liquidacionModal={liquidacionModal}
          setLiquidacionModal={setLiquidacionModal}
          handleReloadPolizas={handlerLoadPolizasUser}
          handlerCleanModal={handlerCleanModal}
        />
      )}
      <Box padding={3}>
        <section className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-10">
          <h1 className="text-lg font-semibold text-gray-900">
            Liquidacion de Comisiones Internos
          </h1>
        </section>
        <section>
          <div className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-4 flex flex-row justify-between">
            <span className="text-lg font-semibold">
              Administrador de liquidaciónes
            </span>
            <button
              type="button"
              onClick={() => setAppersBox((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              aria-expanded={appersBox}
              aria-controls="panelAdminLiq"
              title={appersBox ? "Ver menos" : "Ver más"}
            >
              {appersBox ? (
                <>
                  <FiChevronUp size={18} /> <>Ver menos</>
                </>
              ) : (
                <>
                  <FiChevronDown size={18} /> <>Ver más</>
                </>
              )}
            </button>
          </div>
          <div
            id="panelFiltros"
            className={`${appersBox ? "mb-10" : ""} transition-all duration-1000 ${
              appersBox ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <TableAdminLiq
              data={liqAdminData}
              headers={headersAdminLiq}
              setIsLoading={setLoading}
              loading={loading}
            />
          </div>
        </section>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-100 p-3 rounded-t-3xl border-gray-200 border">
            <p className="text-lg pl-3 font-semibold">Consulta Avanzada</p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-200  h-auto">
            <div className="flex flex-row gap-3 items-center w-full">
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="unidadnegocio" className="text-sm">
                  Unidad de negocio:
                </label>
                <Select
                  name="unidadnegocio"
                  className="text-sm"
                  options={unidadesNegocio}
                  value={
                    unidadesNegocio.find(
                      (opt) => opt.value === formStates.unidadnegocio,
                    ) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="usuario" className="text-sm">
                  Usuario:
                </label>
                <Select
                  name="usuario"
                  className="text-sm"
                  options={usuariosInput || ""}
                  value={
                    (usuariosInput.length > 0 &&
                      usuariosInput?.find(
                        (opt) => opt.value === formStates.usuario,
                      )) ||
                    ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="aseguradora" className="text-sm">
                  Aseguradora:
                </label>
                <Select
                  name="aseguradora"
                  className="text-sm"
                  options={aseguradoras || ""}
                  value={
                    aseguradoras.find(
                      (opt) => opt.value === formStates.aseguradora,
                    ) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="ramo" className="text-sm">
                  Ramo:
                </label>
                <Select
                  name="ramo"
                  className="text-sm"
                  options={ramos || ""}
                  value={
                    ramos.find((opt) => opt.value === formStates.ramo) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              {/* <div className="flex flex-col w-auto flex-1">
                <label htmlFor="tiponegocio" className="text-sm">
                  Tipo de negocio:
                </label>
                <Select
                  name="tiponegocio"
                  className="text-sm"
                  options={
                    [
                      { value: "1", label: "Unidad 1" },
                      { value: "2", label: "Unidad 2" },
                    ] || ""
                  }
                  value={
                    [
                      { value: "1", label: "Unidad 1" },
                      { value: "2", label: "Unidad 2" },
                    ].find((opt) => opt.value === formStates.tiponegocio) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div> */}
            </div>
            <div className="flex flex-row gap-3 items-center w-full mt-7">
              <div className="flex flex-col w-1/5">
                <label htmlFor="tipoexpedicion" className="text-sm">
                  Tipo de expedición:
                </label>
                <Select
                  name="tipoexpedicion"
                  options={tiposExpedicion}
                  isMulti
                  value={
                    tiposExpedicion.filter((opt) =>
                      formStates.tipoexpedicion?.includes(opt.value),
                    ) || ""
                  }
                  onChange={(selected) => {
                    const values = (selected ?? []).map((o) => o.value);
                    setFormStates((prev) => ({
                      ...prev,
                      tipoexpedicion: values,
                    }));
                  }}
                  styles={stylesSingleLine}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  isClearable={false}
                  placeholder=""
                />
              </div>

              <div className="flex flex-col w-1/5">
                <label htmlFor="fechainiciovigencia" className="text-sm">
                  Fecha inicio vigencia desde:
                </label>
                <input
                  type="date"
                  name="fechainiciovigdesde"
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formStates.fechainiciovigdesde}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const [year, month] = value.split("-").map(Number);
                      const lastDay = new Date(year, month, 0).getDate();
                      const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                      setFormStates((prev) => ({
                        ...prev,
                        fechainiciovigdesde: value,
                       // fechafinvighasta: lastDayStr,
                      }));
                    } else {
                      setFormStates((prev) => ({
                        ...prev,
                        fechainiciovigdesde: value,
                      }));
                    }
                  }}
                />
              </div>
              <div className="flex flex-col w-1/5">
                <label htmlFor="fechafinvighasta" className="text-sm">
                  Fecha fin vigencia hasta:
                </label>
                <input
                  type="date"
                  name="fechafinvighasta"
                  className="text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={formStates.fechafinvighasta}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const [year, month] = value.split("-").map(Number);
                      const lastDay = new Date(year, month, 0).getDate();
                      const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                      const firstDayStr = `${year}-${String(month).padStart(2, "0")}-01`;
                      setFormStates((prev) => ({
                        ...prev,
                        fechafinvighasta: lastDayStr,
                       // fechainiciovigdesde: firstDayStr,
                      }));
                    } else {
                      setFormStates((prev) => ({
                        ...prev,
                        fechafinvighasta: "",
                      }));
                    }
                  }}
                />
              </div>
              <div className="flex flex-col w-1/5">
                <label htmlFor="estadoliquidacion" className="text-sm">
                  Estado de liquidación User SGA:
                </label>
                <Select
                  name="estadoliquidacion"
                  className="text-sm"
                  options={
                    [
                      { value: "1", label: "Por liquidar" },
                      { value: "2", label: "Liquidada" },
                      // { value: "3", label: "Cancelada" },
                    ] || ""
                  }
                  value={
                    [
                      { value: "1", label: "Por liquidar" },
                      { value: "2", label: "Liquidada" },
                      // { value: "3", label: "Cancelada" },
                    ].find(
                      (opt) => opt.value === formStates.estadoliquidacion,
                    ) || ""
                  }
                  onChange={(selectedOption, meta) => {
                    const value = selectedOption?.value || "";
                    setFormStates((prev) => ({
                      ...prev,
                      [meta.name]: value,
                    }));
                  }}
                  styles={customNewStyles}
                  placeholder=""
                  isClearable
                />
              </div>
              <div className="flex flex-col w-1/5"></div>
            </div>
            <div className="flex flex-row gap-3 items-center w-full mt-7">
              <div className="flex flex-col w-1/5">
                <BtnGeneral
                  id={"btnVerMovimientos"}
                  className={
                    "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                  }
                  funct={() => handlerLoadPolizasUser()}
                >
                  <span>Consultar</span>
                </BtnGeneral>
              </div>
              <div className="flex flex-col w-1/5">
                <BtnGeneral
                  id={"btnVerMovimientos"}
                  className={
                    "bg-black text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                  }
                  funct={() => cleanTableAndFilters()}
                >
                  <span>Limpiar</span>
                </BtnGeneral>
              </div>
              <div className="flex flex-col w-1/5"></div>
              <div className="flex flex-col w-1/5"></div>
              <div className="flex flex-col w-1/5"></div>
            </div>
          </div>
        </section>
        {polizas.length > 0 && (
          <>
            <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
              <TableComisiones
                data={polizas ?? []}
                headers={
                  formStates.unidadnegocio == "2" ? headersDirectos : headers
                }
                from="" // o cualquier otro string si no quieres paginación/acciones
                onRowAction={() => {}}
                onToggleSelect={handleToggleSelect}
                onTogglePageSelect={handleTogglePageSelect}
                setIsLoading={setLoading}
                loading={loading}
              />
            </section>
            <section className="flex flex-row justify-end mt-7">
              <BtnGeneral
                id={"btnVerMovimientos"}
                className={
                  "bg-lime-9000 text-white px-10 py-2 rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={() => setLiquidacionModal(true)}
              >
                <span>Liquidar Borrador</span>
              </BtnGeneral>
            </section>
          </>
        )}
      </Box>
    </div>
  );
};
