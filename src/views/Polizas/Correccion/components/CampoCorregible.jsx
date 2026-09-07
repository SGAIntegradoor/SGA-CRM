/* eslint-disable react/prop-types */
import { useTheme } from "@mui/material";
import { tokens } from "../../../../theme";
import { MdOutlineHistory, MdWarningAmber } from "react-icons/md";

/**
 * Campo de formulario para el módulo de corrección.
 * Marca visualmente el campo cuando el valor difiere del original,
 * muestra el valor anterior y permite revertirlo.
 */
export const CampoCorregible = ({
  label,
  name,
  value,
  original,
  onChange,
  onRevert,
  type = "text",
  options = null,
  disabled = false,
  hint = "",
  warning = "",
  maxLength,
  uppercase = false,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const norm = (v) => (v === null || v === undefined ? "" : String(v));
  const dirty = norm(value) !== norm(original);

  const originalLabel = () => {
    if (norm(original) === "") return "(vacío)";
    if (options) {
      const found = options.find((o) => norm(o.value) === norm(original));
      return found ? found.label : norm(original);
    }
    return norm(original);
  };

  const baseInput = {
    width: "100%",
    height: 38,
    borderRadius: 6,
    padding: "0 10px",
    fontSize: "0.9rem",
    outline: "none",
    color: colors.gray[100],
    backgroundColor: isDark ? colors.primary[400] : "#ffffff",
    border: `1px solid ${dirty ? colors.blueAccent[500] : colors.gray[isDark ? 600 : 800]}`,
    boxShadow: dirty ? `inset 3px 0 0 0 ${colors.blueAccent[500]}` : "none",
    transition: "border-color .15s ease, box-shadow .15s ease",
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={name}
          className="text-[0.72rem] uppercase tracking-wide font-semibold"
          style={{ color: colors.gray[isDark ? 300 : 600] }}
        >
          {label}
        </label>

        {dirty && (
          <button
            type="button"
            onClick={() => onRevert(name)}
            className="flex items-center gap-1 text-[0.68rem] px-2 py-[2px] rounded-full"
            style={{
              color: colors.blueAccent[300],
              border: `1px solid ${colors.blueAccent[400]}`,
            }}
            title="Revertir al valor original"
          >
            <MdOutlineHistory size={12} /> Revertir
          </button>
        )}
      </div>

      {options ? (
        <select
          id={name}
          name={name}
          value={norm(value)}
          disabled={disabled}
          onChange={(e) => onChange(name, e.target.value)}
          style={{ ...baseInput, opacity: disabled ? 0.6 : 1 }}
        >
          <option value="">Seleccione…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={norm(value)}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(e) =>
            onChange(
              name,
              uppercase ? e.target.value.toUpperCase() : e.target.value
            )
          }
          style={{ ...baseInput, opacity: disabled ? 0.6 : 1 }}
        />
      )}

      {dirty && (
        <span
          className="text-[0.7rem]"
          style={{ color: colors.gray[isDark ? 400 : 500] }}
        >
          Antes:{" "}
          <span style={{ textDecoration: "line-through" }}>
            {originalLabel()}
          </span>
        </span>
      )}

      {!dirty && hint && (
        <span
          className="text-[0.7rem]"
          style={{ color: colors.gray[isDark ? 400 : 500] }}
        >
          {hint}
        </span>
      )}

      {dirty && warning && (
        <span
          className="flex items-center gap-1 text-[0.7rem]"
          style={{ color: colors.redAccent[isDark ? 300 : 500] }}
        >
          <MdWarningAmber size={13} /> {warning}
        </span>
      )}
    </div>
  );
};

export default CampoCorregible;
