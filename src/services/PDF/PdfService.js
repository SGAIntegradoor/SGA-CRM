import axios from "axios";

export const pdfServices = async (id) => {
  console.log(id)
  const { data } = await axios.post(
    "/PdfService/PdfService?id="+id,
  );
  return data; // espera {status: 'Ok', ...}
};