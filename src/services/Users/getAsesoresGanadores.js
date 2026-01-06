import axios from "axios";
import { capitalizeWords } from "../../utils/utils";

export const getAsesoresGanadores = async () => {
  try {
    const response = await axios.post(
      "/Users/getAsesoresGanadores",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((asesorGanador) => ({
      value: asesorGanador.usu_documento,
      label: capitalizeWords(asesorGanador.usu_nombre+' '+asesorGanador.usu_apellido),
    }));
    
  } catch (error) {
    return error;
  }
};
