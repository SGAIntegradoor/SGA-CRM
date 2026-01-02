import { motion } from "framer-motion";
import { Image } from "primereact/image";
import React, { useState } from "react";
import { useEffect } from "react";
import { updateSelectionOffert } from "../../services/updateOffertSelection";


export const Card = ({ data, userData }) => {

  let [valueSeleccion, setValueSeleccion] = useState(false);

  useEffect(() => {
    // Si 'seleccionar' es "Si", marca el checkbox
    if (data.seleccionar === "Si") {
      setValueSeleccion(true);
    }
  }, [data.seleccionar]);

  const handleInput = async (event) => {
    // Cambia el estado cuando el checkbox cambia
    setValueSeleccion(event.target.checked);

    let response = await updateSelectionOffert(data.id_oferta, userData.Seleccionaroferta, userData.id_Intermediario, event.target.checked)

    if(response.status == "Ok"){
    } else {
    }
    
  };
  return (
    <motion.div className="flex flex-wrap flex-roww bg-white rounded-xl p-5  gap-16 border-gray-400 items-center justify-normal xs:items-center xxs:items-center sm:items-start sm:justify-normal lg:items-start lg:justify-normal xl:items-center xl:justify-normal xs:justify-center xxs:justify-center md:flex-nowrap lg:flex-nowrap xl:flex-nowrap">
      <div className="flex flex-col flex-wrap xs:w-2/5 xl:w-1/5 items-center justify-normal xs:items-center xxs:items-center sm:items-start sm:justify-normal lg:items-start lg:justify-normal xl:items-center xl:justify-normal xs:justify-center xxs:justify-center">
        <Image
          src={`src/assets/${data.logo}`}
          width={`${data.Aseguradora == "Liberty" ? "80" : "100"}`}
          className={
            data.Aseguradora == "Mundial" ? "pl-0 md:pl-4 sm:pl-4 xl:pl-2" : ""
          }
        />
        <div className="flex flex-row gap-1 w-full justify-center">
          <p className="font-black text-lime-9000">
            {data.NumCotizOferta == "0" ? null : "N°Cot:"}
          </p>{" "}
          <p className="font-black">
            {data.NumCotizOferta == "0" ? null : data.NumCotizOferta}
          </p>
        </div>
      </div>
      <div
        className={`flex flex-col flex-wrap xl:w-1/5 justify-normal xs:items-center xxs:items-center sm:items-start sm:justify-normal lg:items-start lg:justify-normal xl:items-start xl:justify-normal xs:justify-center xxs:justify-center`}
      >
        <p className="font-black text-lime-9000">
          {data.Aseguradora} - {data.Producto}
        </p>
        <p className="font-black">
          Precio: ${data.Prima.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
        </p>
        <p>(Iva Incluido)</p>
      </div>
      <div className="flex xl:w-1/4 w-1/4 flex-col xs:w-full xxs:w-full xs:justify-center xs:items-center">
        <div
          className={`flex xxs:justify-center justify-around items-start w-full ${
            data.Aseguradora == "Mundial" ? "xl:pl-4" : ""
          }`}
        >
          <p className="w-full">Responsabilidad Civil (RCE)</p>
          <p className="w-full font-bold xs:text-right">
            *{" "}
            {data.ValorRC == "No cubre"
              ? "No cubre"
              : data.ValorRC.split("/").length >= 2
              ? data.ValorRC
              : Number(data.ValorRC).toLocaleString("es-ES")}
          </p>
        </div>
        <div
          className={`flex justify-around xs:justify-center items-start w-full ${
            data.Aseguradora == "Mundial" ? "xl:pl-4" : ""
          }`}
        >
          <p className="w-full ">Pérdida Total Daños y Hurto</p>
          <p className="w-full font-bold xs:text-right">* {data.PerdidaTotal}</p>
        </div>
        <div
          className={`flex justify-around items-start w-full ${
            data.Aseguradora == "Mundial" ? "xl:pl-4" : ""
          }`}
        >
          <p className="w-full">Pérdida Parcial Daños y Hurto</p>
          <p className="w-full font-bold xs:text-right">* {data.PerdidaParcial}</p>
        </div>
        <div
          className={`flex justify-around items-start w-full ${
            data.Aseguradora == "Mundial" ? "xl:pl-4" : ""
          }`}
        >
          <p className="w-full">Conductor elegido</p>
          <p className="w-full font-bold xs:text-right">* {data.ConductorElegido}</p>
        </div>
        <div
          className={`flex justify-around items-start w-full ${
            data.Aseguradora == "Mundial" ? "xl:pl-4" : ""
          }`}
        >
          <p className="w-full">Servicio de Grúa</p>
          <p className="w-full font-bold xs:text-right">* {data.Grua}</p>
        </div>
      </div>
      <div className="flex flex-col w-1/5 items-center gap-4">
        <div className="flex flex-row justify-between w-1/3 text-base gap-4 font-semibold text-blue-400">
          <label htmlFor="seleccionarBox">Seleccionar</label>
          <input name="seleccionarBox" type="checkbox" onChange={(e) => handleInput(e)} checked={valueSeleccion}/>
        </div>
        <div className="flex flex-row justify-between w-1/3 text-base gap-2.5 font-semibold text-blue-400">
          <label htmlFor="seleccionarBox">Recomendar</label>
          <input name="recomendarBox" type="checkbox" />
        </div>
      </div>
    </motion.div>
  );
};
