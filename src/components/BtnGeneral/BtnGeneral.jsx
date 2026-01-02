const BtnGeneral = ({ children, className, id, funct, isDisabled }) => {
  return <button id={id} className={className + (isDisabled ? " opacity-50 cursor-not-allowed" : "")} onClick={funct} disabled={isDisabled}>{children}</button>;
};

export default BtnGeneral;
