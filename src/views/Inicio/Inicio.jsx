import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderPage } from "../../components/HeaderPage/HeaderPage";
import { Image } from "primereact/image";
import ImagenGA from "../../assets/img/LogoGA.png";
import { AuthContext } from "../../context/AuthContext";


export const Inicio = () => {
  const [showIntro, setShowIntro] = useState(true);
  const {  } = useContext(AuthContext);
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastVisit = localStorage.getItem("lastVisitCRM");

    if (lastVisit === today) {
      setShowIntro(false); // ya entró hoy
    } else {
      localStorage.setItem("lastVisitCRM", today);
      setShowIntro(true);
      // Ocultar animación después de unos segundos
      setTimeout(() => setShowIntro(false), 4000);
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed top-0 left-0 w-screen h-screen bg-gradient-to-br from-lime-600 to-emerald-700 flex items-center justify-center z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 4 }}
          >
            <motion.h1
              className="text-white text-5xl font-bold"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              Bienvenido al CRM ✨
              <Image
                src={ImagenGA}
                alt="Logo Grupo ASI"
                width={200}
              />
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <HeaderPage title={"Inicio"} />

      <div className="flex flex-col justify-center gap-4 w-full ">

      </div>
    </>
  );
};