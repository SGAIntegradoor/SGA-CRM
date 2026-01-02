import axios from "axios"

export const getFormasPago = async () => {
  try {
    const respuesta = await axios.post(`/Utils/getFormasPago`);
    const {data} = respuesta.data;
    return data.map((formaPago) => ({
      id: formaPago.id_forma_de_pago,
      label: formaPago.forma_de_pago,
    }));
  } catch (error) {
    console.error("Error al obtener formas de pago:", error);
    return [];
  }
}
