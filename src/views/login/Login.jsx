import React, { useState, useEffect, useContext } from "react";
import { Image } from "primereact/image";
import { Person, Lock } from "@mui/icons-material/";
import BotonSendComponent from "../../components/BtnLoginSend/BotonSendComponent";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { login as loginService } from "../../services/AuthServices";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/LoaderFullScreen/Loader";
import LogoLogin from "../../assets/img/integradoorLogo.png";
import { useTheme } from "@emotion/react";

const Login = ({ isLoading, setIsLoading }) => {
  const nav = useNavigate();
  const location = useLocation();
  const [forgotPass, setForgotPass] = useState(false);
  const [errorLogin, setErrorLogin] = useState(false);
  const theme = useTheme();

  const { login, loginWithSSO, isLogged } = useContext(AuthContext);
  const log = isLogged();

  const styles =
    "bg-lime-9000 hover:bg-lime-600 w-28 p-1 text-white rounded-sm";

  // ✅ Detectar token en URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // Si hay token en URL -> login con SSO
      setIsLoading(true);
      loginWithSSO(token).finally(() => setIsLoading(false));
    } else if (log) {
      // Si ya está logueado -> ir a inicio
      nav("/crm/inicio");
    }
  }, [location.search, log]);

  const handleErrorLogin = () => {
    setErrorLogin(true);
    setTimeout(() => {
      setErrorLogin(false);
    }, 5000);
  };

  // ✅ Login normal con usuario/contraseña
  const handlerLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;

    loginService(user, password).then((response) => {
      if (response.state === "ok") {
        setIsLoading(false);
        login(true, response.userData);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          handleErrorLogin();
        }, 1500);
      }
    });
  };

  return (
    <>
      <Loader isLoading={isLoading} />
      <div className="flex w-screen h-screen flex-col items-center pt-28">
        <Image
          src={LogoLogin}
          alt="Image"
          width="300"
        />
        <p className="mt-10 text-base">Ingresar al sistema</p>
        <div className="mt-3 flex flex-col gap-5 text-center place-items-center w-72">

          {/* ✅ Solo mostrar formulario si no viene token */}
          {!new URLSearchParams(location.search).get("token") && (
            <form
              method="POST"
              onSubmit={handlerLogin}
              className="flex flex-col gap-5 mt-3 text-cente place-items-center w-72"
            >
              <div className="relative w-full">
                <div className="inline-flex items-center justify-center absolute left-60 top-0 h-full w-10 text-gray-400">
                  <Person />
                </div>
                <input
                  id="user"
                  type="user"
                  name="user"
                  className={`text-sm sm:text-base placeholder-gray-500 pl-4 pr-10 rounded-lg border w-full py-2 border-gray-400 focus:outline-none focus:border-lime-9000 ${
                    theme === "light" ? "text-black" : "text-gray-700"
                  }`}
                  placeholder="Usuario"
                />
              </div>
              <div className="relative w-full">
                <div className="inline-flex items-center justify-center absolute left-60 top-0 h-full w-10 text-gray-400">
                  <Lock />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  className={`text-sm sm:text-base placeholder-gray-500 pl-4 pr-10 rounded-lg border w-full py-2 border-gray-400 focus:outline-none focus:border-lime-9000 ${
                    theme === "light" ? "text-black" : "text-gray-700"
                  }`}
                  placeholder="Password"
                />
              </div>
              <BotonSendComponent text={"Ingresar"} styles={styles} />
            </form>
          )}

          <p className="pt-3 text-blue-400">
            <button onClick={() => setForgotPass(!forgotPass)}>
              ¿Has olvidado tu contraseña?
            </button>
          </p>

          <AnimatePresence>
            {errorLogin && (
              <motion.div
                className="bg-red-500 text-white p-3 rounded-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 3 } }}
              >
                Error al iniciar sesión, contraseña o usuario incorrectos
              </motion.div>
            )}
          </AnimatePresence>

          {forgotPass ? (
            <div className="flex gap-4 flex-col w-full items-start">
              <label>Ingresa tu correo electrónico:</label>
              <input
                type="emailForgot"
                name="emailForgot"
                id="emailForgot"
                className="text-sm sm:text-base placeholder-gray-500 pl-4 pr-10 rounded-lg border w-full border-gray-400 py-2 focus:outline-none focus:border-lime-9000"
                placeholder="Email"
              />
              <BotonSendComponent text={"Enviar"} styles={styles} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Login;
