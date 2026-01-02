import axios from "axios"
export const retrivePolizaById = async (id_poliza = "", id_anexo_poliza = "") => {
    try {
        const response = await axios.post('/Policy/retrievePolizaById', {
            id_poliza,
            id_anexo_poliza
        },{
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error retrieving policy:", error);
        throw error;
    }
}
