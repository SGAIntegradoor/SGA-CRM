import axios from "axios";

export const getUnidadesNegocio = async (type = 1) => {

  const equivalencias = {
    "Freelance": 19,
    "Asesor 10": 10,
    "Asesor Ganador": 11,
  };

  try {
    const response = await axios.post("/Utils/getUnidadesNegocio", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { data } = response.data;

    if (type === 1) {
      return data.map(({ unidad_negocio, id_unidad }) => ({
        label: unidad_negocio,
        value: id_unidad,
      }));
    } else {
      return data
        .filter((item) => item.id_unidad != "2")
        .map(({ unidad_negocio, id_unidad }) => ({
          label: unidad_negocio,
          value:
            equivalencias[unidad_negocio] !== undefined
              ? equivalencias[unidad_negocio]
              : id_unidad,
        }));
    }
  } catch (error) {
    return error;
  }
};
