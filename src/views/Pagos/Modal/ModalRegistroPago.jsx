import { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { GeneralBox } from "../../../components/GeneralBox/GeneralBox";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";

const ModalRegistroPago = ({
  show,
  onClose,
  selectedLiquidaciones,
  setIsLoading,
  onRegister,
}) => {
  const nav = useNavigate();
  const [fechaPago, setFechaPago] = useState("");

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
    if (selectedLiquidaciones.length === 0) {
      Swal.fire("Error", "No hay liquidaciones seleccionadas", "error").then(
        () => {
          onClose?.();
        }
      );
    }
  }, [selectedLiquidaciones, onClose]);

  if (selectedLiquidaciones.length === 0) return null;

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",
    padding: "24px",
    zIndex: 6000,
  };

  const panelStyle = {
    position: "relative",
    maxWidth: "1300px",
    width: "100%",
  };

  const handleSaveSettlement = async () => {
    if (fechaPago && fechaPago !== "") {
      // Lógica para guardar la liquidación con la fecha de pago
      onRegister();
      return;
    }
    Swal.fire("Error", "Debe ingresar una fecha de pago", "error");
    return;
  };

  const content = (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <GeneralBox
          textButton={["X"]}
          width={"lg:w-1/3 md:w-2/3 sm:w-2/3"}
          onClose={onClose}
          classname={"shadow-lg"}
          headerBox={true}
        >
          <div className="bg-white pl-4 pr-4 pb-4 pt-3 w-full">
            <div className="flex flex-row justify-end -mt-2">
              <button onClick={onClose} className="text-lg">
                x
              </button>
            </div>
            <section className="text-center pt-5">
              <p>
                Ha seleccionado {selectedLiquidaciones.length} liquidaci
                {selectedLiquidaciones.length > 1 ? "ones" : "ón"}. Ingresa
                fecha de pago
              </p>
              <div className="flex flex-row justify-center mt-9 items-center gap-3">
                <p>Fecha de pago</p>
                <input
                  type="date"
                  name="fechainiciovigencia"
                  className="text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[35px] rounded-md p-2"
                  value={fechaPago}
                  onKeyDown={(e) => e.preventDefault()}
                  max={new Date().toISOString().split("T")[0]} // NO permite fechas futuras
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </section>
            <section className="flex justify-center items-center gap-2 mt-14 mb-6">
              <BtnGeneral
                funct={onClose}
                className={
                  "bg-gray-300 text-black border-gray-600 py-[7.5px] px-10 border-0 rounded hover:bg-gray-400 transition duration-300 ease-in-out"
                }
              >
                Salir
              </BtnGeneral>
              <BtnGeneral
                funct={() => handleSaveSettlement()}
                className={
                  "bg-lime-9000 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
              >
                Guardar
              </BtnGeneral>
            </section>
          </div>
        </GeneralBox>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ModalRegistroPago;
