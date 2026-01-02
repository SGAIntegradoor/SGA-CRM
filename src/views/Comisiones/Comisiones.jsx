import { useState, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import { retrieveClientData } from "../../services/retrieveClientData";
import ModalCliente from "../../components/ModalCliente/ModalCliente";
import { NavContext } from "../../context/NavContext";
import Loader from "../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../components/BtnGeneral/BtnGeneral";
import { TableComisiones } from "../../components/Comisiones/TablaComisiones";
import { getPolizas } from "../../services/Polizas/getPolizas";
import { selectPoliza } from "../../services/Comisiones/selectPoliza";
import Swal from "sweetalert2";
import ModalLiquidaciones from "../../components/Comisiones/Components/Modal/ModalLiquidaciones";
import { getUnidadesNegocio } from "../../services/Polizas/getUnidadNegocio";
import { getAsesoresSGA } from "../../services/Users/getAsesoresSGA";
import { obtenerAseguradoras, obtenerRamo } from "../../utils/aseguradoras";
import { getTiposPoliza } from "../../services/Polizas/getTiposPoliza";

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
  const [formStates, setFormStates] = useState(initialState);

  const { isModalOpenCliente, setIsModalOpenCliente } = useContext(NavContext);
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [reloadScreen, setReloadScreen] = useState(false);
  const [selectedPolizas, setSelectedPolizas] = useState([]);
  const [liquidacionModal, setLiquidacionModal] = useState(false);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [usuariosInput, setUsuariosInput] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);

  const handlerLoadUnidadesNegocio = async () => {
    setLoading(!loading);
    getUnidadesNegocio()
      .then((rows) => {
        setUnidadesNegocio(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoadPolizas = async () => {
    setLoading(!loading);
    getPolizas()
      .then((rows) => {
        setPolizas(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoadFilterUsuarios = async () => {
    setLoading(!loading);

    getAsesoresSGA(formStates.unidadnegocio)
      .then((data) => {
        // TODO Manejar los datos del cliente aquí
        setUsuariosInput(data);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoaderAseguradoras = async () => {
    setLoading(!loading);

    obtenerAseguradoras()
      .then((data) => {
        // TODO Manejar los datos del cliente aquí
        setAseguradoras(data);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoadTiposExpedicion = async () => {
    // Function to load other concepts data
    // This is a placeholder for the actual implementation
    getTiposPoliza()
      .then((data) => {
        // TODO Manejar los datos del cliente aquí
        setTiposExpedicion(data);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoadRamo = async () => {
    setLoading(!loading);

    obtenerRamo()
      .then((data) => {
        // TODO Manejar los datos del cliente aquí
        setRamos(data);
      })
      .catch((e) => console.error("Error en el fetch", e))
      .finally(() => setLoading(false));
  };

  const handlerLoadPolizasUser = () => {
    // if (formStates.unidadnegocio === "") {
    //   // Swal.fire("Error", "Debe seleccionar una unidad de negocio", "error");
    //   // return;
    // }
    if (formStates.usuario === "") {
      Swal.fire("Error", "Debe seleccionar un usuario", "error");
      return;
    }
    setLoading(!loading);
    getPolizas(formStates)
      .then((data) => {
        if (data.length === 0) {
          setLoading(!loading);
          Swal.fire(
            "Error",
            "No se encontraron pólizas para el usuario",
            "error"
          );
          return;
        }
        setPolizas(data);
        console.log(data)
      })
      .catch((e) => {
        console.error("Error en el fetch", e);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // if (formStates.unidadnegocio === "") {
    //   return;
    // }
    handlerLoaderAseguradoras()
      .then(() => {})
      .catch((error) => {
        console.error("Error loading aseguradoras:", error);
        setLoading(false);
      });
    handlerLoadFilterUsuarios()
      .then(() => {})
      .catch((error) => {
        console.error("Error loading usuarios:", error);
        setLoading(false);
      });
    handlerLoadRamo()
      .then(() => {
        // setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading ramo:", error);
        setLoading(false);
      });
    handlerLoadTiposExpedicion()
      .then(() => {})
      .catch((error) => {
        console.error("Error loading tipos de expedición:", error);
        setLoading(false);
      });

    setLoading(false);
  }, [formStates.unidadnegocio]);

  useEffect(() => {
    handlerLoadUnidadesNegocio();
  }, [reloadScreen]);

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

  const handleToggleSelect = async (row) => {
    const id = row.id_anexo_poliza;
    const next = !row.seleccionado;
    setPolizas((prev) =>
      prev.map((p) =>
        p.id_anexo_poliza === id ? { ...p, seleccionado: next } : p
      )
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
        : prev.filter((p) => p.id !== id)
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
          p.id_anexo_poliza === id ? { ...p, seleccionado: !next } : p
        )
      );
      Swal.fire(
        "Error",
        err.message || "No se pudo actualizar la selección",
        "error"
      );
    }
  };

  const headers = [
    { field: "poliza", header: "Poliza" },
    { field: "id_remision", header: "ID Remisión"},
    {
      field: "tipo_expedicion",
      header: "Tipo de expedición",
      style: { color: "red" },
    },
    { field: "fecha_expedicion", header: "Fecha de expedición" },
    { field: "ramo", header: "Ramo" },
    { field: "aseguradora", header: "Aseguradora" },
    { field: "asegurado", header: "Asegurado" },
    { field: "identificacion_asegurado", header: "Identificación" },
    { field: "placa", header: "Placa" },
    { field: "usuario_sga", header: "Usuario SGA" },
    { field: "forma_de_pago", header: "Forma de Pago" },
    { field: "asesor_freelance", header: "Asesor Freelance" },
    { field: "asesor_10", header: "Asesor 10" },
    { field: "asesor_ganador", header: "Asesor Ganador" },
    { field: "prima_sin_iva_asistencia", header: "Prima sin IVA + Asistencia" },
    {
      field: "valor_a_reversar",
      header: "Valor a Reversar",
      style: { color: "red" },
    },
    { field: "valor_comision", header: "Valor Comisión" },
    { field: "estado_liquidacion", header: "Estado Liquidación Usuario SGA" },
    { field: "seleccionado", header: "Seleccionar" },
  ];

    const headersDirectos = [
    { field: "poliza", header: "Poliza" },
    { field: "id_remision", header: "ID Remisión"},
    {
      field: "tipo_expedicion",
      header: "Tipo de expedición",
      style: { color: "red" },
    },
    { field: "fecha_expedicion", header: "Fecha de expedición" },
    { field: "ramo", header: "Ramo" },
    { field: "aseguradora", header: "Aseguradora" },
    { field: "asegurado", header: "Asegurado" },
    { field: "identificacion_asegurado", header: "Identificación" },
    { field: "placa", header: "Placa" },
    { field: "usuario_sga", header: "Usuario SGA" },
    { field: "forma_de_pago", header: "Forma de Pago" },
    // { field: "asesor_freelance", header: "Asesor Freelance" },
    { field: "asesor_10", header: "Asesor 10" },
    { field: "asesor_ganador", header: "Asesor Ganador" },
    { field: "prima_sin_iva_asistencia", header: "Prima sin IVA + Asistencia" },
    {
      field: "valor_a_reversar",
      header: "Valor a Reversar",
      style: { color: "red" },
    },
    { field: "valor_comision", header: "Valor Comisión" },
    { field: "estado_liquidacion", header: "Estado Liquidación Usuario SGA" },
    { field: "seleccionado", header: "Seleccionar" },
  ];


  const TIPO_EXP_OPTS = [
    { value: "1", label: "Unidad 1" },
    { value: "2", label: "Unidad 2" },
    { value: "3", label: "Unidad 3" },
    { value: "4", label: "Unidad 4" },
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
    // window.location.reload();
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
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <p className="text-lg pl-3">Consulta Avanzada</p>
          </div>

          <div className="flex flex-col gap-3 items-center justify-between pl-14 pr-14 pt-5 pb-8 rounded-b-3xl border-l border-r border-b border-gray-400 h-auto">
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
                      (opt) => opt.value === formStates.unidadnegocio
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
                        (opt) => opt.value === formStates.usuario
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
                      (opt) => opt.value === formStates.aseguradora
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
              <div className="flex flex-col w-auto flex-1">
                <label htmlFor="tiponegocio" className="text-sm">
                  Tipo de negocio:
                </label>
                <Select
                  name="tiponegocio"
                  className="text-sm"
                  options={[
                    { value: "1", label: "Unidad 1" },
                    { value: "2", label: "Unidad 2" },
                  ] || ""}
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
              </div>
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
                  value={tiposExpedicion.filter((opt) =>
                    formStates.tipoexpedicion?.includes(opt.value)
                  ) || ""}
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
                  onChange={(e) =>
                    setFormStates((prev) => ({
                      ...prev,
                      [e.target.name]: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFormStates((prev) => ({
                      ...prev,
                      [e.target.name]: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col w-1/5">
                <label htmlFor="estadoliquidacion" className="text-sm">
                  Estado de liquidación User SGA:
                </label>
                <Select
                  name="estadoliquidacion"
                  className="text-sm"
                  options={[
                    { value: "1", label: "Por liquidar" },
                    { value: "2", label: "Liquidada" },
                    // { value: "3", label: "Cancelada" },
                  ] || ""}
                  value={
                    [
                      { value: "1", label: "Por liquidar" },
                      { value: "2", label: "Liquidada" },
                      // { value: "3", label: "Cancelada" },
                    ].find(
                      (opt) => opt.value === formStates.estadoliquidacion
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
                headers={formStates.unidadnegocio == '2' ? headersDirectos : headers}
                from="" // o cualquier otro string si no quieres paginación/acciones
                onRowAction={() => {}}
                onToggleSelect={handleToggleSelect}
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
                <span>Liquidar</span>
              </BtnGeneral>
            </section>
          </>
        )}
      </Box>
    </div>
  );
};
