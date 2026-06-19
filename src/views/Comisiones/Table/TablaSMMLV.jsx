import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { CreateOutlined } from "@mui/icons-material";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";

const statusOptions = [
  { value: "1", label: "Activo" },
  { value: "0", label: "No activo" },
];

const formatCurrency = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "$ 0";

  return `$ ${Number(digits).toLocaleString("es-CO")}`;
};

const formatDate = (value) => {
  if (!value) return "";
  const rawValue = String(value);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) return rawValue;
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    const [year, month, day] = rawValue.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return rawValue;

  const day = `${parsed.getDate()}`.padStart(2, "0");
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStatusLabel = (value) =>
  statusOptions.find((option) => String(option.value) === String(value))?.label ||
  value ||
  "";

const getYearLabel = (years = [], value) =>
  years.find((option) => String(option.value) === String(value))?.label ||
  value ||
  "";

export const TablaSMMLV = ({ data, years, handleEdit, numRow = 6 }) => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(null);
  const [filteredData, setFilteredData] = useState(data);
  const [rows, setRows] = useState(numRow);
  const dt = useRef(null);

  useEffect(() => {
    setFilters({
      global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    });
  }, []);

  useEffect(() => {
    if (!globalFilterValue) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      const searchableValues = [
        getYearLabel(years, item.anio_smmlv),
        item.fch_ini_vig,
        item.fch_fin_vig,
        item.valor_smmlv,
        getStatusLabel(item.estado),
        item.fecha_creacion,
        item.usuario_creador,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(globalFilterValue.toLowerCase()),
      );
    });

    setFilteredData(filtered);
  }, [data, globalFilterValue, years]);

  const onGlobalFilterChange = (event) => {
    const value = event.target.value;
    setGlobalFilterValue(value);
    setFilters({
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  const saveAsExcelFile = (buffer, fileName) => {
    const excelType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const excelExtension = ".xlsx";
    const fileData = new Blob([buffer], { type: excelType });

    saveAs(
      fileData,
      `${fileName}_export_${new Date().getTime()}${excelExtension}`,
    );
  };

  const exportExcel = () => {
    const exportData = filteredData.map((row) => ({
      ano: getYearLabel(years, row.anio_smmlv),
      vigencia_desde: formatDate(row.fch_ini_vig),
      vigencia_hasta: formatDate(row.fch_fin_vig),
      valor: formatCurrency(row.valor_smmlv),
      estado: getStatusLabel(row.estado),
      fecha_creacion: formatDate(row.fecha_creacion),
      usuario_creador: row.usuario_creador || "",
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAsExcelFile(excelBuffer, "smmlv");
  };

  const header = (
    <div className="flex flex-row items-center xl:justify-between md:justify-normal border-0">
      <div className="flex flex-row items-center gap-2">
        <Dropdown
          value={rows}
          options={[6, 10, 25, 50].map((value) => ({
            label: `${value}`,
            value,
          }))}
          onChange={(event) => setRows(event.value)}
          className="p-mr-2 w-auto max-w-[70px] text-xs"
          pt={{
            root: { style: { fontSize: "12px" } },
            item: { style: { fontSize: "12px", padding: "4px 8px" } },
            input: { style: { fontSize: "12px", padding: "4px 6px" } },
          }}
        />
        <Button
          type="button"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={exportExcel}
          data-pr-tooltip="XLS"
          style={{ width: 28, height: 28, fontSize: "11px" }}
        />
      </div>
      <IconField iconPosition="right">
        <InputIcon className="pi pi-search" style={{ fontSize: "12px" }} />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar..."
          style={{ fontSize: "12px", height: "30px", maxWidth: "180px" }}
        />
      </IconField>
    </div>
  );

  return (
    <DataTable
      ref={dt}
      value={filteredData}
      style={{
        textAlign: "center",
        verticalAlign: "middle",
        fontSize: "12px",
      }}
      paginator
      rows={rows}
      stripedRows
      showGridlines
      header={header}
      emptyMessage="No se encontró ningún registro"
      filters={filters}
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      globalFilterFields={[
        "anio_smmlv",
        "fch_ini_vig",
        "fch_fin_vig",
        "valor_smmlv",
        "estado",
        "fecha_creacion",
        "usuario_creador",
      ]}
      paginatorClassName="text-xs [&_.p-paginator-current]:text-xs [&_.p-paginator-pages_.p-paginator-page]:text-xs [&_.p-paginator-pages_.p-paginator-page]:min-w-[24px] [&_.p-paginator-pages_.p-paginator-page]:h-[24px]"
    >
      <Column
        header="Año"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => getYearLabel(years, rowData.anio_smmlv)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Vigencia desde"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => formatDate(rowData.vig_desde)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Vigencia hasta"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => formatDate(rowData.vig_hasta)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Valor"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => formatCurrency(rowData.valor_smmlv)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Estado"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => getStatusLabel(rowData.estado)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Fecha creación"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => formatDate(rowData.fecha_creacion)}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Usuario creador"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => rowData.usuario_creador || ""}
        style={{ textAlign: "center" }}
      />
      <Column
        header="Acción"
        headerStyle={{ textAlign: "center", fontSize: "12px" }}
        pt={{ headerContent: { style: { justifyContent: "center" } } }}
        body={(rowData) => (
          <Button
            icon={<CreateOutlined />}
            onClick={() => handleEdit(rowData)}
            style={{
              textAlign: "center",
              backgroundColor: "#88d600",
              border: "0px",
            }}
          />
        )}
        style={{ textAlign: "center" }}
      />
    </DataTable>
  );
};
