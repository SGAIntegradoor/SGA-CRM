import {
  LiaIdCard,
  LiaUser,
  LiaHomeSolid,
  LiaTransgenderSolid,
  LiaMobileSolid,
  LiaEnvelope,
} from "react-icons/lia";
import { useContext, useEffect, useRef, useState } from "react";
import { mapaDepartamentos } from "../../utils/getDepto";
import { obtenerCiudades } from "../../utils/getCities";
import { RowDirecciones } from "./Direcciones/rowDirecciones";
import { RowCellEmail } from "./Footer/rowCellEmail";
import BtnGeneral from "../BtnGeneral/BtnGeneral";
import { createClient } from "../../services/Clientes/createCliente";
import { NavContext } from "../../context/NavContext";
import { getClientEdit } from "../../services/Clientes/getCliente";
import useValidateClient from "../../hooks/Clients/useValidateClient";
import Swal from "sweetalert2";
import { updateClient } from "../../services/Clientes/updateCliente";
import { getClientById } from "../../services/Clientes/getClientById";
import { getClientByIdIntegradoor } from "../../services/Clientes/getClientByIdIntegradoor";
import { capitalizeWords } from "../../utils/utils";

const ModalCliente = ({
  show,
  onClose,
  userData,
  setIsLoading,
  setReloadScreen = null,
  reloadScreen = null,
  from = null,
  idClienteIntegradoor,
  setIdClienteIntegradoor,
  documentoTemp,
  setDocumentoTemp,
  procedenciaCliente = null,
  setProcedenciaCliente,
  setDatosUsuarios = null,
  searchMethod,
}) => {
  const {
    selectedClientId,
    setSelectedClientId,
    isModalOpenCliente,
    setIsModalOpenCliente,
    isNewClient,
    setNewClient,
  } = useContext(NavContext);

  const { validateClientData } = useValidateClient();
  const [documento, setDocumento] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("1"); // 1: CC, 2: NIT
  const [bodyToCreate, setBodyToCreate] = useState({});
  const [genero, setGenero] = useState("1"); // 1: Masculino, 2: Femenino
  const [estadoCivil, setEstadoCivil] = useState("1");
  const [procedencia, setProcedencia] = useState("1");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [razonSocial, setRazonSocial] = useState(""); // <-- NUEVO
  const [inputLoader, setInputLoader] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(documento);
  const [clientById, setClientById] = useState(null);
  const [clienteTemp, setClienteTemp] = useState(null);

  const toISODate = (s) => {
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
    const m2 = s.match(/^(\d{4})[\/.](\d{2})[\/.](\d{2})$/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
    return s;
  };

  const [errors, setErrors] = useState("");

  const [direccion, setDireccion] = useState({
    numero1: "",
    numero2: "",
    numero3: "",
    numero4: "",
    numero5: "",
  });

  const [departamento, setDepartamento] = useState({
    departamento1: "",
    departamento2: "",
    departamento3: "",
    departamento4: "",
    departamento5: "",
  });

  const [ciudad, setCiudad] = useState({
    ciudad1: "",
    ciudad2: "",
    ciudad3: "",
    ciudad4: "",
    ciudad5: "",
  });

  const [ciudadesDisponibles, setCiudadesDisponibles] = useState({
    ciudad1: [],
    ciudad2: [],
    ciudad3: [],
    ciudad4: [],
    ciudad5: [],
  });

  const [principalSeleccionado, setPrincipalSeleccionado] = useState("");

  const [celular, setCelular] = useState({
    celular1: "",
    celular2: "",
    celular3: "",
    celular4: "",
    celular5: "",
  });

  const [principalCelularSeleccionado, setPrincipalCelularSeleccionado] =
    useState("");

  const [email, setEmail] = useState({
    email1: "",
    email2: "",
    email3: "",
    email4: "",
    email5: "",
  });

  const [principalEmailSeleccionado, setPrincipalEmailSeleccionado] =
    useState("");

  const prevValues = useRef({
    email,
    celular,
    ciudad,
    direccion,
    departamento,
  });

  const handlerLoadClient = async (id, granted) => {
    setIsModalOpenCliente(true);
    try {
      const response = await getClientEdit(id, granted);
      return response.data;
    } catch (error) {
      console.error("Error al cargar cliente:", error);
      throw error;
    }
  };

  const handleDepartamentoChange = async (campo, value) => {
    setDepartamento((prev) => ({
      ...prev,
      [campo]: value,
    }));

    const num = campo.replace("departamento", "");
    const ciudades = await obtenerCiudades(value);

    setCiudadesDisponibles((prev) => ({
      ...prev,
      [`ciudad${num}`]: ciudades,
    }));

    setCiudad((prev) => ({
      ...prev,
      [`ciudad${num}`]: "",
    }));
  };

  const handleSearchClienteIntegradoor = async (document) => {
    if (document.trim() === "") {
      return;
    }
    setIsLoading(true);
    try {
      const response = await getClientByIdIntegradoor(document);
      if (response && response.status === "Ok") {
        setNombre(response.data.nombres || "");
        setApellido(response.data.apellidos || "");
        setTipoDocumento(response.data.tipoDocumento || "1");
        setDocumento(response.data.documento || "");
        setEstadoCivil(response.data.estadoCivil || "1");
        setFechaNacimiento(toISODate(response.data.fechaNacimiento || ""));
        setGenero(response.data.genero || "1");
        setEstadoCivil(response.data.estadoCivil || "1");

        setInputLoader(false);
        setIsLoading(false);

        if (response.data == "Cliente Nuevo") {
          setErrors(
            "No se encontraron los datos del prospecto, debes ingresarlos desde 0"
          );
          setDocumento(document);
        } else {
          if (procedenciaCliente !== null) {
            setProcedenciaCliente({
              procedenciaCliente: "Prospectos",
              data: response.data,
              system: "2",
              idCliente: response.data.id_cliente,
            });
          }
          setIdClienteIntegradoor(true);
        }
      } else {
        setErrors(
          "No se encontraron los datos del prospecto, debes ingresarlos desde 0"
        );
      }
    } catch (error) {
      console.error("Error al buscar cliente en Integradoor:", error);
      setClienteTemp(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EMAILS ---
  useEffect(() => {
    const prevEmail = prevValues.current.email;

    let newEmailState = { ...email };

    for (let i = 1; i <= 5; i++) {
      const key = `email${i}`;
      if (newEmailState[key] === "") {
        for (let j = i; j < 5; j++) {
          newEmailState[`email${j}`] = newEmailState[`email${j + 1}`];
        }
        newEmailState[`email5`] = "";
        break;
      }
    }

    if (JSON.stringify(email) !== JSON.stringify(prevEmail)) {
      const principalEmailKey = principalEmailSeleccionado;
      setEmail(newEmailState);
      if (
        principalEmailKey &&
        email[`email${principalEmailKey.slice(-1)}`]?.trim() === ""
      ) {
        const nuevoPrincipal = Object.entries(email).find(
          ([_, value]) => value.trim() !== ""
        );

        if (nuevoPrincipal) {
          setPrincipalEmailSeleccionado(`principalEmail1`);
        } else {
          setPrincipalEmailSeleccionado("");
        }
      }
    }

    prevValues.current = {
      ...prevValues.current,
      email,
    };
  }, [email, principalEmailSeleccionado]);

  // --- CELULARES ---
  useEffect(() => {
    const prevCelular = prevValues.current.celular;

    let newCelularState = { ...celular };

    for (let i = 1; i <= 5; i++) {
      const key = `celular${i}`;
      if (newCelularState[key] === "") {
        for (let j = i; j < 5; j++) {
          newCelularState[`celular${j}`] = newCelularState[`celular${j + 1}`];
        }
        newCelularState[`celular5`] = "";
        break;
      }
    }

    if (JSON.stringify(celular) !== JSON.stringify(prevCelular)) {
      const principalCelularKey = principalCelularSeleccionado;
      setCelular(newCelularState);

      if (
        principalCelularKey &&
        celular[`celular${principalCelularKey.slice(-1)}`]?.trim() === ""
      ) {
        const nuevoPrincipal = Object.entries(celular).find(
          ([_, value]) => value.trim() !== ""
        );
        if (nuevoPrincipal) {
          setPrincipalCelularSeleccionado(`principalCelular1`);
        } else {
          setPrincipalCelularSeleccionado("");
        }
      }
    }

    prevValues.current = {
      ...prevValues.current,
      celular,
    };
  }, [celular, principalCelularSeleccionado]);

  // --- CARGA INICIAL CLIENTE SELECCIONADO ---
  useEffect(() => {
    if (selectedClientId) {
      setIsLoading(true);
      handlerLoadClient(selectedClientId, userData["Editaruncliente"])
        .then(async (response) => {
          if (response) {
            if (from !== "polizas") {
              setNombre(response.nombres || "");
              setApellido(response.apellidos || "");
              setRazonSocial(
                `${response.nombres || ""} ${response.apellidos || ""}`.trim()
              );
              setTipoDocumento(response.tipoDocumento || "1");
              setDocumento(response.documento || "");
              setFechaNacimiento(toISODate(response.fechaNacimiento || ""));
              setGenero(response.genero || "1");
              setEstadoCivil(response.estadoCivil || "");
              setProcedencia(response.procedencia || "");

              setDireccion({
                numero1: response.direcciones[0] || "",
                numero2: response.direcciones[1] || "",
                numero3: response.direcciones[2] || "",
                numero4: response.direcciones[3] || "",
                numero5: response.direcciones[4] || "",
              });

              setDepartamento({
                departamento1: response.departamentos[0] || "",
                departamento2: response.departamentos[1] || "",
                departamento3: response.departamentos[2] || "",
                departamento4: response.departamentos[3] || "",
                departamento5: response.departamentos[4] || "",
              });

              setCiudad({
                ciudad1: response.ciudades[0] || "",
                ciudad2: response.ciudades[1] || "",
                ciudad3: response.ciudades[2] || "",
                ciudad4: response.ciudades[3] || "",
                ciudad5: response.ciudades[4] || "",
              });

              setCelular({
                celular1: response.celulares[0] || "",
                celular2: response.celulares[1] || "",
                celular3: response.celulares[2] || "",
                celular4: response.celulares[3] || "",
                celular5: response.celulares[4] || "",
              });

              setEmail({
                email1: response.emails[0] || "",
                email2: response.emails[1] || "",
                email3: response.emails[2] || "",
                email4: response.emails[3] || "",
                email5: response.emails[4] || "",
              });

              setPrincipalSeleccionado(response.departamentoSelected || "");
              setPrincipalCelularSeleccionado(
                response.principalCelularSeleccionado || ""
              );
              setPrincipalEmailSeleccionado(
                response.principalEmailSeleccionado || ""
              );
              setDebouncedValue("");
              setInputLoader(false);
            } else {
              setNombre(response.nombres || "");
              setApellido(response.apellidos || "");
              setTipoDocumento(response.tipoDocumento || "1");
              setDocumento(response.documento || "");
              setFechaNacimiento(toISODate(response.fechaNacimiento || ""));
              setGenero(response.genero || "");

              setDireccion({
                numero1: response.direcciones[0] || "",
                numero2: response.direcciones[1] || "",
                numero3: response.direcciones[2] || "",
                numero4: response.direcciones[3] || "",
                numero5: response.direcciones[4] || "",
              });

              setDepartamento({
                departamento1: response.departamentos[0] || "",
                departamento2: response.departamentos[1] || "",
                departamento3: response.departamentos[2] || "",
                departamento4: response.departamentos[3] || "",
                departamento5: response.departamentos[4] || "",
              });

              setCiudad({
                ciudad1: response.ciudades[0] || "",
                ciudad2: response.ciudades[1] || "",
                ciudad3: response.ciudades[2] || "",
                ciudad4: response.ciudades[3] || "",
                ciudad5: response.ciudades[4] || "",
              });

              setCelular({
                celular1: response.celulares[0] || "",
                celular2: response.celulares[1] || "",
                celular3: response.celulares[2] || "",
                celular4: response.celulares[3] || "",
                celular5: response.celulares[4] || "",
              });

              setEmail({
                email1: response.emails[0] || "",
                email2: response.emails[1] || "",
                email3: response.emails[2] || "",
                email4: response.emails[3] || "",
                email5: response.emails[4] || "",
              });

              setPrincipalSeleccionado(response.departamentoSelected || "");
              setPrincipalCelularSeleccionado(
                response.principalCelularSeleccionado || ""
              );
              setPrincipalEmailSeleccionado(
                response.principalEmailSeleccionado || ""
              );
              setDebouncedValue("");
              setInputLoader(false);
            }
          }
        })
        .catch((error) => {
          console.error("Error al cargar los datos del cliente:", error);
          setIsLoading(false);
        })
        .finally(() => {
          setIsLoading(false);

          const body = {
            id: selectedClientId,
            nombres: nombre,
            apellidos: apellido,
            tipoDocumento,
            documento,
            fechaNacimiento,
            genero,
            estadoCivil: estadoCivil == "" ? null : estadoCivil,
            procedencia,
            direcciones: Object.values(direccion),
            departamentos: Object.values(departamento),
            ciudades: Object.values(ciudad),
            celulares: Object.values(celular),
            emails: Object.values(email),
            principalSeleccionado,
            principalCelularSeleccionado,
            principalEmailSeleccionado,
          };
          setBodyToCreate(body);
        });
    }
  }, [selectedClientId]);

  // --- BLOQUEAR SCROLL FONDO ---
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  // --- CARGAR CIUDADES INICIALES ---
  useEffect(() => {
    if (show) {
      const cargarCiudadesIniciales = async () => {
        for (let i = 1; i <= 5; i++) {
          const dep = departamento[`departamento${i}`];
          if (dep) {
            const ciudades = await obtenerCiudades({ value: dep })
              .then((data) => data)
              .finally(() => {
                setIsLoading(false);
              });
            setCiudadesDisponibles((prev) => ({
              ...prev,
              [`ciudad${i}`]: ciudades,
            }));
            setIsLoading(false);
          }
        }
        setIsLoading(false);
      };

      setIsLoading(true);
      setTimeout(() => {
        cargarCiudadesIniciales();
      }, 2000);
    }
  }, [departamento, show, setIsLoading]);

  // --- DEBOUNCE DOCUMENTO ---
  useEffect(() => {
    const cleanDoc = documento.trim();

    if (!isNewClient) {
      return;
    }

    if (!cleanDoc) {
      setDebouncedValue("");
      setInputLoader(false);
      return;
    }

    setInputLoader(true);

    const handler = setTimeout(() => {
      setDebouncedValue(cleanDoc);
    }, 2000); // 2s

    return () => {
      clearTimeout(handler);
    };
  }, [documento]);

  // --- FETCH CLIENTE POR DOCUMENTO ---
  useEffect(() => {
    if (!debouncedValue) return;

    let cancelled = false;

    const fetchCliente = async () => {
      try {
        setClientById("");
        const response = await getClientById(
          userData["Editaruncliente"],
          debouncedValue
        );
        if (!cancelled) {
          setClientById(response.data);
        }
      } catch (error) {
        console.error("Error en getClientById:", error);
        if (!cancelled) {
          setClientById(null);
        }
      } finally {
        if (!cancelled) {
          setInputLoader(false);
        }
      }
    };

    fetchCliente();

    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  if (!show) return null;

  const handleChangeTypeDocument = (e) => {
    setTipoDocumento(e.target.value);
    setDocumento("");
    setFechaNacimiento("");
  };

  const optionsDeptos = Object.entries(mapaDepartamentos).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  // ==== NUEVA LÓGICA: separar NIT y DV visualmente ====
  // DESPUÉS
  let nitBase = "";
  let nitDV = "";

  if (tipoDocumento === "2" && documento) {
    if (documento.length <= 9) {
      // Mientras no haya suficiente longitud, todo es base
      nitBase = documento;
      nitDV = "";
    } else {
      // Si ya viene NIT+DV (ej: pegado), se separa el último dígito
      nitBase = documento.slice(0, -1);
      nitDV = documento.slice(-1);
    }
  }

  const handleNitBaseChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    let base = raw;
    let dv = nitDV;

    // Si pega NIT completo (ej: 9006004708), el último dígito pasa a DV
    if (raw.length > 9) {
      base = raw.slice(0, -1);
      dv = raw.slice(-1);
    }

    setDocumento(base + dv);
  };

  // useEffect(() => {
  //   console.log(searchMethod)
  // }, [searchMethod])

  const handleNitDVChange = (e) => {
    let dv = e.target.value.replace(/[^\d]/g, "");
    if (dv.length > 1) dv = dv.slice(-1); // solo 1 dígito
    const base = nitBase;
    setDocumento(base + dv);
  };
  // ====================================================

  const handleSave = async () => {
    const fechaNacimientoInput =
      document.querySelector("#fechaNacimiento")?.value ?? "";
    const fechaNacimientoSafe = toISODate(
      fechaNacimientoInput || fechaNacimiento || ""
    );

    let nombresToSend = nombre;
    let apellidosToSend = apellido;

    // Solo si es NIT, partimos la razón social
    if (tipoDocumento === "2" && razonSocial.trim()) {
      const parts = razonSocial.trim().split(" ");
      nombresToSend = parts.shift() || "";
      apellidosToSend = parts.join(" ");
    }

    const body = {
      nombres: nombresToSend,
      apellidos: apellidosToSend,
      tipoDocumento,
      documento,
      fechaNacimiento: fechaNacimientoSafe,
      genero,
      estadoCivil,
      procedencia,
      direcciones: Object.values(direccion),
      departamentos: Object.values(departamento),
      ciudades: Object.values(ciudad),
      celulares: Object.values(celular),
      principalSeleccionado,
      principalCelularSeleccionado,
      principalEmailSeleccionado,
      emails: Object.values(email),
    };

    const validation = validateClientData(body);
    if (!validation.isValid) {
      console.error("Errores de validación:", validation.error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: validation.error,
        willOpen: () => {
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "5001";

          const popup = document.querySelector(".swal2-popup");
          if (popup) popup.style.zIndex = "5002";
        },
      });
      return;
    }

    try {
      if (selectedClientId) {
        const response = await updateClient(
          selectedClientId,
          body,
          userData["Editaruncliente"]
        );
        if (response.status === "Ok") {
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text:
              response.message_cliente || "Cliente actualizado correctamente",
            confirmButtonText: "Cerrar",
            willOpen: () => {
              const container = document.querySelector(".swal2-container");
              if (container) container.style.zIndex = "5001";
              const popup = document.querySelector(".swal2-popup");
              if (popup) popup.style.zIndex = "5002";
            },
          }).then(() => {
            setSelectedClientId(null);
            if (reloadScreen !== null) {
              setReloadScreen(!reloadScreen);
            }
            cleanFields();
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message_cliente || "Error al actualizar el cliente",
            confirmButtonText: "Cerrar",
            willOpen: () => {
              const container = document.querySelector(".swal2-container");
              if (container) container.style.zIndex = "5001";
              const popup = document.querySelector(".swal2-popup");
              if (popup) popup.style.zIndex = "5002";
            },
          });
        }
      } else {
        const response = await createClient(userData["Editaruncliente"], body);
        if (response.status === "Ok" && response.data.statusCode === 1) {
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: response.message_cliente || "Cliente creado correctamente",
            confirmButtonText: "Cerrar",
            willOpen: () => {
              const container = document.querySelector(".swal2-container");
              if (container) container.style.zIndex = "5001";
              const popup = document.querySelector(".swal2-popup");
              if (popup) popup.style.zIndex = "5002";
              if (setDatosUsuarios != null) {
                const nombreCompleto =
                  tipoDocumento === "2" && razonSocial.trim()
                    ? razonSocial.trim()
                    : `${nombre} ${apellido}`.trim();

                if (searchMethod == "Asegurado") {
                  setDatosUsuarios({
                    Asegurado: {
                      tipoIdentificacion: tipoDocumento,
                      numeroIdentificacion: documento,
                      nombre: nombreCompleto,
                    },
                  });
                } else if (searchMethod == "Tomador") {
                  setDatosUsuarios({
                    Tomador: {
                      tipoIdentificacion: tipoDocumento,
                      numeroIdentificacion: documento,
                      nombre: nombreCompleto,
                    },
                  });
                }
              }
            },
          }).then(() => {
            if (reloadScreen !== null) {
              setReloadScreen(!reloadScreen);
            }
            cleanFields();
          });
        } else {
          if (response.data.statusCode == 1062) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Ya existe un cliente con este numero de identificación en la base de datos, Por favor valide los datos e intentelo nuevamente",
              confirmButtonText: "Cerrar",
              willOpen: () => {
                const container = document.querySelector(".swal2-container");
                if (container) container.style.zIndex = "5001";
                const popup = document.querySelector(".swal2-popup");
                if (popup) popup.style.zIndex = "5002";
              },
            });
            return;
          }
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.data.message || "Error al crear el cliente",
            confirmButtonText: "Cerrar",
            willOpen: () => {
              const container = document.querySelector(".swal2-container");
              if (container) container.style.zIndex = "5001";
              const popup = document.querySelector(".swal2-popup");
              if (popup) popup.style.zIndex = "5002";
            },
          });
          if (reloadScreen !== null) {
            setReloadScreen(!reloadScreen);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Error al crear o actualizar el cliente:", error);
    }
  };

  const cleanFields = () => {
    setNombre("");
    setApellido("");
    setTipoDocumento("1");
    setDocumento("");
    setFechaNacimiento("");
    setGenero("1");
    setEstadoCivil("1");
    setProcedencia("1");
    setDireccion({
      numero1: "",
      numero2: "",
      numero3: "",
      numero4: "",
      numero5: "",
    });
    setDepartamento({
      departamento1: "",
      departamento2: "",
      departamento3: "",
      departamento4: "",
      departamento5: "",
    });
    setCiudad({
      ciudad1: "",
      ciudad2: "",
      ciudad3: "",
      ciudad4: "",
      ciudad5: "",
    });
    setCelular({
      celular1: "",
      celular2: "",
      celular3: "",
      celular4: "",
      celular5: "",
    });
    setEmail({
      email1: "",
      email2: "",
      email3: "",
      email4: "",
      email5: "",
    });
    setPrincipalSeleccionado("");
    setPrincipalCelularSeleccionado("");
    setPrincipalEmailSeleccionado("");

    onClose();
    setClienteTemp(null);
    setErrors("");
    setSelectedClientId(null);
    setClientById(null);
  };

  return (
    <div style={styles.backdrop}>
      <div
        style={{
          ...styles.modal,
          height:
            (idClienteIntegradoor === "Cliente Nuevo" || isNewClient) &&
            (from === "polizas" || from === "clientes")
              ? "1350px"
              : undefined,
          maxHeight:
            (idClienteIntegradoor === "Cliente Nuevo" || isNewClient) &&
            (from === "polizas" || from === "clientes")
              ? "1350px"
              : undefined,
        }}
        className={`flex flex-col items-center`}
      >
        <div className="flex w-full justify-end">
          <button
            className="flex flex-row text-gray-400 hover:text-gray-700 font-bold text-lg"
            onClick={cleanFields}
          >
            X
          </button>
        </div>
        {(from === "polizas" || from === "clientes") &&
        (idClienteIntegradoor === "Cliente Nuevo" || isNewClient) ? (
          <div className="flex flex-col justify-start w-full pl-2 mb-3">
            <p className="text-left text-md text-gray-500">
              Documento no existe en el CRM. ¿Deseas consultar si existe
              información de la base de prospectos?
            </p>
            <div className="flex flex-row items-center gap-4">
              <input
                type="text"
                id="Documento"
                value={documentoTemp || ""}
                onChange={(e) => setDocumentoTemp(e.target.value)}
                placeholder="Documento"
                className="peer w-[120px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 pl-2 mt-6"
              />
              <BtnGeneral
                funct={() => handleSearchClienteIntegradoor(documentoTemp)}
                className="bg-lime-9000 text-white px-10 py-2 rounded mt-4 hover:bg-lime-600 transition duration-300 ease-in-out"
                disabled={inputLoader || documento === ""}
              >
                Consultar
              </BtnGeneral>
            </div>
            <p className="text-black italic mt-5">{errors}</p>
          </div>
        ) : null}
        <div className="flex justify-between w-full border-b h-[60px] pl-2 pr-2">
          <p className="align-middle text-lg mt-7 text-black">Crear/Editar</p>
        </div>

        <div className=" ml-6 flex flex-row w-full items-center gap-8  justify-between">
          <LiaIdCard size={"61"} className="mt-7" />
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-md">Tipo de documento:</label>
            <select
              className="w-[200px] h-[40.8px] border border-gray-300 rounded-sm pr-6 pl-2 text-sm"
              value={tipoDocumento}
              onChange={handleChangeTypeDocument}
            >
              <option value="">Seleccione una opción</option>
              <option value="1">CC</option>
              <option value="2">NIT</option>
              <option value="3">CE</option>
              <option value="4">Pasaporte</option>
            </select>
          </div>

          {/* CAMPO DOCUMENTO / NIT + DV */}
          <div className="relative w-64">
            {tipoDocumento === "2" ? (
              <div className="flex items-end gap-2 mt-[38px]">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10} // permite pegar NIT+DV, luego se separa
                  id="documento-nit"
                  value={nitBase}
                  onChange={handleNitBaseChange}
                  placeholder="NIT"
                  className="peer flex-1 border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 pl-2 pb-2"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  id="documento-dv"
                  value={nitDV}
                  onChange={handleNitDVChange}
                  placeholder="DV"
                  className="w-10 border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 pb-2 text-center"
                />
              </div>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                maxLength={tipoDocumento === "1" ? 10 : 15}
                id="documento"
                value={documento}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  setDocumento(value);
                }}
                placeholder="Identificación"
                className="peer w-full border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mt-[38px] pl-2 pb-2 pr-8"
              />
            )}

            {inputLoader && (
              <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 mt-4">
                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <p className="text-red-500">
              {clientById?.documento &&
                documento !== "" &&
                "Ya existe un cliente con este documento"}
            </p>
          </div>

          <div className="w-64">
            <label className="text-gray-500 text-md mt-4">
              {tipoDocumento == 2
                ? "Fecha de constitución:"
                : "Fecha de nacimiento:"}
            </label>
            <input
              type="date"
              id="fechaNacimiento"
              placeholder="Fecha de nacimiento"
              value={fechaNacimiento}
              onInput={(e) => setFechaNacimiento(e.target.value)}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="peer w-[200px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mt-4 pl-2 pb-2"
            />
          </div>
        </div>

        <div className=" ml-6 flex flex-row w-full items-center gap-[34px]">
          <LiaUser size={"53"} className="mt-7 pl-1" />
          {tipoDocumento != "2" ? (
            <div className="flex flex-row gap-[140px] flex-1">
              <div className="w-64">
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(capitalizeWords(e.target.value))}
                  placeholder="Nombre"
                  className="peer w-[300px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mt-9 pl-2 pb-2"
                />
              </div>
              <div className="w-64">
                <input
                  type="text"
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(capitalizeWords(e.target.value))}
                  placeholder="Apellido"
                  className="peer w-[315px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 mt-9 pl-2 pb-2"
                />
              </div>
            </div>
          ) : (
            <div className="w-128">
              <input
                type="text"
                id="razonSocial"
                value={razonSocial} // <-- ANTES era `${nombre} ${apellido}`.trim()
                onChange={(e) => setRazonSocial(capitalizeWords(e.target.value))}
                placeholder="Razón Social"
                className="peer w-[315px] border-b-2 placeholder-gray-400 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 mt-9 pl-2 pb-2"
              />
            </div>
          )}
        </div>

        <div className=" ml-6 flex flex-row w-full items-center gap-[30px]">
          <LiaHomeSolid size={"53"} className="mt-7 pl-2" />
          <div className="flex flex-row items-center pl-2 pr-10 pt-10  w-full">
            <p id="numero" className="text-lg mr-16">
              #
            </p>
            <p id="direccion" className="text-md mr-32">
              Dirección
            </p>
            <p id="departamento" className="text-md mr-36">
              Departamento
            </p>
            <p id="ciudad" className="text-md mr-32">
              Ciudad
            </p>
            <p id="principal" className="text-md">
              Principal
            </p>
          </div>
        </div>

        {[1, 2, 3, 4, 5].map((num) => (
          <RowDirecciones
            key={num}
            num={num}
            direccion={direccion}
            departamento={departamento}
            ciudad={ciudad}
            setDireccion={setDireccion}
            optionsDeptos={optionsDeptos}
            handleDepartamentoChange={handleDepartamentoChange}
            setDepartamento={setDepartamento}
            ciudadesDisponibles={ciudadesDisponibles}
            setCiudad={setCiudad}
            principalSeleccionado={principalSeleccionado}
            setPrincipalSeleccionado={setPrincipalSeleccionado}
          />
        ))}
        {tipoDocumento != 2 ? (
          <div className=" ml-6 flex flex-row w-full items-center gap-7 mt-8">
            <LiaTransgenderSolid size={"53"} className="mt-7" />
            <div className="flex flex-row gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-gray-500 text-md">Genero:</label>
                <select
                  className="w-[170px] h-[40.8px] border border-gray-300 rounded-sm pr-6 pl-2 text-sm"
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="1">Masculino</option>
                  <option value="2">Femenino</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-500 text-md">Estado Civil:</label>
                <select
                  className="w-[170px] h-[40.8px] border border-gray-300 rounded-sm pr-6 pl-2 text-sm"
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                >
                  <option value="">Seleccione una opción</option>
                  <option value="1">Soltero (a)</option>
                  <option value="2">Casado (a)</option>
                  <option value="3">Viudo (a)</option>
                  <option value="4">Divorciado (a)</option>
                  <option value="5">Unión Libre</option>
                  <option value="6">Separado (a)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}

        <div className=" ml-[115px] flex flex-row w-11/12 items-center  gap-[30px]">
          <div className="flex flex-row items-center pt-10  w-full flex-1">
            <p id="numero" className="text-lg mr-20">
              #
            </p>
            <div
              id="celular"
              className="flex flex-row items-center gap-2 mr-[90px] ml-3"
            >
              <LiaMobileSolid size={"30"} className="" />
              Celular
            </div>
            <p id="principal" className="text-md mr-16">
              Principal
            </p>
            <div id="email" className="flex flex-row items-center gap-4">
              <LiaEnvelope size={"30"} className="" />
              Correo Electrónico
            </div>
            <p id="principal" className="text-md ml-16">
              Principal
            </p>
          </div>
        </div>

        {[1, 2, 3, 4, 5].map((num) => (
          <RowCellEmail
            key={num}
            num={num}
            email={email}
            setEmail={setEmail}
            celular={celular}
            setCelular={setCelular}
            principalCelularSeleccionado={principalCelularSeleccionado}
            setPrincipalCelularSeleccionado={setPrincipalCelularSeleccionado}
            principalEmailSeleccionado={principalEmailSeleccionado}
            setPrincipalEmailSeleccionado={setPrincipalEmailSeleccionado}
          />
        ))}

        <div className="flex flex-row justify_between w-full mt-24 pl-10 pr-10 justify-between">
          <BtnGeneral
            className={
              "bg-gray-300 text-white border px-10 py-2 rounded mt-4 hover:bg-gray-400 transition duration-300 ease-in-out"
            }
            funct={cleanFields}
          >
            Cerrar
          </BtnGeneral>
          <BtnGeneral
            className={
              "bg-lime-9000 text-white px-10 py-2 rounded mt-4 hover:bg-lime-600 transition duration-300 ease-in-out"
            }
            funct={handleSave}
          >
            {selectedClientId && idClienteIntegradoor !== "Cliente Nuevo"
              ? "Actualizar"
              : "Guardar"}
          </BtnGeneral>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    zIndex: 5000,
    overflowY: "auto",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    minWidth: "800px",
    maxWidth: "900px",
    minHeight: "1200px",
    maxHeight: "1200px",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
    marginLeft: "60px",
    marginTop: "10px",
    marginBottom: "10px",
  },
};

export default ModalCliente;
