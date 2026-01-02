// {
//   "id_usuario": "1151946527",         // quien anula
//   "debug": true,                      // opcional, para ver 'stats.debug'
//   "liquidaciones": [
//     {
//       "id_liquidacion": 1,            // liquidación a anular
//       "id_usuario_liq": "1007028818"  // el beneficiario (id_usuario o documento)
//     },
//     {
//       "id_liquidacion": 2,
//       "id_usuario_liq": "1127609223"
//     }
//   ]
// }

import axios from "axios";

export const anularPaymentLiquidacion = async (data) => {
  try {
    const response = await axios.post(
      "/Settlements/annulLiquidacion",
      data,
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
