import React, { useState, useMemo, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { TiDocumentText } from "react-icons/ti";
import { FaTrashAlt } from "react-icons/fa";

import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";

export const TablePagosLiq = ({
  data = [],
  headers = [],
  from = "",
  onToggleSelect = () => {},
  onAnulation = () => {},
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

  // helpers
  const isTruthy = (v) =>
    v === true || v === 1 || v === "1" || v === "true" || v === "TRUE";
  const isChecked = (val) => isTruthy(val);
  const isWasSettled = (val) => isTruthy(val);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };


  const navigateToLiquidacion = (id_liquidacion) => {
    const url = `/crm/comisiones/liquidacion/impresion?id_liquidacion=${id_liquidacion}`;
    window.open(url, "_blank");
  }

  return (
    <>
      {/* Estilos locales para filas pagadas */}
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
        dataKey="id_liquidacion"
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
        // rowClassName={(row) => {
        //   const selected = isChecked(row.seleccionado);
        //   if (selected) return " bg-lime-50";
        // }}
      >
        {headers.map((col) => {
          // Columna de selección (checkbox)
          if (col.field === "acciones") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  console.log(row)
                  const checked = isChecked(row.seleccionada_liq);
                  return (
                    <div className="flex flex-row items-center justify-between">
                      <button onClick={() => navigateToLiquidacion(row.id_liquidacion)}>
                        <TiDocumentText size={20} />
                      </button>
                      <button className="mb-[1px]" onClick={() => onAnulation(row.id_liquidacion, row.identificacion_usuario_sga)}>
                        <FaTrashAlt size={15} color="red" />
                      </button>
                      <input
                        type="checkbox"
                        className="h-[15px] w-[15px]"
                        checked={checked}
                        onChange={(e) => onToggleSelect(row, e.target.checked)}
                        // disabled={isWasSettled(row.ya_liquidada_para_usuario)}
                      />
                    </div>
                  );
                }}
                style={{ textAlign: "center", width: 120 }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }
          if (col.field === "fecha_pago") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const fechaPago = row[col.field] || "N/A";
                  return <span>{fechaPago}</span>;
                }}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }
          if (col.field === "pct_comision") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const porcentajeComision = row[col.field] + " %" || "N/A";
                  return <span>{porcentajeComision}</span>;
                }}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }
          if (col.field === "valor_total_liquidacion") {
            // que el valor vuelva con formato de moneda
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const valorTotal = formatCurrency(row[col.field]) || "N/A";
                  return <span>{valorTotal}</span>;
                }}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }

          // Columna de tipo (resalta Cancelación)
          //   if (col.field === "tipo_expedicion") {
          //     return (
          //       <Column
          //         key={col.field}
          //         field={col.field}
          //         header={col.header}
          //         body={(row) => {
          //           const tipoExpedicion = row[col.field] || "N/A";
          //           const isCancel = String(tipoExpedicion).toLowerCase() === "cancelación";
          //           return (
          //             <span style={isCancel ? { color: "red", fontWeight: "bold" } : {}}>
          //               {tipoExpedicion}
          //             </span>
          //           );
          //         }}
          //         style={{ textAlign: "center" }}
          //         headerStyle={{ textAlign: "center" }}
          //       />
          //     );
          //   }

          // Columna valor_a_reversar (si tiene valor, rojo)
          //   if (col.field === "valor_a_reversar") {
          //     return (
          //       <Column
          //         key={col.field}
          //         field={col.field}
          //         header={col.header}
          //         body={(row) => {
          //           const valor = row[col.field] ?? "N/A";
          //           const showRed = valor !== "N/A" && valor !== null && valor !== "";
          //           return <span style={showRed ? { color: "red" } : {}}>{valor}</span>;
          //         }}
          //         style={{ textAlign: "center", width: 120 }}
          //         headerStyle={{ textAlign: "center" }}
          //       />
          //     );
          //   }

          // Resto de columnas
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
