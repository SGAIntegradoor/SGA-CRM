// {
//   "id_usuario": 321,                     // quien ejecuta/crea el pago (usuario del sistema)
//   "liquidaciones": [
//     {
//       "id_liquidacion": 14567,           // liquidación a pagar
//       "id_usuario_liq": "1020304050",    // id del usuario a quien se liquida (puede ser id_usuario numérico o su documento)
//       "valor_total_pago": 3500000,       // COP enteros (sin separadores)
//       "mes_expedicion": "2025-08",       // string "YYYY-MM" (también se acepta 8 o "Agosto" si así lo manejas)
//       "fecha_pago": "2025-09-07 14:32:00", // opcional; si viene solo "YYYY-MM-DD" el backend le agrega "00:00:00". Si no lo envías usa NOW()
//       "observaciones": "Pago por transferencia",
//       "estado_pago": 1                   // 1 = Pagado, 0 = Sin pagar, 2 = Anulado
//     },
//     {
//       "id_liquidacion": 14568,
//       "id_usuario_liq": 789,             // aquí como id_usuario numérico (el backend lo acepta igual)
//       "valor_total_pago": 420000,
//       "mes_expedicion": 8,               // también válido
//       "fecha_pago": "2025-09-07",
//       "observaciones": null,
//       "estado_pago": 1
//     }
//   ]
// }


import axios from "axios";

export const createPaymentsLiquidacion = async (data) => {
  try {
    const response = await axios.post(
      "/Settlements/paymentsLiquidacion",
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
