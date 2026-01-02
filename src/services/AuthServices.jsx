import axios from "axios";

export const login = async (username, password) => {

    try {
        const response = await axios.post(
            "/Auth/Login",
            {
              ingUsuario: username,
              ingPassword: password,
            }
          );
          localStorage.setItem("userData", JSON.stringify(response.data.userData));
          return response.data;
    }
    catch (error){
        return error.response.data;
    }
};
