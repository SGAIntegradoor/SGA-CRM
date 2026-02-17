import React, { useState, useMemo, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import BtnGeneral from "../BtnGeneral/BtnGeneral";
import { PiMagnifyingGlassBold } from "react-icons/pi";

export const TableConsultas = ({
  data = [],
  headers = [],
  from = "",
  typeSearch = "",
  onRowAction = () => {},
}) => {
  const dt = useRef(null);

  const [rows, setRows] = useState(6);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  // Campos a buscar (dinámicos desde headers)
  const searchFields = useMemo(() => headers.map((h) => h.field), [headers]);

  // Lista filtrada siempre derivada de `data`
  const filtered = useMemo(() => {
    const term = globalFilterValue.trim().toLowerCase();
    if (!term) return data;
    return data.filter((item) =>
      searchFields.some((f) =>
        String(item?.[f] ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [data, searchFields, globalFilterValue]);

  // Excel de lo visible - siguiendo el orden de los headers
  const exportExcel = () => {
    // Campos monetarios que deben exportarse con formato de moneda
    const moneyFields = [
      "asistencias_otros_poliza",
      "prima_neta_poliza",
      "gastos_expedicion_poliza",
      "iva_poliza",
      "valor_total_poliza",
    ];
    
    // Campos numéricos enteros (formato numérico sin decimales)
    const integerFields = [
      "no_certificado",
      "no_cuotas",
      "id_remision",
    ];
    
    // Campos de póliza que pueden ser numéricos o alfanuméricos
    const polizaFields = [
      "no_poliza",
      "id_poliza",
    ];
    
    // Campos que deben ser texto para evitar problemas
    const textFields = [
      "numero_documento_tomador",
      "numero_documento_asegurado", 
      "numero_documento_beneficiario",
    ];
    
    // Helper para determinar si un valor debe ser texto o número
    const isAlphanumeric = (value) => {
      const str = String(value);
      // Si contiene cualquier carácter que no sea dígito, es alfanumérico
      return /[^0-9]/.test(str);
    };

    // Crear los encabezados en el orden correcto (excluyendo "accion")
    const headersToExport = headers.filter((h) => h.field !== "accion");
    const headerRow = headersToExport.map((h) => h.header);

    // Crear las filas de datos en el orden de los headers
    const dataRows = filtered.map((row) => {
      return headersToExport.map((h) => {
        let value = row[h.field];
        
        // Si el valor es null, undefined o vacío
        if (value === null || value === undefined || value === "") {
          return "";
        }
        
        // Si es un campo monetario, convertir a número para cálculos
        if (moneyFields.includes(h.field)) {
          const num = Number(String(value).replace(/[^0-9.-]/g, ""));
          return isNaN(num) ? value : num;
        }
        
        // Si es un campo de póliza, evaluar si es alfanumérico o numérico puro
        if (polizaFields.includes(h.field)) {
          if (isAlphanumeric(value)) {
            // Mantener como texto (alfanumérico con letras)
            return String(value);
          } else {
            // Es numérico puro (incluyendo los que empiezan con 0), convertir a número
            const num = Number(String(value));
            return isNaN(num) ? String(value) : num;
          }
        }
        
        // Si es un campo numérico entero, convertir a número
        if (integerFields.includes(h.field)) {
          const num = Number(String(value).replace(/[^0-9.-]/g, ""));
          return isNaN(num) ? value : Math.floor(num);
        }
        
        // Para campos de texto
        return String(value);
      });
    });

    // Combinar encabezados y datos
    const worksheetData = [headerRow, ...dataRows];
    
    // Crear el worksheet desde el array
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
    
    // Aplicar formato a las celdas
    const range = xlsx.utils.decode_range(worksheet["!ref"]);
    
    for (let R = 1; R <= range.e.r; R++) { // Empezar desde fila 1 (después de headers)
      headersToExport.forEach((h, C) => {
        const cellAddress = xlsx.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        
        if (cell) {
          // Aplicar formato numérico a campos monetarios (sin signo de pesos)
          if (moneyFields.includes(h.field) && typeof cell.v === "number") {
            cell.z = '#,##0';
          }
          
          // Aplicar formato numérico entero (sin decimales)
          if (integerFields.includes(h.field) && typeof cell.v === "number") {
            cell.z = '0'; // Formato numérico sin decimales ni separadores
          }
          
          // Para campos de póliza: número sin decimales si es numérico, texto si es alfanumérico
          if (polizaFields.includes(h.field)) {
            if (typeof cell.v === "number") {
              cell.z = '0'; // Formato numérico sin decimales
            } else {
              cell.t = "s"; // Forzar texto
            }
          }
          
          // Forzar formato texto para documentos
          if (textFields.includes(h.field)) {
            cell.t = "s"; // Tipo texto
            cell.v = String(cell.v);
          }
        }
      });
    }
    
    // Ajustar el ancho de las columnas automáticamente
    const colWidths = headersToExport.map((h, idx) => {
      const maxLength = Math.max(
        h.header.length,
        ...dataRows.map((row) => String(row[idx] ?? "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `polizas_export_${Date.now()}.xlsx`);
  };

  const header = (
    <div className="flex flex-row items-center text-[14px] xl:justify-between md:justify-normal border-0 w-full gap-3">
      <div className="flex flex-row items-center gap-3">
        <Dropdown
          value={rows}
          options={[6, 10, 25, 50].map((val) => ({
            label: `${val}`,
            value: val,
          }))}
          onChange={(e) => setRows(e.value)}
          className="p-mr-2 w-auto max-w-[80px] text-[14px]"
        />
        <Button
          type="button"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={exportExcel}
          className="mr-11 text-[14px]"
        />
      </div>

      <IconField iconPosition="right">
        <InputIcon className="pi pi-search xs:block xxs:hidden" />
        <InputText
          value={globalFilterValue}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          placeholder="Buscar..."
          className="xxs:hidden xs:block xs:text-md xl:block lg:block md:block xs:w-auto xs:max-w-[110px] xxs:w-auto xxs:max-w-[90px] xl:w-auto xl:max-w-[200px] placeholder:text-[13px]"
        />
      </IconField>
    </div>
  );

  const formatPeso = (value) => {
    if (value === null || typeof value === "undefined" || value === "")
      return "N/A";
    // aseguramos que sea número
    const num = Number(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // helpers
  const isTruthy = (v) =>
    v === true || v === 1 || v === "1" || v === "true" || v === "TRUE";
  return (
    <>
      <style>{`
        .my-table .p-datatable-tbody > tr.row-paid {
          opacity: 0.55;                        /* look opaco */
        }
        .my-table .p-datatable-tbody > tr.row-paid td {
          background-color: #f3f4f6 !important; /* gris claro */
          color: #6b7280 !important;            /* texto gris */
        }
        .my-table .p-datatable-tbody > tr.row-paid a,
        .my-table .p-datatable-tbody > tr.row-paid button,
        .my-table .p-datatable-tbody > tr.row-paid input,
        .my-table .p-datatable-tbody > tr.row-paid .p-checkbox,
        .my-table .p-datatable-tbody > tr.row-paid .p-inputtext {
          pointer-events: none;                  /* evita interacción */
        }
        /* neutraliza visualmente el "striped" en pagadas */
        .my-table .p-datatable-tbody > tr.row-paid.p-row-odd td,
        .my-table .p-datatable-tbody > tr.row-paid.p-row-even td {
          background-image: none !important;
        }
      `}</style>

      <DataTable
        ref={dt}
        value={filtered}
        dataKey={`${typeSearch === "1" ? "id_poliza" : "id_anexo_poliza"}`}
        style={{ textAlign: "center", verticalAlign: "middle", padding: 0 }}
        paginator={from === ""}
        rows={rows}
        className="my-table text-xs"
        stripedRows
        showGridlines
        header={from === "" ? header : undefined}
        emptyMessage="No se encontró ningún registro"
        currentPageReportTemplate={
          from === ""
            ? "Mostrando {first} a {last} de {totalRecords} registros"
            : ""
        }
        paginatorTemplate={
          from === ""
            ? "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            : ""
        }
      >
        {headers.map((col) => {
          // columnas que quieres en formato pesos
          const moneyFields = [
            "asistencias_otros_poliza",
            "prima_neta_poliza",
            "gastos_expedicion_poliza",
            "iva_poliza",
            "valor_total_poliza",
          ];

          if (moneyFields.includes(col.field)) {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) => formatPeso(rowData?.[col.field])}
              />
            );
          }

          if (col.field === "accion") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) => (
                  <BtnGeneral
                    id="btnConsultar"
                    className="h-9 w-10 flex flex-row justify-center items-center bg-lime-9000 text-white rounded hover:bg-lime-600 transition duration-300 ease-in-out"
                    funct={() => onRowAction(rowData)}
                  >
                    <PiMagnifyingGlassBold size={20} color="white" />
                  </BtnGeneral>
                )}
              />
            );
          }
          if (col.field === "nombre_usuario_freelance") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) =>
                  !rowData[col.field] || rowData[col.field].trim() === ""
                    ? "N/A"
                    : rowData[col.field]
                }
              />
            );
          }
          if (col.field === "asesor_freelance") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) =>
                  rowData[col.field] == null || rowData[col.field].trim() === ""
                    ? "N/A"
                    : rowData[col.field]
                }
              />
            );
          }
          if (col.field === "nombre_asesor_sga") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) =>
                  rowData["asesor_sga"] == null || rowData["asesor_sga"].trim() === ""
                    ? "N/A"
                    : rowData["nombre_asesor_sga"]
                
                }
              />
            );
          }
          if (col.field === "nombre_financiera") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
                body={(rowData) =>
                  rowData["financiada_por"] == "0" 
                    ? "N/A"
                    : rowData["nombre_financiera"]
                
                }
              />
            );
          }
          return (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              style={{ textAlign: "center" }}
              headerStyle={{ textAlign: "center" }}
            />
          );
        })}
      </DataTable>
    </>
  );
};
