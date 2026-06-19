import axios from "axios";

export const saveComentarioConciliacion = async (payload) => {
  const endpoints = [
    "/Conciliations/saveComentarioConciliacion",
  ];

  for (const endpoint of endpoints) {
    try {
      const { data } = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return data;
    } catch (error) {
      const isLast = endpoint === endpoints[endpoints.length - 1];
      if (isLast) {
        return {
          status: "Error",
          message: error?.response?.data?.message || error.message,
        };
      }
    }
  }

  return {
    status: "Error",
    message: "No fue posible guardar el comentario",
  };
};
