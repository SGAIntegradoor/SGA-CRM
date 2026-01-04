import React, { useContext, useEffect, useState } from "react";
import { getAnexosPoliza } from "../../../services/Polizas/getAnexosPoliza";
import { MdModeEdit } from "react-icons/md";
import BtnGeneral from "../../../components/BtnGeneral/BtnGeneral";
import { NavContext } from "../../../context/NavContext";
import { getUser } from "../../../services/Users/getUser";

export const VerMovimientosModal = ({
  titulo,
  show,
  onClose,
  id_poliza,
  setModalMovimiento = null,
  showModalMovimiento = null,
}) => {
  const [movimientos, setMovimientos] = useState([]);

  const { loadMovimiento, movimientoContext, clearMovimiento } =
    useContext(NavContext);

  const handleMoneyChange = (name) => (e) => {
    const raw = e.target.value;
    if (formModificacion.tipomovimiento == "2") {
      if (raw.trim() === "") {
        setFormModificacion((p) => ({ ...p, [name]: "" }));
        return;
      }
      let n = parseCOP(raw);
      if (n > 0) n = -n;
      setFormModificacion((p) => ({ ...p, [name]: formatCOP(n) }));
      return;
    }

    if (name === "ivamovimiento") {
      // Si IVA se edita manual → bloquear auto
      if (raw.trim() === "") {
        setIvaManual(false);
        setFormModificacion((p) => ({ ...p, [name]: "" }));
        return;
      }
      setIvaManual(true);
    }
    if (raw.trim() === "") {
      setFormModificacion((p) => ({ ...p, [name]: "" }));
      return;
    }
    const n = parseCOP(raw);
    setFormModificacion((p) => ({ ...p, [name]: formatCOP(n) }));
  };

  // ====== Razones por tipo ======
  const fetchAnexos = async (id) => {
    if (!id) return;
    const { data } = await getAnexosPoliza(id);
    setMovimientos(data);
  };

  // ====== Carga por defecto desde el padre al abrir ======
  useEffect(() => {
    if (!show) return;
    fetchAnexos(id_poliza);
  }, [show]);

  // ====== UI ======
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;

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
      zIndex: 1010,
      overflowY: "auto",
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      minWidth: "95%",
      maxWidth: "90%",
      maxHeight: "80vh",
      boxShadow: "0 0 15px rgba(0, 0, 0, 0.3)",
      marginRight: "0px",
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
      height: "35px",
    },
    buttonClose: {
      marginTop: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#ccc",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginBottom: "20px",
      height: "35px",
    },
  };

  const onCloseModal = () => {
    onClose();
  };

  const razonesCancelacion = [
    { value: "5", label: "Decisión del cliente" },
    { value: "4", label: "Venta de vehículo" },
    { value: "3", label: "Falta de pago" },
    { value: "6", label: "Cambio de intermediario" },
  ];

  const razonesModificacion = [
    { value: "1", label: "sin ajuste de prima" },
    { value: "2", label: "Con ajuste de prima" },
  ];

  const tipoMovimiento = [
    {
      value: "1",
      tipo: "Nuevo",
      razones: [{ value: "", label: "Creación de Poliza" }],
    },
    {
      value: "2",
      tipo: "Renovación",
      razones: [{ value: "", label: "Renovación" }],
    },
    { value: "3", tipo: "Modificación", razones: razonesModificacion },
    { value: "4", tipo: "Cancelación", razones: razonesCancelacion },
  ];

  const retrieveRazon = (movimiento) => {
    const tipo = tipoMovimiento.find(
      (tm) => tm.value == movimiento.tipo_certificado
    );
    return tipo ? tipo.razones : [];
  };

  const handleGetUserName = async (id_usuario) => {
    // Aquí iría la lógica para obtener el nombre del usuario según su ID
    // Por simplicidad, retornamos el ID mismo
    const userName = await getUser(id_usuario);
    return `${userName[0].usu_nombre} ${userName[0].usu_apellido}`;
  }

  const handlerOpenModalMovimiento = (movimiento) => {
    // 1) setea ids en el contexto (asíncrono, pero no bloquea)
    loadMovimiento(movimiento.id_poliza, movimiento.id_anexo_poliza);
    // 2) abre el modal inmediatamente
    if (setModalMovimiento) setModalMovimiento(true);
    // 3) cierra el listado (usamos el onClose que recibes desde la vista)
    if (typeof onClose === "function") onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div className="bg-lime-9000 w-full p-3 text-white font-semibold text-[17px] rounded-tl-lg rounded-tr-lg">
          <p>{titulo}</p>
        </div>
        <div className="p-5">
          {" "}
          {/* separa la tabla de los bordes del modal */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-center border-2 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className=" py-3 text-[12px] font-semibold text-gray-700 border-r">
                    # ID
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Tipo Movimiento
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Certif
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Fecha de movimiento
                  </th>
                  <th className="px-2 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Razón de movimiento
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Prima
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Asistencia
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Gastos expedición
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    IVA
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Valor total
                  </th>
                  <th className="px-1 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Observaciones
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Usuario movimiento
                  </th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-700 border-r">
                    Acción
                  </th>
                </tr>
              </thead>
              {/* {console.log(movimientos)} */}
              <tbody>
                {movimientos.map((movimiento) => {
                  let reason = "";
                  if (movimiento.tipo_certificado == "4") {
                    reason =
                      retrieveRazon(movimiento).find(
                        (r) => r.value === movimiento.razon_cancelacion
                      )?.label || movimiento.razon_cancelacion;
                  } else if (movimiento.tipo_certificado == "3") {
                    reason =
                      retrieveRazon(movimiento).find(
                        (r) => r.value === movimiento.razon_modificacion
                      )?.label || movimiento.razon_modificacion;
                  } else if (movimiento.tipo_certificado == "2") {
                    reason = "Renovación Póliza";
                  } else if (movimiento.tipo_certificado == "1") {
                    reason = "Creación de Póliza";
                  }
                  return (
                    <tr
                      key={movimiento.id_anexo_poliza}
                      className="hover:bg-gray-200 text-[12px]"
                    >
                      <td className="px-4 py-2 border-t border-r">
                        {movimiento.id_anexo_poliza}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {
                          tipoMovimiento.find(
                            (tm) => tm.value === movimiento.tipo_certificado
                          )?.tipo
                        }
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {movimiento.no_certificado}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {
                          movimiento.fecha_registro
                        }
                      </td>
                      <td className="px-4 py-2 border-t border-r">{reason}</td>
                      <td className="px-4 py-2 border-t border-r">
                        {parseInt(movimiento.prima_neta_poliza).toLocaleString(
                          "es-CO",
                          {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {parseInt(
                          movimiento.asistencias_otros_poliza
                        ).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {parseInt(
                          movimiento.gastos_expedicion_poliza
                        ).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {parseInt(movimiento.iva_poliza).toLocaleString(
                          "es-CO",
                          {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {parseInt(movimiento.valor_total_poliza).toLocaleString(
                          "es-CO",
                          {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }
                        )}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {movimiento.observaciones}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        {/* {console.log(handleGetUserName(movimiento.id_usuario))} */}
                        {movimiento.nombre_usuario}
                      </td>
                      <td className="px-4 py-2 border-t border-r">
                        <BtnGeneral
                          className={
                            "bg-lime-9000 text-white px-[7px] h-[30px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                          }
                          funct={() => handlerOpenModalMovimiento(movimiento)}
                          isDisabled={movimiento.no_certificado == "0"}
                        >
                          <MdModeEdit className="inline-block" size={20} />
                        </BtnGeneral>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-row justify-end mt-5">
              <BtnGeneral
                id={"btnCerrarMovimientos"}
                className={
                  "bg-gray-400 text-white px-10 h-[35px] m-[2px] rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                }
                funct={onCloseModal}
              >
                <span>Cerrar</span>
              </BtnGeneral>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
