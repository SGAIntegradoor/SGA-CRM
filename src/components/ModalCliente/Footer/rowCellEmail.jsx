export const RowCellEmail = ({
  num,
  celular,
  setCelular,
  principalCelularSeleccionado,
  setPrincipalCelularSeleccionado,
  email,
  setEmail,
  principalEmailSeleccionado,
  setPrincipalEmailSeleccionado,
}) => {
  return (
    <div className="flex flex-row pr-10 pt-3 w-full">
      <p id={`numero${num}`} className="text-lg pl-[94px] pt-2">
        {num}
      </p>
      <input
        type="text"
        name={`celular${num}`}
        value={celular[`celular${num}`]}
        onChange={(e) =>
          setCelular({ ...celular, [`celular${num}`]: e.target.value })
        }
        // placeholder={`Celular # ${num}`}
        className="peer w-[170px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 placeholder:text-center ml-[55px]"
      />

      <input
        type="radio"
        name={`principalCelular`}
        value={`principalCelular${num}`}
        checked={principalCelularSeleccionado === `principalCelular${num}`}
        onChange={(e) => setPrincipalCelularSeleccionado(e.target.value)}
        className="ml-[55px] accent-lime-9000 appearance-none checked:bg-lime-9000 checked:border-lime-9000 focus:outline-none  rounded-full w-4 h-4 border border-gray-400 cursor-pointer mt-3"
        disabled={celular[`celular${num}`] === ""}
      />

      <input
        type="text"
        name={`email${num}`}
        value={email[`email${num}`]}
        onChange={(e) =>
          setEmail({ ...email, [`email${num}`]: e.target.value })
        }
        // placeholder={`Email # ${num}`}
        className="peer w-[170px] border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 placeholder:text-center ml-[80px]"
      />
      <input
        type="radio"
        name="principalEmail"
        value={`principalEmail${num}`}
        checked={principalEmailSeleccionado === `principalEmail${num}`}
        onChange={(e) => setPrincipalEmailSeleccionado(e.target.value)}
        className="ml-[70px] accent-lime-9000 appearance-none checked:bg-lime-9000 checked:border-lime-9000 focus:outline-none  rounded-full w-4 h-4 border border-gray-400 cursor-pointer mt-3"
        disabled={email[`email${num}`] === ""}
      />
    </div>
  );
};
