import axios from "axios";

const API_URL = "https://grupoasistencia.com/Auth/Login/SSO/";

export const loginSSO = async (token) => {
  console.log(token)
  try {
    const response = await axios.get(API_URL, 
        {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        }
    );
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};
