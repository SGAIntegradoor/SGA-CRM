import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import { TableComisiones } from "../../../components/Comisiones/TablaComisiones";
import { getPolizas } from "../../../services/Polizas/getPolizas";
import { selectPoliza } from "../../../services/Comisiones/selectPoliza";
import { selectPolizaBatch } from "../../../services/Comisiones/selectPolizaBatch";
import Swal from "sweetalert2";
import { getAsesoresSGA } from "../../../services/Users/getAsesoresSGA";
import { obtenerAseguradoras, obtenerRamo } from "../../../utils/aseguradoras";
import { getTiposPoliza } from "../../../services/Polizas/getTiposPoliza";
import Loader from "../../../components/LoaderFullScreen/Loader";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";

export const Conciliacion = ({ setLoading, loading }) => {
  const initialState = {
    poliza: "",
    tomador: "",
    usuario: "",
    aseguradora: "",
    ramo: "",
    tipoexpedicion: "",
    fechainiciovigdesde: "",
    fechafinvighasta: "",
    estadoliquidacion: "",
  };

  const [polizas, setPolizas] = useState([]);
  const [formStates, setFormStates] = useState(initialState);
  const [selectedPolizas, setSelectedPolizas] = useState([]);
  const [aseguradoras, setAseguradoras] = useState([]);
  const [usuariosInput, setUsuariosInput] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [tiposExpedicion, setTiposExpedicion] = useState([]);

  const handlerLoadFilterUsuarios = async () => {
    try {
      const data = await getAsesoresSGA("");
      setUsuariosInput(Array.isArray(data) ? data : []);
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

  const handlerLoadPolizasUser = async () => {
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
          handlerLoaderAseguradoras(),
          handlerLoadFilterUsuarios(),
          handlerLoadRamo(),
          handlerLoadTiposExpedicion(),
        ]);
      } catch (error) {
        console.error("Error en la carga inicial", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

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
        throw new Error(res?.message || "Error actualizando selección por página");
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

  const estadoConciliacionOptions = [
    { value: "1", label: "Pendiente" },
    { value: "2", label: "Conciliada" },
    { value: "3", label: "Pago parcial" },
  ];

  const cleanTableAndFilters = () => {
    setFormStates(initialState);
    setSelectedPolizas([]);
    setPolizas([]);
  };

  return (
    <div className="w-full">
      <Loader isLoading={loading} />
      <Box padding={3}>
        <section className="shadow-sm rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Conciliación aseguradoras</h1>
        </section>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-100 p-3 rounded-t-3xl border-gray-200 border">
            <p className="text-lg pl-3 font-semibold">Consulta Avanzada</p>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-b-3xl border-l border-r border-b border-gray-200 bg-white px-8 py-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col w-full">
              <label htmlFor="poliza" className="text-sm font-medium text-gray-800">
                # póliza
              </label>
              <input
                type="text"
                name="poliza"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.poliza}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="aseguradora" className="text-sm font-medium text-gray-800">
                Compañía
              </label>
              <Select
                name="aseguradora"
                className="text-sm"
                options={aseguradoras}
                value={
                  aseguradoras.find((opt) => opt.value === formStates.aseguradora) || null
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

            <div className="flex flex-col w-full">
              <label htmlFor="ramo" className="text-sm font-medium text-gray-800">
                Ramo
              </label>
              <Select
                name="ramo"
                className="text-sm"
                options={ramos}
                value={ramos.find((opt) => opt.value === formStates.ramo) || null}
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

            <div className="flex flex-col w-full">
              <label htmlFor="tomador" className="text-sm font-medium text-gray-800">
                Nombre asegurado
              </label>
              <input
                type="text"
                name="tomador"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.tomador}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="tipoexpedicion" className="text-sm font-medium text-gray-800">
                Tipo de expedición
              </label>
              <Select
                name="tipoexpedicion"
                className="text-sm"
                options={tiposExpedicion}
                value={
                  tiposExpedicion.find((opt) => opt.value === formStates.tipoexpedicion) ||
                  null
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

            <div className="flex flex-col w-full">
              <label htmlFor="fechainiciovigdesde" className="text-sm font-medium text-gray-800">
                Fecha inicio de vigencia desde
              </label>
              <input
                type="date"
                name="fechainiciovigdesde"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.fechainiciovigdesde}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="fechafinvighasta" className="text-sm font-medium text-gray-800">
                Fecha inicio de vigencia hasta
              </label>
              <input
                type="date"
                name="fechafinvighasta"
                className="h-[35px] w-full rounded-md border border-gray-300 px-2 text-sm text-gray-900 focus:outline-none"
                value={formStates.fechafinvighasta}
                onChange={(e) =>
                  setFormStates((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <label htmlFor="estadoliquidacion" className="text-sm font-medium text-gray-800">
                Estado conciliación
              </label>
              <Select
                name="estadoliquidacion"
                className="text-sm"
                options={estadoConciliacionOptions}
                value={
                  estadoConciliacionOptions.find(
                    (opt) => opt.value === formStates.estadoliquidacion,
                  ) || null
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

            <div className="flex flex-col w-full">
              <label htmlFor="usuario" className="text-sm font-medium text-gray-800">
                Intermediario
              </label>
              <Select
                name="usuario"
                className="text-sm"
                options={usuariosInput}
                value={usuariosInput.find((opt) => opt.value === formStates.usuario) || null}
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

            <div className="flex items-end w-full">
              <BtnGeneral
                id={"btnConsultarConciliacion"}
                className={
                  "bg-lime-9000 text-white w-full h-[35px] rounded-md hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={() => handlerLoadPolizasUser()}
              >
                <span>Consultar</span>
              </BtnGeneral>
            </div>

            <div className="flex items-end w-full">
              <BtnGeneral
                id={"btnLimpiarConciliacion"}
                className={
                  "bg-black text-white w-full h-[35px] rounded-md hover:bg-gray-700 transition duration-300 ease-in-out"
                }
                funct={() => cleanTableAndFilters()}
              >
                <span>Limpiar</span>
              </BtnGeneral>
            </div>

            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
          </div>
        </section>

        <section className="mt-4 flex justify-center">
          <input
            type="text"
            placeholder="Buscar"
            className="h-6 w-32 rounded border border-gray-300 px-2 text-center text-xs text-gray-700 focus:outline-none"
            readOnly
          />
        </section>

        <section className="mt-3 rounded border border-gray-200 bg-white">
          <TableComisiones
            data={polizas ?? []}
            headers={headersDirectos}
            from=""
            onRowAction={() => {}}
            onToggleSelect={handleToggleSelect}
            onTogglePageSelect={handleTogglePageSelect}
            setIsLoading={setLoading}
            loading={loading}
          />
        </section>
      </Box>
    </div>
  );
};
