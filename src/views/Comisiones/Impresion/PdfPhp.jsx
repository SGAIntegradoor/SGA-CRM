import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { pdfServices } from "../../../services/PDF/PdfService";
import { useLocation } from "react-router-dom";

export default function PdfServicesImpresion() {
  const path = useLocation();
  const id = path.search.replace("?id=", "");

  const [liquidacion, setLiquidacion] = useState(null);
  const pdfRef = useRef(null);
  const hasAutoPrintedRef = useRef(false);

  const closeAfterPrint = () => {
    window.close();

    setTimeout(() => {
      if (!window.closed) {
        window.history.back();
      }
    }, 300);
  };

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: "",
    removeAfterPrint: true,
    ignoreGlobalStyles: true,
    onAfterPrint: closeAfterPrint,
    pageStyle: `
      @page { size: A4 landscape; margin: 0mm; }
      @media print {
        .no-print { display: none !important; }
      }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      table, tr, td, th, section { break-inside: avoid; page-break-inside: avoid; }
      .page-break { break-after: page; }
    `,
  });

  useEffect(() => {
    (async () => {
      if (id) {
        const res = await pdfServices(id);
        setLiquidacion(res ?? "");
      } else return null;
    })();
  }, []);

  useEffect(() => {
    if (!liquidacion || hasAutoPrintedRef.current) return;
    hasAutoPrintedRef.current = true;

    const frame = requestAnimationFrame(() => {
      handlePrint();
    });

    return () => cancelAnimationFrame(frame);
  }, [liquidacion, handlePrint]);

  return (
    <div>
      <button
        className="no-print"
        onClick={() => handlePrint()}
        disabled={!liquidacion}
      >
        Imprimir
      </button>

      <div ref={pdfRef}>
        <div dangerouslySetInnerHTML={{ __html: liquidacion || "" }} />
      </div>
    </div>
  );
}
