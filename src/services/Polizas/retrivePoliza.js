import axios from "axios"
export const retrivePoliza = async (id_remision) => {
    try {
        const response = await axios.post('/Policy/retrievePoliza', {
            id_remision
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
