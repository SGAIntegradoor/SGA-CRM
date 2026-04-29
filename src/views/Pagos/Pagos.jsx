import { Box } from "@mui/material";
import Select from "react-select";
import React, { useEffect, useState } from "react";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import { getUserLiquidaciones } from "../../services/Users/getUsersLiquidaciones";
import { getSettlements } from "../../services/Settlements/getSettlements";
import { TablePagosLiq } from "../../components/Liquidaciones/Pagos/Tables/TablaPagosLiq";
import Swal from "sweetalert2";
import { selectLiqPago } from "../../services/Settlements/selectLiqPago";
import Loader from "../../components/LoaderFullScreen/Loader";
import ModalRegistroPago from "./Modal/ModalRegistroPago";
import { createPaymentsLiquidacion } from "../../services/Settlements/createPaymentsLiquidacion";
import { anularPaymentLiquidacion } from "../../services/Settlements/anularPaymentLiquidacion";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getAsesoresSGA } from "../../services/Users/getAsesoresSGA";
import { getAsesoresGanadores } from "../../services/Users/getAsesoresGanadores";
import { getAsesores10 } from "../../services/Users/getAsesores10";
import { getFreelances } from "../../services/Users/getFreelance";

export const Pagos = ({ loading, setLoading, isCollapsed }) => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    fechagendesde: "",
    fechagenhasta: "",
    unidad_negocio: "",
    asesor_freelance: "",
    asesor_10: "",
    asesor_ganador: "",
    usuario_interno: "",
    no_liquidacion: "",
    estadoliquidacion: "",
  });
  const [usuarios, setUsuarios] = useState([]);
  const [asesoresGanadores, setAsesoresGanadores] = useState([]);
  const [asesores10, setAsesores10] = useState([]);
  const [freelances, setFreelances] = useState([]);
  const [selectedLiquidaciones, setSelectedLiquidaciones] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [pagoLiqModal, setPagoLiqModal] = useState(false);
  const userData = JSON.parse(localStorage.getItem("userData"));

  const handlerLoadUnidadesNegocio = async () => {
    try {
      const rows = await getUnidadesNegocio();
      setUnidadesNegocio(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Error en la carga de unidades de negocio", e);
    }
  };

  const handlerLoadAsesoresGanadores = async () => {
    try {
      const data = await getAsesoresGanadores();
      setAsesoresGanadores(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de asesores ganadores", e);
    }
  };

  const handlerLoadAsesores10 = async () => {
    try {
      const data = await getAsesores10();
      setAsesores10(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de asesores 10", e);
    }
  };

  const handlerLoadFreelances = async () => {
    try {
      const data = await getFreelances();
      setFreelances(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de freelances", e);
    }
  };

  console.log(unidadesNegocio);

  const handlerLoadFilterInternos = async (type) => {
    try {
      type = filtros.unidad_negocio === "1" ? "unidades" : "usuarios";
      const data = await getAsesoresSGA(filtros.unidad_negocio || null);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error en la carga de usuarios", e);
    }
  };

  // Cargos que SÍ se deben incluir en el selector
  const INCLUDED_CARGOS = [
    "Director Comercial",
    "Analista Comercial",
    "Asistente Comercial",
    "Asistente Tecnico",
    "Asistente Tecnico Emision",
    "Asesor Comercial Interno",
    "Analista Tecnico", // si a veces viene “Técnico”, lo cubrimos con normalización
    "Coordinador Tecnico Emision",
  ];

  const norm = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .trim();

  const includedSet = new Set(INCLUDED_CARGOS.map(norm));

  // Cargos internos permitidos por unidad de negocio
  const CARGOS_POR_UNIDAD = {
    freelance: [
      "Director Comercial", "Analista Comercial", "Asistente Comercial",
      "Asistente Tecnico", "Asistente Tecnico Emision",
      "Analista Tecnico", "Coordinador Tecnico Emision",
    ],
    ganador: [
      "Asistente Tecnico", "Asistente Tecnico Emision",
      "Asesor Comercial Interno", "Analista Tecnico", "Coordinador Tecnico Emision",
    ],
    asesor10: [
      "Asistente Tecnico", "Asistente Tecnico Emision",
      "Asesor Comercial Interno", "Analista Tecnico", "Coordinador Tecnico Emision",
    ],
    directo: ["Asesor Comercial Interno"],
  };

  // Tipo de unidad de negocio seleccionada (basado en id_unidad: 1=Freelance, 2=Negocio Directo, 3=Asesor 10, 4=Asesor Ganador)
  const tipoUnidad = (() => {
    const v = String(filtros.unidad_negocio ?? "");
    if (v === "1") return "freelance";
    if (v === "2") return "directo";
    if (v === "3") return "asesor10";
    if (v === "4") return "ganador";
    return null;
  })();

  // Usuarios internos filtrados según la unidad de negocio seleccionada
  const usuariosFiltrados = (() => {
    if (!tipoUnidad || !CARGOS_POR_UNIDAD[tipoUnidad]) return usuarios;
    const cargosSet = new Set(CARGOS_POR_UNIDAD[tipoUnidad].map(norm));
    return usuarios.filter((u) => cargosSet.has(norm(u.cargo)));
  })();

  // Visibilidad de selectores de usuarios externos
  const showFreelance = !filtros.unidad_negocio || tipoUnidad === "freelance";
  const showGanador   = !filtros.unidad_negocio || tipoUnidad === "ganador";
  const showAsesor10  = !filtros.unidad_negocio || tipoUnidad === "asesor10";

  console.log(usuarios);

  const handlerLoadUsuariosInternos = async () => {
    setLoading?.(true);
    try {
      const userLiq = await getUserLiquidaciones();

      const filteredUsers = userLiq
        .filter((u) => includedSet.has(norm(u.cargo))) // incluir solo estos cargos
        .map((u) => ({ value: u.value, label: u.label, cargo: u.cargo }));

      setUsuarios(filteredUsers.sort((a, b) => a.label.localeCompare(b.label)));

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
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
          handlerLoadUsuariosInternos(),
          handlerLoadAsesoresGanadores(),
          handlerLoadAsesores10(),
          handlerLoadFreelances(),
        ]);
      } catch (error) {
        console.error("Error en la carga inicial", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const customNewStyles = {
    indicatorSeparator: () => ({ display: "none" }),
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
      padding: 0,
      marginRight: 4,
      cursor: "pointer",
      svg: { width: 12, height: 12 },
    }),
    valueContainer: (base) => ({
      ...base,
      height: 35,
      paddingTop: 0,
      paddingBottom: 0,
      paddingRight: 4,
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: 35,
      paddingRight: 4,
      gap: 2,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 5,
    }),
  };

  const filterFieldWrapperClass = "flex flex-col w-[210px]";
  const filterInputClass =
    "text-md border-[1px] w-full border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md px-2";

  const handlerLoadLiquidaciones = async () => {
    // Lógica para cargar las liquidaciones (cuando la tengas)
    // setLoading(true);
    if (
      !filtros.estadoliquidacion &&
      (!filtros.usuario_interno ||
        !filtros.asesor_freelance ||
        !filtros.asesor_10 ||
        !filtros.asesor_ganador) &&
      (!filtros.fechagendesde || !filtros.fechagenhasta) &&
      !filtros.unidad_negocio &&
      !filtros.no_liquidacion
    ) {
      Swal.fire({
        icon: "warning",
        title: "Filtros incompletos",
        text: "Por favor, complete todos los filtros antes de buscar.",
      });
      return;
    }

    const {
      fechagendesde,
      fechagenhasta,
      no_liquidacion,
      estadoliquidacion,
      unidad_negocio,
      asesor_freelance,
      asesor_10,
      asesor_ganador,
      usuario_interno,
    } = filtros;

    setLoading(true);
    const liquidacionesData = await getSettlements(
      fechagendesde,
      fechagenhasta,
      no_liquidacion,
      unidad_negocio,
      asesor_freelance,
      asesor_10,
      asesor_ganador,
      usuario_interno,
      estadoliquidacion,
    );
    if (liquidacionesData?.statusCode !== -1) {
      setLiquidaciones(liquidacionesData?.liquidacion);
      setLoading(false);
    } else {
      setLiquidaciones([]);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontraron liquidaciones.",
      });
    }
  };

  useEffect(() => {
    if (!Array.isArray(liquidaciones) || liquidaciones?.length === 0) return;

    const isSelected = (v) => v === true || v === 1 || v === "1";

    const preselected = liquidaciones
      .filter(
        (p) =>
          isSelected(p?.seleccionada_liq) || isSelected(p?.seleccionada_liq),
      )
      .map((p) => ({
        id: p?.id_liquidacion,
        ...p,
      }));

    setSelectedLiquidaciones((prev) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      preselected.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    });
  }, [liquidaciones]);

  const headers = [
    { field: "id_liquidacion", header: "No. liquidación" },
    { field: "fecha_liquidacion", header: "Fecha generación liquidación" },
    { field: "periodo_liquidacion", header: "Periodo liquidación" },
    { field: "usuario_sga", header: "Usuario" },
    { field: "pct_comision", header: "% Comisión" },
    { field: "valor_total_liquidacion", header: "Valor liquidación" },
    { field: "estado", header: "Estado liquidación" },
    { field: "fecha_pago", header: "Fecha pago" },
    { field: "acciones", header: "Acciones" },
  ];

  // Validador de fechas: evita rangos inválidos al escribir manualmente
  const handleDateChange = (name, value) => {
    setFiltros((prev) => {
      if (name === "fechagendesde") {
        // Si ya hay HASTA, no permitas DESDE > HASTA
        if (prev.fechagenhasta && value > prev.fechagenhasta) return prev;
      }
      if (name === "fechagenhasta") {
        // Si ya hay DESDE, no permitas HASTA < DESDE
        if (prev.fechagendesde && value < prev.fechagendesde) return prev;
      }
      return { ...prev, [name]: value };
    });
  };

  // antes: const handleToggleSelect = async (row) => {
  const handleToggleSelect = async (row, checked) => {
    const id = row.id_liquidacion;

    // 1) Actualiza UI en caliente usando el valor que viene del input
    setLiquidaciones((prev) =>
      prev.map((l) =>
        l.id_liquidacion === id ? { ...l, seleccionada_liq: checked } : l,
      ),
    );

    setSelectedLiquidaciones((prev) =>
      checked
        ? [...prev, { id, ...row }]
        : prev.filter((l) => l.id_liquidacion !== id),
    );

    // 2) Llama API
    try {
      const res = await selectLiqPago(id, checked);
      if (res?.status !== "Ok")
        throw new Error(res?.message || "Error al actualizar");
    } catch (err) {
      // Revertir si falla
      setLiquidaciones((prev) =>
        prev.map((l) =>
          l.id_liquidacion === id ? { ...l, seleccionada_liq: !checked } : l,
        ),
      );
      Swal.fire(
        "Error",
        err.message || "No se pudo actualizar la selección",
        "error",
      );
    }
  };

  // useEffect(() => {
  //   handlerLoadUsuarios();
  //   return () => {
  //     setUsuarios([]);
  //   };
  // }, []);

  const handlerRegistarPago = async (fecha_pago) => {
    setLoading(true);
    const liquidaciones = selectedLiquidaciones.map((l) => ({
      id_liquidacion: l.id_liquidacion,
      id_usuario_liq: l.identificacion_usuario_sga,
      valor_total_pago: l.valor_total_liquidacion,
      fecha_pago: fecha_pago,
      // mes_expedicion: "NULL",
      observaciones: "Pago liquidación registrado desde el sistema",
      estado_pago: 1,
    }));

    const save_data = {
      id_usuario: userData.documento, // quien ejecuta/crea el pago (usuario del sistema)
      debug: true,
      liquidaciones: liquidaciones,
    };

    const request = await createPaymentsLiquidacion(save_data);
    if (request.status === "Ok") {
      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Pago registrado correctamente.",
      });
      setPagoLiqModal(false);
      setLiquidaciones([]);
      setSelectedLiquidaciones([]);
      setFiltros({
        fechagendesde: "",
        fechagenhasta: "",
        unidad_negocio: "",
        asesor_freelance: "",
        asesor_10: "",
        asesor_ganador: "",
        usuario_interno: "",
        no_liquidacion: "",
        estadoliquidacion: "",
      });
    } else {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: request.message || "Error al registrar el pago.",
      });
      return;
    }
  };

  console.log(filtros);

  const handlerAnularPago = async (id_liquidacion, id_usuario_liq) => {
    const body = {
      id_usuario: userData.usu_documento,
      debug: true,
      liquidaciones: [
        {
          id_liquidacion: id_liquidacion,
          id_usuario_liq: id_usuario_liq,
        },
      ],
    };

    Swal.fire({
      title: "¿Está seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        const request = await anularPaymentLiquidacion(body);
        if (request.status === "Ok") {
          setLoading(false);
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Pago y liquidación anulados correctamente.",
          });
          setLiquidaciones([]);
          setSelectedLiquidaciones([]);
          setFiltros({
            fechagendesde: "",
            fechagenhasta: "",
            unidad_negocio: "",
            asesor_freelance: "",
            asesor_10: "",
            asesor_ganador: "",
            usuario_interno: "",
            no_liquidacion: "",
            estadoliquidacion: "",
          });
        } else {
          setLoading(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: request.message || "Error al anular el pago.",
          });
          return;
        }
        setLoading(false);
        return;
      } else {
        setLoading(false);
        return;
      }
    });
  };

  return (
    <div>
      <Loader isLoading={loading} />
      {pagoLiqModal && (
        <ModalRegistroPago
          show={pagoLiqModal}
          onClose={() => setPagoLiqModal(false)}
          selectedLiquidaciones={selectedLiquidaciones}
          setIsLoading={setLoading}
          pagoLiqModal={pagoLiqModal}
          setPagoLiqModal={setPagoLiqModal}
          onRegister={handlerRegistarPago}
          // onAnulation={handlerAnularPago}
        />
      )}
      <Box padding={3}>
        <section className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-10">
          <h1 className="text-lg font-semibold text-gray-900">
            Registro de pago de comisiones
          </h1>
        </section>

        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-100 p-3 rounded-t-3xl border-gray-200 border">
            <p className="text-lg pl-3 font-semibold">Consulta avanzada</p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-200 h-auto">
            <div className="flex flex-row gap-3 items-center w-full">
              <div
                className={`flex flex-row gap-3 ${isCollapsed ? "flex-nowrap" : "flex-wrap"}`}
              >
                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="fechagendesde"
                    className="text-sm text-gray-700"
                  >
                    Fecha generación desde:
                  </label>
                  <input
                    type="date"
                    id="fechagendesde"
                    name="fechagendesde"
                    className={filterInputClass}
                    placeholder="Fecha Generación Desde"
                    value={filtros.fechagendesde}
                    max={filtros.fechagenhasta || undefined}
                    onChange={(e) =>
                      handleDateChange(e.target.name, e.target.value)
                    }
                  />
                </div>

                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="fechagenhasta"
                    className="text-sm text-gray-700"
                  >
                    Fecha generación hasta:
                  </label>
                  <input
                    type="date"
                    id="fechagenhasta"
                    name="fechagenhasta"
                    className={filterInputClass}
                    placeholder="Fecha Generación Hasta"
                    value={filtros.fechagenhasta}
                    min={filtros.fechagendesde || undefined}
                    onChange={(e) =>
                      handleDateChange(e.target.name, e.target.value)
                    }
                  />
                </div>
                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="unidad_negocio"
                    className="text-sm text-gray-700"
                  >
                    Unidad de negocio:
                  </label>
                  <Select
                    name="unidad_negocio"
                    className="text-sm"
                    options={unidadesNegocio}
                    isClearable
                    value={
                      unidadesNegocio.find(
                        (u) => u.value === filtros.unidad_negocio,
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                        asesor_freelance: "",
                        asesor_ganador: "",
                        asesor_10: "",
                        usuario_interno: "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>

                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="asesor_freelance"
                    className="text-sm text-gray-700"
                  >
                    Asesor freelance:
                  </label>
                  <Select
                    name="asesor_freelance"
                    className="text-sm"
                    options={freelances}
                    isClearable
                    isDisabled={!showFreelance}
                    value={
                      freelances.find(
                        (u) => u.value === filtros.asesor_freelance,
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                        usuario_interno: "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>

                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="asesor_ganador"
                    className="text-sm text-gray-700"
                  >
                    Asesor ganador:
                  </label>
                  <Select
                    name="asesor_ganador"
                    className="text-sm"
                    options={asesoresGanadores}
                    isClearable
                    isDisabled={!showGanador}
                    value={
                      asesoresGanadores.find(
                        (u) => u.value === filtros.asesor_ganador,
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                        usuario_interno: "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>

                <div className={filterFieldWrapperClass}>
                  <label htmlFor="asesor_10" className="text-sm text-gray-700">
                    Asesor 10:
                  </label>
                  <Select
                    name="asesor_10"
                    className="text-sm"
                    options={asesores10}
                    isClearable
                    isDisabled={!showAsesor10}
                    value={
                      asesores10.find((u) => u.value === filtros.asesor_10) ||
                      null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                        usuario_interno: "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-3 items-center w-full mt-2">
              <div
                className={`flex flex-row gap-3 ${isCollapsed ? "flex-nowrap" : "flex-wrap"}`}
              >
                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="usuario_interno"
                    className="text-sm text-gray-700"
                  >
                    Usuario interno:
                  </label>
                  <Select
                    name="usuario_interno"
                    className="text-sm"
                    options={usuariosFiltrados}
                    isClearable
                    value={
                      usuariosFiltrados.find(
                        (u) => u.value === filtros.usuario_interno,
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                        asesor_freelance: "",
                        asesor_ganador: "",
                        asesor_10: "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>
                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="no_liquidacion"
                    className="text-sm text-gray-700"
                  >
                    No. liquidación:
                  </label>
                  <input
                    type="number"
                    id="no_liquidacion"
                    name="no_liquidacion"
                    className={filterInputClass}
                    placeholder="No. Liquidación"
                    value={filtros.no_liquidacion}
                    onChange={(e) => {
                      const { value, name } = e.target;
                      setFiltros((prev) => ({ ...prev, [name]: value }));
                    }}
                  />
                </div>

                <div className={filterFieldWrapperClass}>
                  <label
                    htmlFor="estadoliquidacion"
                    className="text-sm text-gray-700"
                  >
                    Estado liquidación:
                  </label>
                  <Select
                    name="estadoliquidacion"
                    className="text-sm"
                    options={[
                      { value: "0", label: "Borrador" },
                      { value: "1", label: "Por Pagar" },
                      { value: "2", label: "Pagada" },
                      { value: "3", label: "Anulada" },
                    ]}
                    isClearable
                    value={
                      [
                        { value: "0", label: "Borrador" },
                        { value: "1", label: "Por Pagar" },
                        { value: "2", label: "Pagada" },
                        { value: "3", label: "Anulada" },
                      ].find(
                        (item) => item.value === filtros.estadoliquidacion,
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder=""
                  />
                </div>

                <div className={`${filterFieldWrapperClass} justify-end`}>
                  <BtnGeneral
                    id={"btnConsultarLiquidacion"}
                    className={
                      "bg-lime-9000 text-white px-10 h-[35px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                    }
                    funct={handlerLoadLiquidaciones}
                  >
                    <span>Consultar</span>
                  </BtnGeneral>
                </div>
              </div>
            </div>
          </div>
        </section>
        {liquidaciones.length > 0 && (
          <>
            <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
              <TablePagosLiq
                data={liquidaciones}
                headers={headers}
                from={""}
                onToggleSelect={handleToggleSelect}
                onAnulation={handlerAnularPago}
              />
            </section>

            <section className="flex flex-row justify-end mt-7">
              <BtnGeneral
                id={"btnVerMovimientos"}
                className={
                  "bg-lime-9000 text-white px-10 py-2 rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={() => setPagoLiqModal(true)}
              >
                <span>Registrar pago</span>
              </BtnGeneral>
            </section>
          </>
        )}
      </Box>
    </div>
  );
};
