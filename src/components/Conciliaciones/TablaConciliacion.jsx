import { useMemo, useState } from "react";
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

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isMoneyValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  const text = String(value).trim();
  return text.startsWith("$") || /^-?\$?[\d.,]+$/.test(text);
};

const formatCell = (value) => {
  if (value === null || value === undefined || `${value}`.trim() === "") {
    return "N/A";
  }

  return value;
};

export const TablaConciliacion = ({
  data = [],
  headers = [],
  onRowAction = () => {},
}) => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [rows, setRows] = useState(6);
  const [first, setFirst] = useState(0);

  const searchFields = useMemo(
    () => headers.filter((header) => header.field !== "accion").map((header) => header.field),
    [headers],
  );

  const filteredData = useMemo(() => {
    const term = normalizeText(globalFilterValue);

    if (!term) {
      return data;
    }

    return data.filter((row) =>
      searchFields.some((field) => normalizeText(row?.[field]).includes(term)),
    );
  }, [data, globalFilterValue, searchFields]);

  const exportExcel = () => {
    const exportColumns = headers.filter((header) => header.field !== "accion");
    const exportData = filteredData.map((row) => {
      const orderedRow = {};
      exportColumns.forEach((column) => {
        orderedRow[column.header] = formatCell(row?.[column.field]);
      });
      return orderedRow;
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, `conciliacion_export_${Date.now()}.xlsx`);
  };

  const handleRowsChange = (value) => {
    setRows(value);
    setFirst(0);
  };

  const header = (
    <div className="flex flex-row items-center xl:justify-between md:justify-normal w-full gap-3">
      <div className="flex flex-row items-center gap-3">
        <Dropdown
          value={rows}
          options={[6, 10, 25, 50].map((value) => ({ label: `${value}`, value }))}
          onChange={(event) => handleRowsChange(event.value)}
          className="custom-dropdown-mini w-[60px] max-w-[60px]"
        />
        <Button
          type="button"
          icon="pi pi-file-excel"
          severity="success"
          onClick={exportExcel}
          rounded
          className="mr-3 text-[8px] h-[25px]"
          disabled={!filteredData.length}
        />
      </div>

      <IconField iconPosition="right">
        <InputIcon className="pi pi-search !p-1 !text-[11px]" />
        <InputText
          value={globalFilterValue}
          onChange={(event) => {
            setGlobalFilterValue(event.target.value);
            setFirst(0);
          }}
          placeholder="Buscar..."
          className="!text-[10px] w-[120px] md:w-[180px] lg:w-[220px] placeholder:pl-[5px] placeholder:text-[11px] !p-1"
        />
      </IconField>
    </div>
  );

  return (
    <>
      <style>{`
        .custom-dropdown-mini .p-dropdown-label { font-size: 10px !important; padding: 2px 6px !important; line-height: 1rem !important; }
        .custom-dropdown-mini.p-dropdown { padding: 0px 4px !important; min-height: 28px !important; height: 28px !important; }
        .custom-dropdown-mini .p-dropdown-items .p-dropdown-item { font-size: 10px !important; padding: 2px 6px !important; }
        .custom-dropdown-mini .p-dropdown-trigger { width: 18px !important; }
        .custom-dropdown-mini .p-dropdown-trigger-icon { font-size: 10px !important; }

        .tabla-conciliacion.p-datatable .p-datatable-thead > tr > th {
          padding: 4px 6px !important;
          font-size: 10px !important;
          font-weight: 700;
          white-space: nowrap;
          text-align: center;
          vertical-align: middle;
          z-index: 1 !important;
        }

        .tabla-conciliacion .p-paginator {
          padding: 4px 6px !important;
          font-size: 10px !important;
          min-height: 34px !important;
        }

        .tabla-conciliacion .p-paginator .p-paginator-current,
        .tabla-conciliacion .p-paginator .p-paginator-page,
        .tabla-conciliacion .p-paginator .p-paginator-first,
        .tabla-conciliacion .p-paginator .p-paginator-prev,
        .tabla-conciliacion .p-paginator .p-paginator-next,
        .tabla-conciliacion .p-paginator .p-paginator-last,
        .tabla-conciliacion .p-paginator .p-link,
        .tabla-conciliacion .p-paginator .p-dropdown,
        .tabla-conciliacion .p-paginator .p-dropdown-label,
        .tabla-conciliacion .p-paginator .p-dropdown-trigger,
        .tabla-conciliacion .p-paginator .p-dropdown-item {
          font-size: 10px !important;
        }

        .tabla-conciliacion .p-paginator .p-paginator-page,
        .tabla-conciliacion .p-paginator .p-paginator-first,
        .tabla-conciliacion .p-paginator .p-paginator-prev,
        .tabla-conciliacion .p-paginator .p-paginator-next,
        .tabla-conciliacion .p-paginator .p-paginator-last {
          min-width: 1.5rem !important;
          height: 1.5rem !important;
        }

        .tabla-conciliacion .p-paginator .p-paginator-current {
          margin: 0 4px !important;
        }

        .tabla-conciliacion.p-datatable .p-datatable-thead > tr > th .p-column-header-content {
          justify-content: center;
          padding: 8px !important;
        }
        .tabla-conciliacion.p-datatable .p-datatable-tbody > tr > td {
          padding: 3px 6px !important;
          font-size: 10px !important;
          text-align: center;
          vertical-align: middle;
        }
        .tabla-conciliacion.p-datatable .p-datatable-tfoot > tr > td {
          padding: 4px 6px !important;
          font-size: 10px !important;
        }
      `}</style>

      <DataTable
        value={filteredData}
        dataKey="id"
        paginator
        rows={rows}
        first={first}
        onPage={(event) => {
          setFirst(event.first);
          if (event.rows && event.rows !== rows) {
            setRows(event.rows);
          }
        }}
        className="tabla-conciliacion text-xs"
        style={{ textAlign: "center", verticalAlign: "middle", padding: 0 }}
        stripedRows
        showGridlines
        scrollable
        scrollHeight="560px"
        header={header}
        emptyMessage="No se encontró ningún registro"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      >
        {headers.map((headerItem) => {
          if (headerItem.field === "accion") {
            return (
              <Column
                key={headerItem.field}
                field={headerItem.field}
                header={headerItem.header}
                frozen
                alignFrozen="right"
                body={(rowData) => (
                  <BtnGeneral
                    id={`btnConciliar-${rowData.id_anexo_poliza}`}
                    className="rounded-md bg-lime-9000 px-3 py-2 text-xs font-semibold text-white transition duration-300 ease-in-out hover:bg-lime-600"
                    funct={() => onRowAction(rowData)}
                  >
                    <span>Conciliar</span>
                  </BtnGeneral>
                )}
                style={{ minWidth: "7rem", textAlign: "center" }}
                headerStyle={{ textAlign: "center", padding: "4px 6px" }}
              />
            );
          }

          return (
            <Column
              key={headerItem.field}
              field={headerItem.field}
              header={headerItem.header}
              body={(rowData) => formatCell(rowData?.[headerItem.field])}
              style={{
                minWidth: isMoneyValue(filteredData[0]?.[headerItem.field]) ? "7rem" : "5.5rem",
                textAlign: "center",
              }}
              headerStyle={{ textAlign: "center", padding: "4px 6px" }}
            />
          );
        })}
      </DataTable>
    </>
  );
};