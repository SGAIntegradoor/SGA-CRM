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
    // removeAfterPrint: true,
    ignoreGlobalStyles: true,
    // onAfterPrint: closeAfterPrint,
    

    pageStyle: `
    @page { size: A3 landscape; margin-top: 10mm; margin-left: 0mm; margin-right: 0mm; margin-bottom: 0mm; }
    @media print {
        .no-print { display: none !important; }
                .page-break-dynamic {
                    break-before: page;
                    page-break-before: always;
                }
      }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
            .page-break-dynamic {
                display: block;
                width: 100%;
                height: 0;
            }
      `,
  });
  // table, tr, td, th, section { break-inside: avoid; page-break-inside: avoid; }

  useEffect(() => {
    (async () => {
      if (id) {
        const res = await pdfServices(id);
                setLiquidacion(addDynamicPageBreaks(res ?? ""));
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
      <div
        ref={pdfRef}
        className="pdf-print-root"
        style={{ all: "revert" }}
        dangerouslySetInnerHTML={{ __html: liquidacion || "" }}
      />
    </div>
  );
}
