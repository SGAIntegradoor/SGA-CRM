// hooks/Clients/useValidateClient.js
const useValidateClient = () => {
  // === Helpers ===
  const isCompleteRealISODate = (s) => {
    if (typeof s !== "string") return false;
    // Debe venir como AAAA-MM-DD (valor típico de <input type="date" />)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(`${s}T00:00:00`);
    // Validación estricta: evita que 2025-02-31 se normalice a marzo
    return (
      dt.getFullYear() === y &&
      dt.getMonth() + 1 === m &&
      dt.getDate() === d
    );
  };

  const validateClientData = (clientData) => {
    // Estructura base
    if (!clientData || typeof clientData !== "object") {
      return { isValid: false, error: "Invalid client data" };
    }

    const {
      tipoDocumento,
      nombres,
      apellidos,
      documento,
      fechaNacimiento, // puede venir como string "YYYY-MM-DD" o como array
      emails,
      celulares,
      departamentos,
      ciudades,
      direcciones,
      principalSeleccionado,
      principalEmailSeleccionado,
      principalCelularSeleccionado,
    } = clientData;

    // === Validaciones básicas ===
    if (
      !tipoDocumento ||
      typeof tipoDocumento !== "string" ||
      tipoDocumento.trim() === ""
    ) {
      return {
        isValid: false,
        error: "Error: el tipo de documento del cliente es obligatorio",
      };
    }

    if (!nombres || typeof nombres !== "string" || nombres.trim() === "") {
      return {
        isValid: false,
        error: "Error: el nombre del cliente es obligatorio",
      };
    }

    if (!apellidos || typeof apellidos !== "string" || apellidos.trim() === "") {
      return {
        isValid: false,
        error: "Error: el apellido del cliente es obligatorio",
      };
    }

    if (!documento || typeof documento !== "string" || documento.trim() === "") {
      return {
        isValid: false,
        error: "Error: el documento del cliente es obligatorio",
      };
    }

    // Al menos un email no vacío
    if (
      !Array.isArray(emails) ||
      emails.length === 0 ||
      emails.every((email) => typeof email !== "string" || email.trim() === "")
    ) {
      return {
        isValid: false,
        error: "Error: al menos un email del cliente debe registrarse",
      };
    }

    // Al menos un celular no vacío
    if (
      !Array.isArray(celulares) ||
      celulares.length === 0 ||
      celulares.every((cel) => typeof cel !== "string" || cel.trim() === "")
    ) {
      return {
        isValid: false,
        error: "Error: al menos un teléfono del cliente debe registrarse",
      };
    }

    // Al menos un departamento
    if (
      !Array.isArray(departamentos) ||
      departamentos.length === 0 ||
      departamentos.every(
        (dep) => typeof dep !== "string" || dep.trim() === ""
      )
    ) {
      return {
        isValid: false,
        error: "Error: al menos un departamento del cliente debe registrarse",
      };
    }

    // Al menos una ciudad
    if (
      !Array.isArray(ciudades) ||
      ciudades.length === 0 ||
      ciudades.every((ciu) => typeof ciu !== "string" || ciu.trim() === "")
    ) {
      return {
        isValid: false,
        error: "Error: al menos una ciudad del cliente debe registrarse",
      };
    }

    // Al menos una dirección
    if (
      !Array.isArray(direcciones) ||
      direcciones.length === 0 ||
      direcciones.every(
        (dir) => typeof dir !== "string" || dir.trim() === ""
      )
    ) {
      return {
        isValid: false,
        error: "Error: al menos una dirección del cliente debe registrarse",
      };
    }

    // Principales seleccionados
    if (principalSeleccionado === undefined || principalSeleccionado === "") {
      return {
        isValid: false,
        error: "Error: debe seleccionarse la dirección principal",
      };
    }

    if (
      principalEmailSeleccionado === undefined ||
      principalEmailSeleccionado === ""
    ) {
      return {
        isValid: false,
        error: "Error: debe seleccionarse el email principal",
      };
    }

    if (
      principalCelularSeleccionado === undefined ||
      principalCelularSeleccionado === ""
    ) {
      return {
        isValid: false,
        error: "Error: debe seleccionarse el celular principal",
      };
    }

    // === Fecha de nacimiento ===
    // Acepta string ("YYYY-MM-DD") o array de fechas (por si en el futuro hay múltiples)
    // 1) Obligatoria
    const fechaVaciaString =
      typeof fechaNacimiento === "string" &&
      fechaNacimiento.trim() === "";

    const fechaVaciaArray =
      Array.isArray(fechaNacimiento) &&
      fechaNacimiento.every((f) => typeof f !== "string" || f.trim() === "");

    if (
      fechaNacimiento === undefined ||
      fechaNacimiento === null ||
      fechaVaciaString ||
      fechaVaciaArray
    ) {
      return {
        isValid: false,
        error: "Error: la fecha de nacimiento es obligatoria",
      };
    }

    // 2) Normaliza a arreglo para validar una o varias
    const fechas = Array.isArray(fechaNacimiento)
      ? fechaNacimiento
      : [fechaNacimiento];

    for (let i = 0; i < fechas.length; i++) {
      const f = (fechas[i] ?? "").trim();

      // Debe tener el formato completo
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) {
        return {
          isValid: false,
          error:
            fechas.length === 1
              ? "Error: completa la fecha de nacimiento en formato AAAA-MM-DD"
              : `Error: la fecha de nacimiento en la posición ${i + 1} debe estar completa (AAAA-MM-DD)`,
        };
      }

      // Debe ser una fecha real (no 2025-02-31)
      if (!isCompleteRealISODate(f)) {
        return {
          isValid: false,
          error:
            fechas.length === 1
              ? "Error: la fecha de nacimiento no es válida"
              : `Error: la fecha de nacimiento en la posición ${i + 1} no es válida`,
        };
      }

      // (Opcional) Reglas de negocio:
      // - No permitir fechas futuras
      // const todayISO = new Date().toISOString().slice(0, 10);
      // if (f > todayISO) {
      //   return {
      //     isValid: false,
      //     error: "Error: la fecha de nacimiento no puede ser futura",
      //   };
      // }

      // - Mayor de 18 años (ejemplo)
      // const asDate = new Date(`${f}T00:00:00`);
      // const min = new Date();
      // min.setFullYear(min.getFullYear() - 18);
      // if (asDate > min) {
      //   return {
      //     isValid: false,
      //     error: "Error: el cliente debe ser mayor de edad",
      //   };
      // }
    }

    // Si todo está OK
    return { isValid: true };
  };

  return { validateClientData };
};

export default useValidateClient;
