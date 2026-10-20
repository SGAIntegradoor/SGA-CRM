import { useEffect, useRef, useState } from "react";
import { MdOutlineUploadFile, MdClose } from "react-icons/md";
import Swal from "sweetalert2";
import { analizarPolizaPdf } from "../../services/Polizas/analizarPolizaPdf";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";

const MAX_MB = 10;

const esPdf = (file) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

/**
 * Popup del lector de pólizas con IA: recibe un PDF (arrastrar o seleccionar),
 * lo manda a /Lector/analizarPoliza y entrega el resultado con onLectura(resultado, archivo).
 */
export const ModalLectorPoliza = ({ show, onClose, onLectura }) => {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const { busy, guard } = useSubmitGuard();

  useEffect(() => {
    if (!show) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  useEffect(() => {
    if (!show) setArchivo(null);
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, busy, onClose]);

  if (!show) return null;

  const seleccionar = (file) => {
    if (!file) return;
    if (!esPdf(file)) {
      Swal.fire({
        icon: "error",
        title: "Archivo no válido",
        text: "Solo se permiten archivos PDF.",
      });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Archivo demasiado grande",
        text: `El PDF supera el límite de ${MAX_MB} MB.`,
      });
      return;
    }
    setArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (busy) return;
    const files = e.dataTransfer.files;
    if (files.length > 1) {
      Swal.fire({
        icon: "warning",
        title: "Un archivo a la vez",
        text: "Arrastra solo el PDF de una póliza.",
      });
      return;
    }
    seleccionar(files[0]);
  };

  const handleAnalizar = guard(async () => {
    if (!archivo) return;
    const resultado = await analizarPolizaPdf(archivo);
    if (resultado?.status !== "Ok") {
      Swal.fire({
        icon: "error",
        title: "No se pudo leer la póliza",
        text: resultado?.message || "Ocurrió un error inesperado.",
      });
      return;
    }
    onLectura(resultado, archivo);
  });

  return (
    <div
      className="fixed inset-0 flex justify-center items-start overflow-y-auto"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 5000 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lector-poliza-titulo"
        className="bg-white rounded-lg shadow-2xl w-[520px] max-w-[95vw] mt-[60px] mb-5 flex flex-col"
      >
        <div className="bg-lime-9000 w-full p-3 text-white font-semibold text-[17px] rounded-tl-lg rounded-tr-lg flex flex-row justify-between items-center">
          <p id="lector-poliza-titulo">Leer póliza desde PDF</p>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={busy}
            className={busy ? "opacity-50 cursor-not-allowed" : ""}
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            La IA lee la carátula y llena el formulario de registro. Revisa
            cada campo antes de guardar.
          </p>

          <div
            role="button"
            tabIndex={0}
            aria-label="Seleccionar o arrastrar el PDF de la póliza"
            onClick={() => !busy && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !busy) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 text-center transition duration-200 ${
              arrastrando
                ? "border-lime-600 bg-lime-50"
                : "border-gray-300 hover:border-lime-600"
            } ${busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <MdOutlineUploadFile size={46} className="text-gray-500" />
            <p className="font-semibold text-gray-700">
              Arrastra aquí el PDF de la póliza
            </p>
            <p className="text-sm text-gray-500">
              o haz clic para seleccionarlo (solo PDF, máx. {MAX_MB} MB)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                seleccionar(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>

          {archivo && (
            <div className="flex flex-row justify-between items-center bg-gray-100 rounded-md px-3 py-2 text-sm">
              <span className="truncate" title={archivo.name}>
                {archivo.name}
              </span>
              <button
                type="button"
                className="text-blue-500 font-bold ml-3 disabled:opacity-50"
                onClick={() => setArchivo(null)}
                disabled={busy}
              >
                Quitar
              </button>
            </div>
          )}

          {busy && (
            <p className="text-sm text-gray-600 text-center" aria-live="polite">
              Analizando el PDF... puede tardar hasta un minuto.
            </p>
          )}

          <div className="flex flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-5 h-[35px] rounded border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAnalizar}
              disabled={!archivo || busy}
              className="bg-lime-9000 text-white px-8 h-[35px] rounded hover:bg-lime-600 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Analizando..." : "Analizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
