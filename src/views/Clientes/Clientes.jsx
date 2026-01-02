import { useState, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import Select from "react-select";
import { EditNoteOutlined } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import { TableData } from "../../components/TableData/TableData";
import { retrieveClientData } from "../../services/retrieveClientData";
import ModalCliente from "../../components/ModalCliente/ModalCliente";
import { NavContext } from "../../context/NavContext";
import Loader from "../../components/LoaderFullScreen/Loader";
import { color } from "framer-motion";
import { GetClientByFilters } from "../../services/Clientes/getClientByFilters";

export const Clientes = ({ setLoading, loading }) => {
  const [clients, setClients] = useState([]);
  const [selectedOptionFiltro, setSelectedOptionFiltro] = useState("");
  const [filtros, setFiltros] = useState({
    identificacion: "",
    nombreRazon: "",
    email: "",
    telefono: "",
  });
  
  const { isModalOpenCliente, setIsModalOpenCliente, clearNewClient, isNewClient, setNewClient } = useContext(NavContext);
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [reloadScreen, setReloadScreen] = useState(false);
  const [documentTemp, setDocumentTemp] = useState("");

  const handlerLoadClients = async () => {
    setLoading(!loading);
    retrieveClientData()
      .then((response) => {
        setClients(response.data);
      })
      .catch(() => {
        console.error("Error en el fetch");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // useEffect(() => {
  //   handlerLoadClients(
  //     userData["id_usuario"],
  //     userData["Verlistadodecotizacionesdelaagencia"],
  //     userData["id_Intermediario"]
  //   );
  // }, [reloadScreen]);

  // useEffect(() => {
  //   console.log(clients);
  // }, [clients]);

  let client =
    clients?.map((item) => ({
      ...item,
      id_tipo_documento_crm:
        item?.id_tipo_documento_crm === "1"
          ? "C.C."
          : item?.id_tipo_documento_crm === "2"
          ? "NIT"
          : item?.id_tipo_documento_crm === "3"
          ? "C.E."
          : item?.id_tipo_documento_crm === "4"
          ? "Pasaporte"
          : item?.id_tipo_documento_crm === "5"
          ? "RUT"
          : item?.id_tipo_documento_crm === "6"
          ? "NIT"
          : item?.id_tipo_documento_crm === "7"
          ? "RUC"
          : item?.id_tipo_documento_crm,
      cli_genero_crm:
        item?.cli_genero_crm === "1"
          ? "Masculino"
          : item?.cli_genero_crm === "2"
          ? "Femenino"
          : item?.cli_genero_crm === "3"
          ? "No binario"
          : item?.cli_genero_crm === "4"
          ? "Prefiero no decirlo"
          : item?.cli_genero_crm,
      cli_status_crm:
        item?.cli_status_crm === "1"
          ? "Activo"
          : item?.cli_status_crm === "2"
          ? "No activo"
          : item?.cli_status_crm,
      cli_nombre_completo_crm: `${item?.cli_nombre_crm} ${item?.cli_apellidos_crm}`,
    })) ?? [];

  const headers = [
    { field: "id_cliente_crm", header: "#" },
    { field: "id_tipo_documento_crm", header: "Tipo" },
    { field: "cli_num_documento_crm", header: "Documento" },
    { field: "cli_nombre_completo_crm", header: "Nombre/Razón Social" },
    { field: "cli_fch_nacimiento_crm", header: "F. Nacimiento" },
    { field: "cli_genero_crm", header: "Genero" },
    { field: "tel_cli_crm", header: "Celular" },
    { field: "email_cli_crm", header: "Correo Electronico" },
    { field: "cli_status_crm", header: "Estado" },
  ];

  // ajustat width del select a 100px

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: 30,
      height: 35,
      width: 200,
      color: "text-gray-400",
      fontSize: 14,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      paddingTop: 4,
      paddingRight: 0,
      color: "text-gray-400",
      svg: {
        width: "18px",
        height: "16px",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    menu: (base) => ({
      ...base,
      maxHeight: "300px",
      overflowY: "auto",
      color: "text-gray-400",
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
      color: "text-gray-400",
    }),
    valueContainer: (base) => ({
      ...base,
      paddingRight: 4, // evita que la “x” empuje el texto
      width: "50%",
      color: "text-gray-400",
    }),
  };

  const handlerSearchFilters = () => {

    setLoading(!loading);
    const filtrosAplicados = {};
    if (filtros.identificacion) {
      filtrosAplicados.identificacion = filtros.identificacion;
    }
    if (filtros.nombreRazon) {
      filtrosAplicados.nombreRazon = filtros.nombreRazon;
    }
    if (filtros.email) {
      filtrosAplicados.email = filtros.email;
    }
    if (filtros.telefono) {
      filtrosAplicados.telefono = filtros.telefono;
    }
    
    // Si no hay filtros aplicados, no hacer nada
    if (Object.keys(filtrosAplicados).length == 0) {
      handlerLoadClients(
          userData["id_usuario"],
          userData["Verlistadodecotizacionesdelaagencia"],
          userData["id_Intermediario"]
      );
    } else {
      // Filtrar los clientes según los filtros aplicados
      GetClientByFilters(filtrosAplicados)
        .then((response) => {

          setClients([response.data]);
          
        })
        .catch(() => {
          console.error("Error en el fetch");
        })
        .finally(() => {
          setLoading(false);
        });
        console.log(clients)
    }

  };

  const openModal = () => {
    setIsModalOpenCliente(true);
    setNewClient(true);
  }

  const onCloseModal = () => {
    setIsModalOpenCliente(false);
    clearNewClient();
  }

  return (
    <div className="flex flex-col">
      {/* <HeaderPage title={"Clientes"} /> */}
      <Loader isLoading={loading} />
      <ModalCliente
        show={isModalOpenCliente}
        onClose={onCloseModal}
        userData={userData}
        isLoading={loading}
        setIsLoading={setLoading}
        setReloadScreen={setReloadScreen}
        reloadScreen={reloadScreen}
        documentoTemp={documentTemp}
        setDocumentoTemp={setDocumentTemp}
        from={"clientes"}
      />
      <Box pl={3} pt={4}>
        <button
          type="button"
          id="createCliente"
          className="bg-lime-9000 rounded-md text-white p-1 text-md font-bold w-[175px] h-[40px] hover:bg-lime-600 transition duration-300 ease-in-out flex items-center justify-center"
          onClick={() => openModal()}
        >
          <p>Crear Cliente</p>
        </button>
      </Box>
      <Box padding={3}>
        <section className="shadow-lg rounded-3xl xl:w-full lg:w-full">
          <div className="flex flex-row gap-3 items-center bg-gray-200 p-3 rounded-t-3xl border-gray-400 border">
            <EditNoteOutlined sx={{ fontSize: 30 }} />
            <p className="text-lg">Consulta de cliente</p>
          </div>

          <div className="flex flex-row gap-3 items-center justify-between  p-14 rounded-b-3xl border-l border-r border-b border-gray-400 h-24 text-xl">
            <div className="relative w-48">
              <input
                type="text"
                id="identificacion"
                value={filtros.identificacion}
                onChange={(e) =>
                  setFiltros({ ...filtros, identificacion: e.target.value })
                }
                placeholder="Identificación"
                className="peer w-3/4 border-b-2 border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-500 text-[14px]"
              />
              <label
                htmlFor="identificacion"
                className={`absolute left-0 transition-all text-gray-400 ${
                  filtros.identificacion
                    ? "top-[-25px] text-[14px] text-blue-500"
                    : "top-[-9px] text-[14px]"
                } peer-focus:top-[-0.75rem] peer-focus:text-sm peer-focus:text-blue-500 text-[14px]`}
              >
                Identificación:
              </label>
            </div>
            <div className="relative w-48">
              <input
                type="text"
                id="nombreRazon"
                value={filtros.nombreRazon}
                onChange={(e) =>
                  setFiltros({ ...filtros, nombreRazon: e.target.value })
                }
                placeholder="Nombre / R. Social"
                className="peer w-[130px] border-b-2 border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-500 text-[14px]"
              />
              <label
                htmlFor="nombreRazon"
                className={`absolute left-0 transition-all text-gray-400 ${
                  filtros.nombreRazon
                    ? "top-[-25px] text-[14px] text-blue-500"
                    : "top-[-9px] text-[14px]"
                } peer-focus:top-[-0.75rem] peer-focus:text-sm peer-focus:text-blue-500 text-[14px]`}
              >
                Nombre / R. Social:
              </label>
            </div>

            <div className="relative w-64">
              <Select
                name="usuario"
                className="text-sm text-gray-500"
                options={[
                  { value: "", label: "Buscar por..." },
                  { value: "1", label: "Email" },
                  { value: "2", label: "Telefono" },
                ]}
                isClearable
                value={
                  [
                    { value: "", label: "Buscar por..." },
                    { value: "1", label: "Email" },
                    { value: "2", label: "Telefono" },
                  ].find((u) => u.label === selectedOptionFiltro) || null
                }
                onChange={(selectedOption, meta) => {
                  setSelectedOptionFiltro(
                    selectedOption ? selectedOption.label : ""
                  );
                  setFiltros({ ...filtros, email: "", telefono: "" });
                }}
                styles={{ ...customStyles, color: "text-gray-400" }}
                placeholder="Buscar por..."
              />
            </div>

            <div className="relative w-64">
              <input
                type="text"
                id="valorFiltro"
                value={
                  selectedOptionFiltro === "Email"
                    ? filtros.email
                    : selectedOptionFiltro === "Telefono"
                    ? filtros.telefono
                    : ""
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    [selectedOptionFiltro.toLowerCase()]: e.target.value,
                  })
                }
                placeholder={
                  selectedOptionFiltro &&
                  selectedOptionFiltro !== "Buscar por..."
                    ? selectedOptionFiltro
                    : "Tipo de Filtro"
                }
                className="peer w-11/12 border-b-2 border-gray-300 text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-500 text-[14px]"
                disabled={selectedOptionFiltro === "" ? true : false}
              />
              <label
                htmlFor="valorFiltro"
                className={`absolute left-0 transition-all text-gray-400 ${
                  filtros.email || filtros.telefono
                    ? "top-[-25px] text-[14px] text-blue-500"
                    : "top-[-9px] text-[14px]"
                } peer-focus:top-[-0.75rem] peer-focus:text-sm peer-focus:text-blue-500 text-md text-[14px]`}
              >
                {selectedOptionFiltro &&
                selectedOptionFiltro !== "Buscar por..."
                  ? selectedOptionFiltro
                  : "Tipo de Filtro"}
                :
              </label>
            </div>

            <button
              type="button"
              id="consultarbtn"
              value={"Consultar"}
              className="bg-lime-9000 rounded-md text-white p-1 text-md font-bold w-[175px] h-[40px] hover:bg-lime-600 transition duration-300 ease-in-out flex items-center justify-center"
              onClick={handlerSearchFilters}
            >
              <div className="flex flex-row items-center justify-center">
                <SearchIcon sx={{ fontSize: 22 }} className="mr-1" />
                <p className="text-sm">Consultar</p>
              </div>
            </button>
          </div>
        </section>
        {clients.length > 0 && (
          <section className="shadow-lg rounded-3xl xl:w-full lg:w-full mt-7">
            <TableData headers={headers} data={client ?? []} from={""} numRow={10} />
          </section>
        )}
      </Box>
    </div>
  );
};
