import React, { useState } from "react";
import "./css/styles.css";
export const Switch = ({from, buttonSwitch, setButtonSwitch, isDisabled}) => {
  const [activo, setActivo] = useState(false); // false = No, true = Sí

  const manejarCambio = (e) => {
    setActivo(e.target.checked);
    setButtonSwitch((prevState) => ({
      ...prevState,
      [`${from}`]: e.target.checked
    }));
  };

  return (
    <label className="rocker" style={{ fontSize: "6.5px" }} disabled={isDisabled}>
      <input type="checkbox" checked={activo} onChange={manejarCambio} disabled={isDisabled} />
      <span className="switch-left" disabled={isDisabled}>Si</span>
      <span className="switch-right" disabled={isDisabled}>No</span>
    </label>
  );
};
