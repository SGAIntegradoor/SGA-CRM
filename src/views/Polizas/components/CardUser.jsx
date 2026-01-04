import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { FaRegIdCard } from "react-icons/fa";
import { FaRegIdBadge } from "react-icons/fa6";
import { AiOutlineUser } from "react-icons/ai";
import { PiMagnifyingGlass } from "react-icons/pi";
import { Switch } from "../../../components/Switche/Switch";
import Swal from "sweetalert2";
import { getBeneficiarios } from "../../../services/Polizas/getBeneficiarios";

export const CardUser = ({
  titulo,
  placeholderNombre,
  searchProspecto = null,
  cliente = null,
  buttonSwitch,
  setButtonSwitch,
  valores = {},
  onChange,
  beneficiarios,
  setBeneficiarios,
  modalOneroso,
  setModalOneroso,
  isDisabled = false,
  setNuevoBeneficiario,
}) => {
  // Efecto para precargar los datos del cliente (solo Tomador)
  useEffect(() => {
    if (cliente && Object.keys(cliente).length > 0 && titulo === "Tomador") {
      onChange("tipoIdentificacion", cliente.tipoDocumento ?? "");
      onChange("numeroIdentificacion", cliente.documento ?? "");
      onChange("nombre", `${cliente.nombres} ${cliente.apellidos}` ?? "");
    }
  }, [cliente]);

  // Efecto para switches
  useEffect(() => {
    if (titulo === "Asegurado") {
      if (buttonSwitch.Asegurado) {
        let tipoIdentificacion = document.getElementById(
          `tipoIdentificacion_Tomador`
        );
        let numeroIdentificacion = document.getElementById(
          `numeroIdentificacion_Tomador`
        );
        let nombre = document.getElementById(`nombre_Tomador`);
        if (tipoIdentificacion && numeroIdentificacion && nombre) {
          onChange("tipoIdentificacion", tipoIdentificacion.value);
          onChange("numeroIdentificacion", numeroIdentificacion.value);
          onChange("nombre", nombre.value);
        }
      }
      // else {
      //   onChange("tipoIdentificacion", "");
      //   onChange("numeroIdentificacion", "");
      //   onChange("nombre", "");
      // }
    } else if (titulo === "Beneficiario") {
      if (buttonSwitch?.Beneficiario) {
        onChange("tipoIdentificacion", "2"); // NIT por defecto
        onChange("numeroIdentificacion", "");
        onChange("nombre", "");
        handleRequestBeneficiarios();
      } else {
        onChange("tipoIdentificacion", "");
        onChange("numeroIdentificacion", "");
        onChange("nombre", "");
      }
    }
    // eslint-disable-next-line
  }, [buttonSwitch]);

  const handleRequestBeneficiarios = async () => {
    // Lógica para manejar la solicitud de beneficiarios
    if (beneficiarios.data && beneficiarios.data.length > 0) {
      // Si ya hay beneficiarios cargados, no hacemos la solicitud
      return;
    }
    const benefici = await getBeneficiarios();
    setBeneficiarios(benefici);
  };

  const handleSearchBeneficiario = (numeroIdentificacion) => {
    // Lógica para buscar un beneficiario por número de identificación
    if (numeroIdentificacion == "" || numeroIdentificacion == null) {
      Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Por favor ingrese numero de identificación del beneficiario para validarlo.",
      });
      return;
    }

    const beneficiario = beneficiarios.data.find(
      (ben) => ben.nit_beneficiario === numeroIdentificacion
    );
    if (beneficiario) {
      setModalOneroso(true);
      onChange("tipoIdentificacion", "2"); // NIT por defecto
      onChange("numeroIdentificacion", beneficiario.nit_beneficiario);
      onChange("nombre", beneficiario.razon_social_beneficiario);

      setNuevoBeneficiario({
        tipoIdentificacion: "2",
        numeroIdentificacion: beneficiario.nit_beneficiario,
        razon_social: beneficiario.razon_social_beneficiario,
        correo1: beneficiario.correo_beneficiario || "",
        correo2: beneficiario.correo_beneficiario_2 || "",
        observaciones: beneficiario.observaciones || "",
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "Beneficiario Oneroso",
        text: `El beneficiario con NIT: ${numeroIdentificacion}, no se encuentra creado en la BD, desea crearlo ?`,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: "Si",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.isConfirmed) {
          setNuevoBeneficiario({
            tipoIdentificacion: "2",
            numeroIdentificacion: numeroIdentificacion,
            razon_social: "",
            correo1: "",
            correo2: "",
            observaciones: "",
          });
          setModalOneroso(true);
        } else {
          setNuevoBeneficiario({
            tipoIdentificacion: "2",
            numeroIdentificacion: "",
            razon_social: "",
            correo1: "",
            correo2: "",
            observaciones: "",
          });
          return;
        }
      });
    }
  };
  return (
    <Box padding={3}>
      <section className="shadow-lg rounded-3xl w-[357.1px] border-l border-r border-b border-gray-400">
        <div className="flex flex-row gap-5 items-center bg-lime-9000 p-3 rounded-t-3xl border-gray-400 border justify-between">
          <p className="text-[17px] pl-1 text-white font-semibold">{titulo}</p>
          {titulo !== "Tomador" && (
            <div className="flex flex-row gap-2 items-center">
              <p className="text-white text-[11px]">
                {titulo === "Asegurado"
                  ? "¿Es el mismo tomador?"
                  : "¿Tiene beneficiario oneroso?"}
              </p>
              <Switch
                from={titulo}
                buttonSwitch={buttonSwitch}
                setButtonSwitch={setButtonSwitch}
                isDisabled={isDisabled}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-b-3xl text-md pt-4 pl-6 pr-6 pb-4 h-auto w-auto">
          <label
            htmlFor={`tipoIdentificacion_${titulo}`}
            className="transition-all text-black pl-[45px]"
          >
            Tipo de identificación:
          </label>

          <div className="flex flex-row gap-3 items-center align-middle">
            <FaRegIdBadge className="text-gray-500" size={35} />
            <div className="w-full">
              <select
                id={`tipoIdentificacion_${titulo}`}
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-1"
                value={valores.tipoIdentificacion ?? ""}
                onChange={(e) => onChange("tipoIdentificacion", e.target.value)}
                disabled={
                  titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                    ? true
                    : isDisabled
                    ? true
                    : isDisabled
                    ? true
                    : false
                }
              >
                <option value="" style={{ color: "gray" }}>
                  Selección tipo de documento
                </option>
                {titulo !== "Beneficiario" && <option value="1">C.C</option>}
                <option value="2">NIT</option>
                {titulo !== "Beneficiario" && <option value="3">C.E</option>}
                {titulo !== "Beneficiario" && (
                  <option value="4">Pasaporte</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center align-middle">
            <FaRegIdCard className="text-gray-500" size={37} />
            <div className="w-full">
              <input
                type="text"
                id={`numeroIdentificacion_${titulo}`}
                name={`numeroIdentificacion_${titulo}`}
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                placeholder="Número Identificación"
                value={valores.numeroIdentificacion ?? ""}
                onChange={(e) => {
                  if (
                    e.target.value.length <= 0 ||
                    valores.numeroIdentificacion.length > e.target.value.length
                  ) {
                    onChange("nombre", "");
                  }
                  onChange("numeroIdentificacion", e.target.value);
                }}
                disabled={
                  titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                    ? true
                    : isDisabled
                    ? true
                    : isDisabled
                    ? true
                    : false
                }
              />
              {titulo == "Tomador" && (
                <button
                  className="ml-[-30px] align-middle mt-[-3px]"
                  onClick={
                    titulo === "Tomador"
                      ? () =>
                          searchProspecto &&
                          searchProspecto(valores.numeroIdentificacion)
                      : null
                  }
                >
                  <PiMagnifyingGlass style={{ fontSize: 21 }} />
                </button>
              )}
              {titulo === "Asegurado" && (
                <button
                  className="ml-[-30px] align-middle mt-[-3px]"
                  onClick={() =>
                    searchProspecto &&
                    searchProspecto(valores.numeroIdentificacion)
                  }
                >
                  <PiMagnifyingGlass style={{ fontSize: 21 }} />
                </button>
              )}
              {titulo === "Beneficiario" && (
                <button
                  className="ml-[-30px] align-middle mt-[-3px]"
                  onClick={() =>
                    handleSearchBeneficiario(valores.numeroIdentificacion)
                  }
                >
                  <PiMagnifyingGlass style={{ fontSize: 21 }} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center align-middle">
            <AiOutlineUser className="text-gray-500" size={37} />
            <div className="w-full">
              <input
                type="text"
                id={`nombre_${titulo}`}
                name={`nombre_${titulo}`}
                className="w-full text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-2"
                placeholder={placeholderNombre}
                value={valores.nombre ?? ""}
                onChange={(e) => onChange("nombre", e.target.value)}
                disabled={
                  titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                    ? true
                    : isDisabled
                    ? true
                    : false
                }
              />
            </div>
          </div>
        </div>

        <div className="text-center pb-5">
          <div className="flex flex-row gap-3 items-center align-middle justify-center">
            <button
              className={`text-blue-500 font-bold hover:cursor-pointer ${
                titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={
                titulo === "Tomador"
                  ? () =>
                      searchProspecto &&
                      searchProspecto(valores.numeroIdentificacion)
                  : titulo === "Beneficiario"
                  ? () => handleSearchBeneficiario(valores.numeroIdentificacion)
                  : null
              }
              disabled={
                titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                  ? true
                  : isDisabled
                  ? true
                  : false
              }
            >
              Ver
            </button>
            <button
              className={`text-blue-500 font-bold hover:cursor-pointer ${
                titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={
                titulo === "Tomador"
                  ? () =>
                      searchProspecto &&
                      searchProspecto(valores.numeroIdentificacion)
                  : titulo === "Beneficiario"
                  ? () => handleSearchBeneficiario(valores.numeroIdentificacion)
                  : null
              }
              disabled={
                titulo === "Beneficiario" && !buttonSwitch?.Beneficiario
                  ? true
                  : isDisabled
                  ? true
                  : false
              }
            >
              Editar
            </button>
          </div>
        </div>
      </section>
    </Box>
  );
};
