import { useEffect, useState } from "react";
import { FaRegIdCard } from "react-icons/fa";
import Swal from "sweetalert2";
import { createBeneficiario } from "../../../../services/Polizas/createBeneficiario";
import { getBeneficiarios } from "../../../../services/Polizas/getBeneficiarios";
import { useSubmitGuard } from "../../../../hooks/useSubmitGuard";
import {
  Badge,
  Bloque,
  BtnCancelar,
  BtnGuardar,
  Campo,
  Esqueleto,
  SeccionShell,
  inputCls,
  tituloSeccion,
} from "./SeccionShell";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MSG_SIN_CAMBIOS =
  "El NIT ya existe y los correos son iguales. No se realizaron cambios.";
const MSG_CREADO = "Beneficiario creado exitosamente";
const MSG_AUTORIZACION =
  "El NIT ya existe pero los correos son distintos. Se requiere confirmación para actualizar.";

export const FormBeneficiario = ({
  seccion,
  beneficiarios,
  setBeneficiarios,
  onClose,
  onCambiarModo,
  onSincronizar,
}) => {
  const { modo } = seccion;
  const { busy: guardando, guard } = useSubmitGuard();

  // consultando | nuevo | existente | error
  const [estado, setEstado] = useState("consultando");
  const [datos, setDatos] = useState({
    numeroIdentificacion: seccion.numeroIdentificacion,
    razon_social: "",
    correo1: "",
    correo2: "",
    observaciones: "",
  });

  const soloLectura = modo === "ver" && estado === "existente";
  const bloqueado = soloLectura || estado === "consultando" || guardando;
  // backend solo actualiza correos de un NIT existente
  const identidadBloqueada = bloqueado || estado === "existente";

  // --- CONSULTA INICIAL en la lista de beneficiarios onerosos ---
  useEffect(() => {
    let cancelado = false;

    const consultar = async () => {
      let lista = beneficiarios;
      if (!Array.isArray(lista?.data) || lista.data.length === 0) {
        lista = await getBeneficiarios();
        if (cancelado) return;
        if (!Array.isArray(lista?.data)) {
          setEstado("error");
          return;
        }
        setBeneficiarios(lista);
      }

      const b = lista.data.find(
        (ben) =>
          String(ben.nit_beneficiario).trim() === seccion.numeroIdentificacion
      );
      if (!b) {
        setDatos((prev) => ({ ...prev, razon_social: seccion.nombre || "" }));
        setEstado("nuevo");
        return;
      }
      setDatos({
        numeroIdentificacion: String(b.nit_beneficiario),
        razon_social: b.razon_social_beneficiario || "",
        correo1: b.correo_beneficiario || "",
        correo2: b.correo_beneficiario_2 || "",
        observaciones: b.observaciones || "",
      });
      onSincronizar({
        tipoIdentificacion: "2",
        nombre: b.razon_social_beneficiario || "",
      });
      setEstado("existente");
    };

    consultar().catch((error) => {
      console.error("Error al consultar beneficiarios:", error);
      if (!cancelado) setEstado("error");
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (campo) => (e) =>
    setDatos((prev) => ({ ...prev, [campo]: e.target.value }));

  const validar = () => {
    const nit = datos.numeroIdentificacion.trim();
    if (!nit) return "Por favor ingrese numero de identificación del beneficiario.";
    if (!/^\d+$/.test(nit) || nit.length > 9) {
      return "Por favor ingrese un NIT válido (máximo 9 dígitos) sin dígito de verificación.";
    }
    if (!datos.razon_social.trim()) return "El nombre / razón social es obligatorio.";
    for (const correo of [datos.correo1, datos.correo2]) {
      if (correo.trim() && !CORREO_VALIDO.test(correo.trim())) {
        return `El correo "${correo.trim()}" no es válido.`;
      }
    }
    return null;
  };

  const handleGuardar = guard(async () => {
    const error = validar();
    if (error) {
      Swal.fire({ icon: "warning", title: "Beneficiario Oneroso", text: error });
      return;
    }

    try {
      const response = await createBeneficiario({
        tipoIdentificacion: "2",
        ...datos,
        numeroIdentificacion: datos.numeroIdentificacion.trim(),
        razon_social: datos.razon_social.trim(),
      });

      if (response?.message === MSG_SIN_CAMBIOS) {
        await Swal.fire({
          icon: "info",
          title: "Sin modificación",
          text: "El beneficiario no se ha modificado.",
        });
        onClose();
      } else if (response?.message === MSG_CREADO) {
        await Swal.fire({
          icon: "success",
          title: "Beneficiario creado",
          text: "El beneficiario ha sido creado exitosamente.",
        });
        const lista = await getBeneficiarios();
        if (Array.isArray(lista?.data)) setBeneficiarios(lista);
        onSincronizar({
          tipoIdentificacion: "2",
          numeroIdentificacion: datos.numeroIdentificacion.trim(),
          nombre: datos.razon_social.trim(),
        });
        onClose();
      } else if (response?.message === MSG_AUTORIZACION) {
        await Swal.fire({
          icon: "info",
          title: "Autorización requerida",
          text: "La actualización de los correos requiere autorización.",
        });
        onClose();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response?.message || "No fue posible guardar el beneficiario.",
        });
      }
    } catch (err) {
      console.error("Error al crear beneficiario:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No fue posible guardar el beneficiario.",
      });
    }
  });

  const badge =
    estado === "consultando" ? (
      <Badge key="consultando" tono="consultando">
        Consultando...
      </Badge>
    ) : estado === "nuevo" ? (
      <Badge key="nuevo" tono="nuevo">
        Nuevo beneficiario
      </Badge>
    ) : estado === "existente" ? (
      <Badge key="existente" tono="existente">
        Beneficiario registrado
      </Badge>
    ) : (
      <Badge key="error" tono="error">
        Sin consultar
      </Badge>
    );

  const footer =
    estado === "consultando" || estado === "error" ? (
      <BtnCancelar onClick={onClose}>Cerrar</BtnCancelar>
    ) : soloLectura ? (
      <>
        <BtnCancelar onClick={onClose}>Cerrar</BtnCancelar>
        <BtnGuardar onClick={() => onCambiarModo("editar")}>Editar</BtnGuardar>
      </>
    ) : (
      <>
        <BtnCancelar onClick={onClose} disabled={guardando} />
        <BtnGuardar onClick={handleGuardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </BtnGuardar>
      </>
    );

  return (
    <SeccionShell
      titulo={tituloSeccion("Beneficiario", "2", datos.numeroIdentificacion)}
      badge={badge}
      modo={modo}
      footer={footer}
    >
      {estado === "consultando" && <Esqueleto />}

      {estado === "error" && (
        <Bloque className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          No fue posible consultar la base de beneficiarios onerosos.
        </Bloque>
      )}

      {(estado === "nuevo" || estado === "existente") && (
        <>
          {estado === "nuevo" && (
            <Bloque className="rounded-lg bg-[#e8f0fb] px-4 py-2.5 text-sm text-gray-500">
              El NIT no se encuentra en la base de beneficiarios onerosos.
              Completa los datos para crearlo.
            </Bloque>
          )}

          <Bloque i={1} className="flex items-center gap-2">
            <FaRegIdCard size={20} className="text-gray-700" />
            <p className="text-[14px] font-semibold text-gray-800">
              Datos del beneficiario
            </p>
          </Bloque>

          <Bloque
            i={2}
            className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Campo label="Tipo de documento" htmlFor="sp-ben-tipo">
              <select id="sp-ben-tipo" className={inputCls} value="2" disabled>
                <option value="2">NIT</option>
              </select>
            </Campo>
            <Campo label="NIT (sin DV)" htmlFor="sp-ben-nit">
              <input
                id="sp-ben-nit"
                type="text"
                inputMode="numeric"
                maxLength={9}
                className={inputCls}
                value={datos.numeroIdentificacion}
                onChange={(e) =>
                  setDatos((prev) => ({
                    ...prev,
                    numeroIdentificacion: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                disabled={identidadBloqueada}
              />
            </Campo>
            <Campo
              label="Nombre / Razón social"
              htmlFor="sp-ben-razon"
              className="sm:col-span-2"
            >
              <input
                id="sp-ben-razon"
                type="text"
                className={inputCls}
                value={datos.razon_social}
                onChange={cambiar("razon_social")}
                disabled={identidadBloqueada}
              />
            </Campo>
          </Bloque>

          <Bloque
            i={3}
            className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Campo label="Correo electrónico 1" htmlFor="sp-ben-correo1">
              <input
                id="sp-ben-correo1"
                type="email"
                className={inputCls}
                value={datos.correo1}
                onChange={cambiar("correo1")}
                disabled={bloqueado}
              />
            </Campo>
            <Campo label="Correo electrónico 2" htmlFor="sp-ben-correo2">
              <input
                id="sp-ben-correo2"
                type="email"
                className={inputCls}
                value={datos.correo2}
                onChange={cambiar("correo2")}
                disabled={bloqueado}
              />
            </Campo>
            <Campo
              label="Observaciones"
              htmlFor="sp-ben-obs"
              className="sm:col-span-2"
            >
              <input
                id="sp-ben-obs"
                type="text"
                className={inputCls}
                value={datos.observaciones}
                onChange={cambiar("observaciones")}
                disabled={identidadBloqueada}
              />
            </Campo>
          </Bloque>
        </>
      )}
    </SeccionShell>
  );
};
