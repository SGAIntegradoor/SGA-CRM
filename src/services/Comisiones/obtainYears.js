import axios from "axios";

export const obtainYears = async () => {
  const { data } = await axios.post(
    "/Commissions/getYearsSMMLV",
    { headers: { "Content-Type": "application/json" } }
  );
  return data.result.map((year) => ({ value: year.anio, label: year.anio })); // espera {status: 'Ok', result: [2020, 2021, ...]}
};