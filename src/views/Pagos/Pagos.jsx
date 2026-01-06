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

export const Pagos = ({ loading, setLoading, isCollapsed }) => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    fechagendesde: "",
    fechagenhasta: "",
    no_liquidacion: "",
    estadoliquidacion: "",
    usuario: "",
  });
  const [usuarios, setUsuarios] = useState([]);
  const [selectedLiquidaciones, setSelectedLiquidaciones] = useState([]);
  const [pagoLiqModal, setPagoLiqModal] = useState(false);
  const userData = JSON.parse(localStorage.getItem("userData"));

  const customNewStyles = {
    indicatorSeparator: () => ({ display: "none" }),
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 32,
      fontSize: "14px",
      marginTop: 0,
      paddingTop: 0,
    }),
    valueContainer: (base) => ({
      ...base,
      height: 32,
      paddingTop: 0,
      paddingBottom: 0,
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: 32,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 5,
    }),
  };

  const handlerLoadLiquidaciones = async () => {
    // Lógica para cargar las liquidaciones (cuando la tengas)
    // setLoading(true);
    if (
      !filtros.estadoliquidacion &&
      !filtros.usuario &&
      (!filtros.fechagendesde || !filtros.fechagenhasta) &&
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
      usuario,
    } = filtros;

    setLoading(true);
    const liquidacionesData = await getSettlements(
      fechagendesde,
      fechagenhasta,
      no_liquidacion,
      usuario,
      estadoliquidacion
    );
    if (liquidacionesData.statusCode !== -1) {
      setLiquidaciones(liquidacionesData.liquidacion);
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
    if (!Array.isArray(liquidaciones) || liquidaciones.length === 0) return;

    const isSelected = (v) => v === true || v === 1 || v === "1";

    const preselected = liquidaciones
      .filter(
        (p) => isSelected(p.seleccionada_liq) || isSelected(p.seleccionada_liq)
      )
      .map((p) => ({
        id: p.id_liquidacion,
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
    { field: "mes_expedicion", header: "Mes Expedición" },
    { field: "usuario_sga", header: "Usuario" },
    { field: "pct_comision", header: "% Comisión" },
    { field: "valor_total_liquidacion", header: "Valor liquidación" },
    { field: "estado", header: "Estado liquidación" },
    { field: "fecha_pago", header: "Fecha pago" },
    { field: "acciones", header: "Acciones" },
  ];

  // Cargos que SÍ se deben incluir en el selector
  const INCLUDED_CARGOS = [
    "Director Comercial",
    "Analista Comercial",
    "Asistente Comercial",
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

  const handlerLoadUsuarios = async () => {
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
        l.id_liquidacion === id ? { ...l, seleccionada_liq: checked } : l
      )
    );

    setSelectedLiquidaciones((prev) =>
      checked
        ? [...prev, { id, ...row }]
        : prev.filter((l) => l.id_liquidacion !== id)
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
          l.id_liquidacion === id ? { ...l, seleccionada_liq: !checked } : l
        )
      );
      Swal.fire(
        "Error",
        err.message || "No se pudo actualizar la selección",
        "error"
      );
    }
  };

  useEffect(() => {
    handlerLoadUsuarios();
    return () => {
      setUsuarios([]);
    };
  }, []);

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
      id_usuario: userData.usu_documento, // quien ejecuta/crea el pago (usuario del sistema)
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
        no_liquidacion: "",
        estadoliquidacion: "",
        usuario: "",
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
            no_liquidacion: "",
            estadoliquidacion: "",
            usuario: "",
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
        <section className="shadow-lg rounded-3xl xl:w-full lg:w/full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <p className="text-lg pl-3">Registro de pago de comisiones</p>
          </div>

          <div className="flex flex-row gap-3 items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-400 h-auto">
            <div className="flex flex-row gap-3 items-center w-full pt-4">
              <div
                className={`flex flex-row flex-1 gap-6 ${
                  isCollapsed ? "flex-nowrap" : "flex-wrap"
                }`}
              >
                {/* Fecha generación DESDE */}
                <div className="relative w-[155px]">
                  <input
                    type="date"
                    id="fechagendesde"
                    name="fechagendesde"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[155px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Fecha Generación Desde"
                    value={filtros.fechagendesde}
                    max={filtros.fechagenhasta || undefined} // si hay HASTA, limita DESDE
                    onChange={(e) =>
                      handleDateChange(e.target.name, e.target.value)
                    }
                  />
                  <label
                    htmlFor="fechagendesde"
                    className="absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Fecha generacion desde:
                  </label>
                </div>

                {/* Fecha generación HASTA */}
                <div className="relative w-[155px]">
                  <input
                    type="date"
                    id="fechagenhasta"
                    name="fechagenhasta"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[155px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="Fecha Generación Hasta"
                    value={filtros.fechagenhasta}
                    min={filtros.fechagendesde || undefined} // si hay DESDE, limita HASTA
                    onChange={(e) =>
                      handleDateChange(e.target.name, e.target.value)
                    }
                  />
                  <label
                    htmlFor="fechagenhasta"
                    className="absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Fecha generacion hasta:
                  </label>
                </div>

                {/* Número de liquidación */}
                <div className="relative pt-[2.6px] w-[130px]">
                  <input
                    type="number"
                    id="no_liquidacion"
                    name="no_liquidacion"
                    style={{ backgroundColor: "#FCFCFC" }}
                    className="peer w-[100px] border-b-[1.5px] border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-lime-600 mt-2"
                    placeholder="No. Liquidación"
                    value={filtros.no_liquidacion}
                    onChange={(e) => {
                      const { value, name } = e.target;
                      setFiltros((prev) => ({ ...prev, [name]: value }));
                    }}
                  />
                  <label
                    htmlFor="no_liquidacion"
                    className="absolute left-0 -top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-[5px] peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-gray-400 peer-focus:-top-5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    No. liquidación:
                  </label>
                </div>

                {/* Usuario */}
                <div className="flex flex-col w-3/12">
                  <Select
                    name="usuario"
                    className="text-sm"
                    options={usuarios}
                    isClearable
                    value={
                      usuarios.find((u) => u.value === filtros.usuario) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder="Usuario"
                  />
                </div>

                {/* Estado liquidación */}
                <div className="flex flex-col w-[240px]">
                  <Select
                    name="estadoliquidacion"
                    className="text-sm"
                    options={[
                      { value: "1", label: "Por Pagar" },
                      { value: "2", label: "Pagada" },
                      { value: "3", label: "Anulada" },
                    ]}
                    isClearable
                    value={
                      [
                        { value: "1", label: "Por Pagar" },
                        { value: "2", label: "Pagada" },
                        { value: "3", label: "Anulada" },
                      ].find(
                        (item) => item.value === filtros.estadoliquidacion
                      ) || null
                    }
                    onChange={(selectedOption, meta) => {
                      setFiltros((prev) => ({
                        ...prev,
                        [meta.name]: selectedOption ? selectedOption.value : "",
                      }));
                    }}
                    styles={customNewStyles}
                    placeholder="Estado Liquidación"
                  />
                </div>

                {/* Botón consultar */}
                <div className="flex flex-col w-2/12">
                  <BtnGeneral
                    id={"btnConsultarLiquidacion"}
                    className={
                      "bg-lime-9000 text-white px-10 h-[32px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
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
            <section className="mt-10">
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
