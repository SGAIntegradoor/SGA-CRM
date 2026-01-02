import axios from "axios";

export const createBeneficiario = async ({
  tipoIdentificacion,
  numeroIdentificacion,
  razon_social,
  correo1,
  correo2,
  observaciones,
}) => {
  try {
    const response = await axios.post(
      "/Policy/createBeneficiario",
      {
        data: {
          tipoIdentificacion,
          numeroIdentificacion,
          razon_social,
          correo1,
          correo2,
          observaciones,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    return error;
  }
};
