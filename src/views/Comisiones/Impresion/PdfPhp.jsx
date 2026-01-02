import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { pdfServices } from "../../../services/PDF/PdfService";
import { useLocation } from "react-router-dom";

export default function PdfServicesImpresion() {
  const path = useLocation();
  const id = path.search.replace("?id=", "");

  const [liquidacion, setLiquidacion] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (id) {
        const res = await pdfServices(id); // debe devolver un string HTML
        setLiquidacion(res ?? ""); // evita null
      } else return null;
    })();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: pdfRef, // ✅ v3 usa contentRef
    documentTitle: "",
    removeAfterPrint: true,
    pageStyle: `
      @page { size: A4 landscape; margin: 0mm; }
    @media print {
      /* Fuerza medidas de A4 horizontal para evitar reflow/cortes */
      // .print-landscape {
      //   width: 297mm;
      //   min-height: 210mm;
      // }
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    table, tr, td, th, section { break-inside: avoid; page-break-inside: avoid; }
    .page-break { break-after: page; }
    `,
  });

  return (
    <div>
      <button
        className="no-print"
        onClick={() => handlePrint()}
        disabled={!liquidacion} // evita “There is nothing to print”
      >
        Imprimir
      </button>

      {/* El ref DEBE apuntar a un nodo DOM montado */}
      <div ref={pdfRef}>
        <div dangerouslySetInnerHTML={{ __html: liquidacion || "" }} />
      </div>
    </div>
  );
}
