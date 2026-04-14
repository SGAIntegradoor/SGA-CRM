import axios from "axios"

export const handlerGetSMMLV = async () => {
  try {
    const respuesta = await axios.post(`/Utils/getSMMLV`);
    const {data} = respuesta.data;
    return data;
  } catch (error) {
    console.error("Error al obtener el SMMLV:", error);
    return 0;
  }
}
