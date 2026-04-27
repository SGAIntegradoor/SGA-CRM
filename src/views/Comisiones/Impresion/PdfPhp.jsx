import React, { useEffect, useRef, useState } from "react";
import { pdfServices } from "../../../services/PDF/PdfService";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";

export default function PdfServicesImpresion() {
  const path = useLocation();
  const id = path.search.replace("?id=", "");

  const [liquidacion, setLiquidacion] = useState(null);
  const pdfRef = useRef(null);

    const addDynamicPageBreaks = (htmlString) => {
        if (!htmlString || typeof htmlString !== "string") return htmlString;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");

        const splitColumnByMarker = (columnNode, isMarkerNode) => {
            const segments = [];
            let currentSegment = columnNode.cloneNode(false);

            Array.from(columnNode.childNodes).forEach((childNode) => {
                const startsNewSegment =
                    currentSegment.childNodes.length > 0 && isMarkerNode(childNode);

                if (startsNewSegment) {
                    segments.push(currentSegment);
                    currentSegment = columnNode.cloneNode(false);
                }

                currentSegment.appendChild(childNode.cloneNode(true));
            });

            if (currentSegment.childNodes.length > 0) {
                segments.push(currentSegment);
            }

            return segments;
        };

        const mergeFirstTwoSegments = (segments) => {
            if (segments.length <= 1) return segments;

            const mergedFirstSegment = segments[0].cloneNode(false);

            Array.from(segments[0].childNodes).forEach((node) => {
                mergedFirstSegment.appendChild(node.cloneNode(true));
            });

            Array.from(segments[1].childNodes).forEach((node) => {
                mergedFirstSegment.appendChild(node.cloneNode(true));
            });

            return [mergedFirstSegment, ...segments.slice(2)];
        };

        const splitPlanColumn = (planColumn) => {
            const contentWrapper = Array.from(planColumn.children).find(
                (element) =>
                    element.tagName === "DIV" &&
                    element.getAttribute("style")?.includes("display: block")
            );

            if (!contentWrapper) {
                return [planColumn.cloneNode(true)];
            }

            const leadingNodes = Array.from(planColumn.childNodes).filter(
                (node) => node !== contentWrapper
            );

            const contentSegments = [];
            let currentContentSegment = contentWrapper.cloneNode(false);

            Array.from(contentWrapper.childNodes).forEach((childNode) => {
                const startsNewSegment =
                    currentContentSegment.childNodes.length > 0 &&
                    childNode.nodeType === Node.ELEMENT_NODE &&
                    childNode.matches('div[style*="flex-direction: column"]');

                if (startsNewSegment) {
                    contentSegments.push(currentContentSegment);
                    currentContentSegment = contentWrapper.cloneNode(false);
                }

                currentContentSegment.appendChild(childNode.cloneNode(true));
            });

            if (currentContentSegment.childNodes.length > 0) {
                contentSegments.push(currentContentSegment);
            }

            return contentSegments.map((contentSegment, index) => {
                const planColumnClone = planColumn.cloneNode(false);

                if (index === 0) {
                    leadingNodes.forEach((node) => {
                        planColumnClone.appendChild(node.cloneNode(true));
                    });
                }

                planColumnClone.appendChild(contentSegment);
                return planColumnClone;
            });
        };

        const mainContainers = Array.from(doc.querySelectorAll(".main-container"));

        mainContainers.forEach((mainContainer) => {
            const leftDescriptorColumn = Array.from(mainContainer.children).find(
                (element) =>
                    element.nodeType === Node.ELEMENT_NODE &&
                    element.classList.contains("left-col")
            );
            const plansContainer = Array.from(mainContainer.children).find(
                (element) =>
                    element.nodeType === Node.ELEMENT_NODE &&
                    element.classList.contains("container")
            );

            if (!leftDescriptorColumn || !plansContainer) return;

            const planColumns = Array.from(plansContainer.children).filter(
                (element) =>
                    element.nodeType === Node.ELEMENT_NODE &&
                    element.classList.contains("left-col")
            );

            if (!planColumns.length) return;

            const leftSegments = mergeFirstTwoSegments(
                splitColumnByMarker(
                    leftDescriptorColumn,
                    (node) =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        node.matches("img.oculto")
                )
            );

            const planSegmentsByColumn = planColumns.map((planColumn) =>
                mergeFirstTwoSegments(splitPlanColumn(planColumn))
            );

            const segmentCount = Math.max(
                leftSegments.length,
                ...planSegmentsByColumn.map((segments) => segments.length)
            );

            if (segmentCount <= 1) return;

            const fragment = doc.createDocumentFragment();

            for (let index = 0; index < segmentCount; index += 1) {
                if (index > 0) {
                    const breakNode = doc.createElement("div");
                    breakNode.className = "page-break page-break-dynamic";
                    fragment.appendChild(breakNode);
                }

                const mainContainerClone = mainContainer.cloneNode(false);
                const leftSegment = leftSegments[index];

                if (leftSegment) {
                    mainContainerClone.appendChild(leftSegment);
                }

                const plansContainerClone = plansContainer.cloneNode(false);

                planSegmentsByColumn.forEach((segments, segmentIndex) => {
                    const planSegment = segments[index];

                    if (planSegment) {
                        plansContainerClone.appendChild(planSegment);
                        return;
                    }

                    plansContainerClone.appendChild(planColumns[segmentIndex].cloneNode(false));
                });

                mainContainerClone.appendChild(plansContainerClone);
                fragment.appendChild(mainContainerClone);
            }

            mainContainer.replaceWith(fragment);
        });

        return doc.body.innerHTML;
    };

    const openPdfPreviewWindow = async () => {
        if (!liquidacion || !pdfRef.current) return;

        const previewWindow = window.open("", "_blank");
        if (!previewWindow) return;

        previewWindow.document.write(
            '<html><head><title>Vista previa PDF</title></head><body style="font-family: sans-serif; margin: 16px;">Generando vista previa...</body></html>'
        );
        previewWindow.document.close();

        try {
            const pdfBlob = await html2pdf()
                .set({
                    margin: [11.176, 0, 0, 0],
                    html2canvas: { scale: 1.5, useCORS: true, allowTaint: true },
                    jsPDF: { unit: "mm", format: "a3", orientation: "landscape" },
                    pagebreak: { mode: ["css", "legacy"] },
                })
                .from(pdfRef.current)
                .toPdf()
                .outputPdf("blob");

            const blobUrl = URL.createObjectURL(pdfBlob);
            previewWindow.location.href = blobUrl;
            previewWindow.addEventListener("beforeunload", () => URL.revokeObjectURL(blobUrl), {
                once: true,
            });
        } catch (error) {
            previewWindow.document.body.innerHTML = "No se pudo generar la vista previa del PDF.";
            console.error("Error generando vista previa con html2pdf:", error);
        }
    };

    const handlePrintClick = async () => {
        await openPdfPreviewWindow();
    };
  // table, tr, td, th, section { break-inside: avoid; page-break-inside: avoid; }

  useEffect(() => {
    (async () => {
      if (id) {
        const res = await pdfServices(id);
                setLiquidacion(addDynamicPageBreaks(res ?? ""));
      } else return null;
    })();
  }, []);

  return (
    <div>
      <button
        className="no-print"
                onClick={handlePrintClick}
        disabled={!liquidacion}
      >
        Imprimir
      </button>
      <div
        ref={pdfRef}
        className="pdf-print-root"
        style={{ all: "revert" }}
        dangerouslySetInnerHTML={{ __html: liquidacion || "" }}
      />
    </div>
  );
}
