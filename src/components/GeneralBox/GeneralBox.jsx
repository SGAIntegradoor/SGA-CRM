import { Box, Collapse } from "@mui/material";

export const GeneralBox = ({
  titulo,
  children,
  width,
  zIndex,
  stateHeader = null,
  statePago = null,
  setStatePago = null,
  textButton = [],
  readyToSave = null,
  onClose,
  headerBox = null,
  classname,
}) => {
  return (
    // poner boxshadow recibido por props
    <Box
      padding={3}
      className={`${headerBox === true ? "flex flex-col items-center" : ""}`}
    >
      <section
        className={`shadow-xl ${
          titulo === "Registro de pago"
            ? "rounded-tl-xl rounded-tr-xl"
            : headerBox === true
            ? ""
            : "rounded-xl"
        } ${width} ${zIndex} border-l border-r border-b border-gray-400`}
      >
        {headerBox == null && (
          <div className="flex flex-row gap-5 items-center bg-lime-9000 p-3 rounded-t-xl border-gray-400 border justify-between">
            <p className="text-[17px] pl-1 text-white font-semibold">
              {titulo}
            </p>
            {titulo === "Registro de pago" && (
              <button
                className={
                  (stateHeader
                    ? "bg-lime-400 hover:bg-lime-500 border-[1px]"
                    : "bg-gray-400 hover:bg-gray-300") +
                  " text-white font-bold py-2 px-4 rounded transition-colors duration-300 ease-in-out"
                }
                onClick={(e) => setStatePago(readyToSave, e)}
              >
                <span className="text-white">
                  {statePago ? textButton[1] : textButton[0]}
                </span>
              </button>
            )}
            {titulo === "Liquidación de comisiones" && (
              <button
                className={
                  "bg-lime-9000 hover:bg-lime-500 border-[1px] text-white font-bold py-1 px-3 rounded transition-colors duration-300 ease-in-out"
                }
                onClick={onClose}
              >
                <span className="text-white">
                  {statePago ? textButton[1] : textButton[0]}
                </span>
              </button>
            )}
          </div>
        )}

        {titulo === "Registro de pago" ? (
          <Collapse
            in={!!statePago}
            timeout={400}
            unmountOnExit
            easing={{
              enter: "cubic-bezier(0.4, 0, 0.2, 1)",
              exit: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              className={
                "flex flex-col gap-3 text-md pt-4 pl-6 pr-6 pb-4 h-auto w-auto " +
                // un toque de fade/slide para que se sienta más suave
                " transition-opacity duration-300 ease-out opacity-100 translate-y-0"
              }
            >
              {children}
            </div>
          </Collapse>
        ) : titulo === "Liquidación de comisiones" ? (
          <div className="flex flex-col gap-3 rounded-b-xl text-md h-auto w-auto">
            {children}
          </div>
        ) : (
          <div
            className={`flex flex-col gap-3 ${
              headerBox !== null ? "" : "p-4 rounded-b-xl"
            }  text-md h-auto w-auto`}
          >
            {children}
          </div>
        )}
      </section>
    </Box>
  );
};
