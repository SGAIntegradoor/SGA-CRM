import axios from "axios";

export const pdfServices = async (id) => {
  const { data } = await axios.post(
    "/PdfService/PdfService?id="+id,
  );
  return data;

};