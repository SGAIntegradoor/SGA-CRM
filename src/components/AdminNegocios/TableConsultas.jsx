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
          .includes(term)
      )
    );
  }, [data, searchFields, globalFilterValue]);

  // Excel de lo visible
  const exportExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(filtered);
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
            "asistencia_otros",
            "prima_neta",
            "gastos",
            "iva",
            "valor_total",
            "gastos_expedicion"
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
