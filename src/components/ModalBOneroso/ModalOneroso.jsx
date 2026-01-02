import { useEffect } from "react";
import { createBeneficiario } from "../../services/Polizas/createBeneficiario";
import Swal from "sweetalert2";

export const ModalOneroso = ({
  show,
  onClose,
  onChange,
  setBeneficiarios,
  nuevoBeneficiario,
  setNuevoBeneficiario,
}) => {
  // Efecto para manejar el scroll del fondo
  useEffect(() => {
    if (show) {
      // Desactiva scroll del fondo
      document.body.style.overflow = "hidden";
    } else {
      // Restaura scroll
      document.body.style.overflow = "";
    }
    // Limpieza al desmontar
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

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
      alignItems: "flex-start",
      zIndex: 5000,
      overflowY: "auto",
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      minWidth: "400px",
      maxWidth: "400px",
      maxHeight: "100vh", // Cambiado aquí
      //   overflowY: "auto",   // Scroll interno si hay overflow
      boxShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
      marginLeft: "20px",
      marginTop: "30px",
      marginBottom: "20px",
      display: "flex",
      flexDirection: "column",
    },
    button: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#88D600",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "20px",
    },
    buttonClose: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      //   backgroundColor: "#ccc",
      //   color: "#fff",
      //   border: "1px solid #888",
      width: "80px",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "20px",
    },
  };

  if (!show) return null;

  const handleCreateBeneficiario = async () => {
    // Aquí puedes manejar la lógica para crear el beneficiario

    await createBeneficiario(nuevoBeneficiario)
      .then((response) => {
        if (
          response.message ==
          "El NIT ya existe y los correos son iguales. No se realizaron cambios."
        ) {
          Swal.fire({
            icon: "info",
            title: "Sin modificación",
            text: "El beneficiario no se ha modificado.",
          });
          onClose();
        } else if (response.message == "Beneficiario creado exitosamente") {
          Swal.fire({
            icon: "success",
            title: "Beneficiario creado",
            text: "El beneficiario ha sido creado exitosamente.",
          });
          setBeneficiarios((prev) => ({ ...prev, nuevoBeneficiario }));
          setNuevoBeneficiario({
            tipoIdentificacion: "1",
            numeroIdentificacion: "",
            razon_social: "",
            correo1: "",
            correo2: "",
            observaciones: "",
          });
          onClose();
        } else if (
          response.message ==
          "El NIT ya existe pero los correos son distintos. Se requiere confirmación para actualizar."
        ) {
          Swal.fire({
            icon: "info",
            title: "Autorización requerida",
            text: "La actualización de los correos requiere autorización.",
          });
          onClose();
        }
      })
      .catch((error) => {
        console.error("Error al crear beneficiario:", error);
      });

    // onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div className="bg-lime-9000 w-full p-3 text-white font-semibold text-[17px] rounded-tl-lg rounded-tr-lg">
          <p>Beneficiario</p>
        </div>
        <div className="pl-14 pr-14 pt-5 h-auto">
          <div className="flex flex-row gap-9 justify-between">
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor="tipoIdentificacionBeneficiario"
                className="text-gray-500"
              >
                Tipo identificación
              </label>
              <select
                id="tipoIdentificacionBeneficiario"
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-1"
              >
                <option value="1">NIT</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="nombreBeneficiario" className="text-gray-500">
                Documento
              </label>
              <input
                type="text"
                id="nombreBeneficiario"
                value={nuevoBeneficiario.numeroIdentificacion || ""}
                onChange={(e) => {
                  onChange("numeroIdentificacion", e.target.value);
                  setNuevoBeneficiario((prev) => ({
                    ...prev,
                    numeroIdentificacion: e.target.value,
                  }));
                }}
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-5">
            <label htmlFor="nombreBeneficiario" className="text-gray-500">
              Nombre / Razón social
            </label>
            <input
              type="text"
              id="nombreBeneficiario"
              value={nuevoBeneficiario.razon_social || ""}
              onChange={(e) => {
                onChange("nombre", e.target.value);
                setNuevoBeneficiario((prev) => ({
                  ...prev,
                  razon_social: e.target.value,
                }));
              }}
              className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
            />
          </div>
          <div className="flex flex-col gap-1 mt-5">
            <label htmlFor="correoBeneficiario1" className="text-gray-500">
              Correo electrónico 1
            </label>
            <input
              type="text"
              id="correoBeneficiario1"
              className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
              value={nuevoBeneficiario.correo1 || ""}
              onChange={(e) =>
                setNuevoBeneficiario((prev) => ({
                  ...prev,
                  correo1: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1 mt-5">
            <label htmlFor="correoBeneficiario2" className="text-gray-500">
              Correo electrónico 2
            </label>
            <input
              type="text"
              id="correoBeneficiario2"
              className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
              value={nuevoBeneficiario.correo2 || ""}
              onChange={(e) =>
                setNuevoBeneficiario((prev) => ({
                  ...prev,
                  correo2: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-1 mt-5">
            <label
              htmlFor="observacionesBeneficiario"
              className="text-gray-500"
            >
              Observaciones
            </label>
            <input
              type="text"
              id="observacionesBeneficiario"
              className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
              value={nuevoBeneficiario.observaciones || ""}
              onChange={(e) =>
                setNuevoBeneficiario((prev) => ({
                  ...prev,
                  observaciones: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-row gap-4 justify-between mt-5">
            <button
              style={styles.buttonClose}
              className="border-[1.5px] border-gray-400 bg-gray-100 text-black"
              onClick={onClose}
            >
              Salir
            </button>
            <button style={styles.button} onClick={handleCreateBeneficiario}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
