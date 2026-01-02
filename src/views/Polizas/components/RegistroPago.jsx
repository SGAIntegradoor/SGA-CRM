export const RegistroPago = ({
  formasPago,
  pago, // Objeto con { fecha, formaPago, valor }
  index, // Índice del pago en el array
  setValoresRecibidos,
  onEliminarPago,
  registrarPagos,
  otrosConceptos, // Array de otros conceptos
  otrosConceptosValor, // Valor del otro concepto
  setOtrosConceptosValor, // Función para actualizar el valor del otro concepto
  certificado, // Certificado asociado al pago
  from
}) => {
  // Maneja los cambios de cada campo del pago
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValoresRecibidos((prev) => {
      const newPagos = [...prev];
      newPagos[index] = {
        ...newPagos[index],
        certificado,
        [name]:
          name === "valor"
            ? value.replace(/\D/g, "")
              ? Number(value.replace(/\D/g, "")).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : ""
            : value,
      };
      return newPagos;
    });
  };

  return (
    <div className="flex flex-row w-full justify-between">
      <div className="flex flex-row w-auto gap-3">
        {/* Fecha del pago */}
        <div className="flex flex-col w-[120px]">
          <input
            type="date"
            name="fecha"
            id={`fecha_${index}`}
            value={pago.fecha || ""}
            onChange={handleChange}
            disabled={pago.pagoEjecutado == "1" ? true : !registrarPagos}
            className={`border-0 bo
              rder-gray-300 text-gray-900 focus:outline-none h-[30px] p-1 border-b-[1px] mr-5`}

          />
        </div>

        {/* Tipo de forma de pago */}
        <div className="flex flex-col w-[140px]">
          <select
            name="formaPago"
            id={`formaPago_${index}`}
            value={pago.formaPago || ""}
            onChange={handleChange}
            disabled={pago.pagoEjecutado == "1" ? true : !registrarPagos}
            className="w-auto text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-1"
          >
            <option value="">Formas de pago</option>
            {formasPago.map((fp) => (
              <option key={fp.id} value={fp.id}>
                {fp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Valor recibido */}
        <div className="flex flex-col w-auto">
          <input
            type="text"
            name="valor"
            id={`valor_${index}`}
            value={pago.valor || ""}
            onChange={handleChange}
            disabled={pago.pagoEjecutado == "1" ? true : !registrarPagos}
            className="border-0 border-gray-300 text-gray-900 focus:outline-none h-[30px] p-1 border-b-[1px]"
            placeholder="Valor recibido"
          />
        </div>

        {/* Botón eliminar */}
        <div className="flex flex-col w-auto">
          <button
            id={`eliminar_${index}`}
            onClick={() => onEliminarPago(index)}
            disabled={pago.pagoEjecutado == "1" ? true : !registrarPagos}
            className="bg-black font-bold text-xl text-white p-2 w-[30px] h-[30px] flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      {index == 0  ? (
        <div className="flex flex-row w-auto gap-5">
          <select
            name="otrosConceptos"
            onChange={(e) => {
              setOtrosConceptosValor(prev => ({ ...prev, razon_concepto: e.target.value }));
            }}
            // disabled={!registrarPagos}
            className="w-auto text-md border-[1px] border-gray-300 text-gray-900 focus:outline-none h-[30px] rounded-md p-1"
          >
            <option value="">Otros conceptos</option>
            {otrosConceptos.map((oc) => (
              <option key={oc.value} value={oc.value}>
                {oc.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="otrosConceptosValor"
            value={otrosConceptosValor.valor || ""}
            onChange={(e) => setOtrosConceptosValor(prev => ({ ...prev, valor: e.target.value }))}
            // disabled={!registrarPagos}
            className="border-0 border-gray-300 text-gray-900 focus:outline-none h-[30px] p-1 border-b-[1px]"
            placeholder="Valor recibido"
          />
        </div>
      ) : null}
      {/* Otros conceptos */}
    </div>
  );
};
