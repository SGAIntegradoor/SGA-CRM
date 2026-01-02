import React from "react";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export const TableAlerts = ({ data }) => {
  return (
    <div className="overflow-x-auto rounded-t-xl w-full pb-4 text-center">
      <div className="flex flex-col">
          <div className="inline-block w-full">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-lime-9000 scrollbar-track-gray-100">
              <table className="w-full">
                <thead className="bg-white border-b text-center">
                  <tr>
                    <th
                      scope="col"
                      className="text-sm font-medium text-gray-900 px-6 py-4 text-center"
                    >
                      Aseguradora
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium text-gray-900 px-6 py-4 text-center"
                    >
                      Cotizo ?
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium text-gray-900 px-6 py-4 text-center"
                    >
                      Productos Cotizados
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium text-gray-900 px-6 py-4 text-center"
                    >
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody className="rounded-b-xl">
                  {data?.sort((a, b) => a.aseguradora.localeCompare(b.aseguradora)).map((element, index) => {
                    return index % 2 == 0 ? (
                      <tr className="bg-gray-100 border-b">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {element.aseguradora}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                          {element.ofertas_cotizadas > 0 ? (
                            <CheckCircleIcon style={{ color: "green" }} />
                          ) : (
                            <CancelIcon style={{ color: "red" }} />
                          )}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                          {element.ofertas_cotizadas}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-wrap">
                          {Array.isArray(element.mensajes)
                            ? element.mensajes.find((mensaje) =>
                                mensaje == "Cotizacion Exitosa"
                                  ? "Cotización Exitosa"
                                  : mensaje[0][0].split(",")[0]
                              )
                            : null}
                        </td>
                      </tr>
                    ) : (
                        <tr className="bg-white border-b">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {element.aseguradora}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-wrap">
                          {element.ofertas_cotizadas > 0 ? (
                            <CheckCircleIcon style={{ color: "green" }} />
                          ) : (
                            <CancelIcon style={{ color: "red" }} />
                          )}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-wrap">
                          {element.ofertas_cotizadas}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 break-words">
                          {Array.isArray(element.mensajes)
                            ? element.mensajes.find((mensaje) =>
                                mensaje == "Cotizacion Exitosa"
                                  ? "Cotización Exitosa"
                                  : mensaje[0][0].split(",")[0]
                              )
                            : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
};
