import axios from "axios";

const normalizeResponseRows = (responseData) => {
  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData)) {
    return responseData;
  }

  return [];
};

export const getConciliacionPolizasByQuery = async (dataFilters) => {
  const endpoints = [
    "/Conciliations/retrievePolizasByQuery",
  ];

  for (const endpoint of endpoints) {
    try {
      const { data: responseData } = await axios.post(
        endpoint,
        { dataFilters },
        { headers: { "Content-Type": "application/json" } },
      );

      return normalizeResponseRows(responseData);
    } catch (error) {
      const isLastEndpoint = endpoint === endpoints[endpoints.length - 1];

      if (isLastEndpoint) {
        console.error("getConciliacionPolizasByQuery error:", error);
      }
    }
  }

  return [];
};
