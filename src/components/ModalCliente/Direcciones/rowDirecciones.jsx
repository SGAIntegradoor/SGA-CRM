import React from "react";
import Select from "react-select";
export const RowDirecciones = ({
  num,
  direccion,
  setDireccion,
  optionsDeptos,
  handleDepartamentoChange,
  departamento,
  ciudad,
  setDepartamento,
  ciudadesDisponibles,
  setCiudad,
  principalSeleccionado,
  setPrincipalSeleccionado,
}) => {
  return (
    <div className="flex flex-row pr-10 pt-3 w-full">
      <p id={`numero${num}`} className="text-lg pl-[94px] pt-2">
        {num}
      </p>
      <input
        type="text"
        name={`direccion${num}`}
        value={direccion[`numero${num}`]}
        onChange={(e) =>
          setDireccion({ ...direccion, [`numero${num}`]: e.target.value })
        }
        placeholder={`Direccion # ${num}`}
        className="peer w-[130px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 placeholder:text-center ml-[45px]"
      />

      <Select
        className="w-[185px] h-[30px] border border-gray-300 rounded-sm text-sm ml-[25px]"
        options={optionsDeptos.sort((a, b) =>
          a.label.localeCompare(b.label)
        )}
        name={`departamento${num}`}
        onChange={(option) => {

          const value = option?.value || "";

          handleDepartamentoChange(`departamento${num}`, value);

          setDepartamento((prev) => ({
            ...prev,
            [`departamento${num}`]: value,
          }));

          if (!option) {
            setCiudad((prev) => ({
              ...prev,
              [`ciudad${num}`]: "",
            }));
          }
        }}
        value={
          optionsDeptos.find(
            (opt) => opt.value === departamento[`departamento${num}`]
          )|| null
        }
        isClearable
      />

      <Select
        className="w-[185px] h-[30px] border border-gray-300 rounded-sm text-sm ml-[25px]"
        name={`ciudad${num}`}
        options={ciudadesDisponibles?.[`ciudad${num}`] || []}
        onChange={(option) =>
          setCiudad({
            ...ciudad,
            [`ciudad${num}`]: option?.value || "",
          })
        }
        value={
          ciudadesDisponibles?.[`ciudad${num}`]?.find(
            (opt) => opt.value === ciudad[`ciudad${num}`]
          ) || null
        }
        isClearable
      />
      <input
        type="radio"
        name="principal"
        value={`principal${num}`}
        checked={
          principalSeleccionado === `principal${num}` &&
          direccion[`numero${num}`] !== ""
        }
        onChange={(e) => setPrincipalSeleccionado(e.target.value)}
        className="ml-[70px] accent-lime-9000 appearance-none checked:bg-lime-9000 checked:border-lime-9000 focus:outline-none  rounded-full w-4 h-4 border border-gray-400 cursor-pointer mt-3"
      />
    </div>
  );
};
