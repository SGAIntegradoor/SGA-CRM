import axios from "axios";
import { capitalizeWords } from "../../utils/utils";

export const getAsesores10 = async () => {
  try {
    const response = await axios.post(
      "/Users/getAsesores10",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const { data } = response.data.data;
    return data.map((asesor10) => ({
      value: asesor10.usu_documento,
      // coloca las primeras letras de cada palabra en mayuscula
      label: capitalizeWords(asesor10.usu_nombre+' '+asesor10.usu_apellido),
    }));
    
  } catch (error) {
    return error;
  }
};
