import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Button } from "primereact/button";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import { Dropdown } from "primereact/dropdown";
import { CreateOutlined } from "@mui/icons-material/";
import { NavContext } from "../../../context/NavContext";

export const TablaConfigCom = ({
  data,
  headers,
  from,
  numRow = 6,
  handleEdit,
  tipoExpedicionOptions,
  aplicaSobreOptions,
  unidadesNegocio,
  ramos,
  aseguradoras,
}) => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(null);
  const [filteredData, setFilteredData] = useState(data);
  const [rows, setRows] = useState(numRow);
  const dt = useRef(null);

  const toArray = (rawValue) => {
    if (Array.isArray(rawValue)) return rawValue;
    if (rawValue === null || rawValue === undefined || rawValue === "") return [];
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return String(rawValue)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  };

  const findLabel = (options = [], value) => {
    const target = String(value);
    return options.find((opt) => String(opt.value) === target)?.label || value;
  };

  useEffect(() => {
    initFilters();
  }, []);

  const renderHeader = () => {
    return (
      <div className="flex flex-row items-center xl:justify-between md:justify-normal border-0">
        <div className="flex flex-row items-center gap-2">
          <Dropdown
            value={rows}
            options={[6, 10, 25, 50].map((val) => ({
              label: `${val}`,
              value: val,
            }))}
            onChange={(e) => setRows(e.value)}
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
  };

  useEffect(() => {
    filterData();
  }, [globalFilterValue, data, ramos, aseguradoras, tipoExpedicionOptions, unidadesNegocio, aplicaSobreOptions]);

  const enrichedData = useMemo(() => {
    return data.map((item) => {
      const ramoIds = toArray(item.ramo);
      const ramoLabels = ramoIds.map((id) => findLabel(ramos, id)).join(", ");
      const aseguradoraIds = toArray(item.aseguradora);
      const aseguradoraLabels = aseguradoraIds.map((id) => findLabel(aseguradoras, id)).join(", ");
      const tipoExpIds = toArray(item.tipo_expedicion);
      const tipoExpLabels = tipoExpIds.map((id) => findLabel(tipoExpedicionOptions, id)).join(", ");
      const unidadLabel = findLabel(unidadesNegocio, item.unidad_negocio);
      const aplicaSobreLabel = findLabel(aplicaSobreOptions, item.aplica_sobre);
      return {
        ...item,
        ramo_labels: ramoLabels,
        aseguradora_labels: aseguradoraLabels,
        tipo_expedicion_labels: tipoExpLabels,
        unidad_negocio_label: unidadLabel,
        aplica_sobre_label: aplicaSobreLabel,
      };
    });
  }, [data, ramos, aseguradoras, tipoExpedicionOptions, unidadesNegocio, aplicaSobreOptions]);

  const filterData = () => {
    if (!globalFilterValue) {
      setFilteredData(enrichedData);
      return;
    }

    const filtered = enrichedData.filter((item) => {
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(globalFilterValue.toLowerCase()),
      );
    });

    setFilteredData(filtered);
  };

  const exportExcel = () => {
    const exportData = filteredData.map(({ ramo_labels, aseguradora_labels, tipo_expedicion_labels, unidad_negocio_label, aplica_sobre_label, ...rest }) => rest);
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAsExcelFile(excelBuffer, "parametros_comisiones");
  };

  const saveAsExcelFile = (buffer, fileName) => {
    let EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    let EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], {
      type: EXCEL_TYPE,
    });

    saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION,
    );
  };

  const initFilters = () => {
    setFilters({
      global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
      id_param: {
        operator: FilterOperator.AND,
        constraints: [
          { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
        ],
      },
      cli_nombre: {
        operator: FilterOperator.AND,
        constraints: [
          { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
        ],
      },
      cot_placa: {
        operator: FilterOperator.AND,
        constraints: [
          { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
        ],
      },
    });
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters({
      ...filters,
      global: { value: value, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  const header = renderHeader();

  const globalFilterSettings = [
    "id_param",
    "unidad_negocio",
    "unidad_negocio_label",
    "aseguradora",
    "ramo",
    "ramo_labels",
    "aseguradora_labels",
    "tipo_expedicion_labels",
    "aplica_sobre",
    "observaciones",
    "aplica_sobre_label",
  ];

  return (
    <>
      <DataTable
        ref={dt}
        value={enrichedData}
        style={{
          textAlign: "center",
          verticalAlign: "middle",
          fontSize: "12px",
        }}
        paginatorClassName="text-xs [&_.p-paginator-current]:text-xs [&_.p-paginator-pages_.p-paginator-page]:text-xs [&_.p-paginator-pages_.p-paginator-page]:min-w-[24px] [&_.p-paginator-pages_.p-paginator-page]:h-[24px]"
        paginator={from === "" ? true : false}
        rows={rows}
        stripedRows
        showGridlines
        globalFilterFields={globalFilterSettings}
        header={from === "" ? header : ""}
        emptyMessage="No se encontró ningún registro"
        filters={filters}
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
          if (col.field === "valor_comision") {
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) => `${rowData.valor_comision} %`}
              />
            );
          }

          if (col.field === "unidad_negocio") {
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) =>
                  findLabel(unidadesNegocio, rowData.unidad_negocio) || "No asignada"
                }
              />
            );
          }

          if (col.field === "tipo_expedicion") {
            // let tipoExpedicionMap = JSON.stringify(rowData);
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) => {
                  const tiposExp = toArray(rowData.tipo_expedicion);
                  const labels = tiposExp.map((tipo) =>
                    findLabel(tipoExpedicionOptions, tipo),
                  );
                  return labels.join(", ");
                }}
              />
            );
          }

          if (col.field === "ramo") {
            // let tipoExpedicionMap = JSON.stringify(rowData);
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) => {
                  const tiposExp = toArray(rowData.ramo);
                  const labels = tiposExp.map((tipo) => findLabel(ramos, tipo));
                  return labels.join(", ");
                }}
              />
            );
          }

          if (col.field === "aseguradora") {
            // let tipoExpedicionMap = JSON.stringify(rowData);
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) => {
                  const tiposAseg = toArray(rowData.aseguradora);
                  const labels = tiposAseg.map((tipo) =>
                    findLabel(aseguradoras, tipo),
                  );
                  return labels.join(", ");
                }}
              />
            );
          }

          if (col.field === "aplica_sobre") {
            // let tipoExpedicionMap = JSON.stringify(rowData);
            return (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
                headerStyle={{ textAlign: "center", fontSize: "12px" }}
                pt={{ headerContent: { style: { justifyContent: "center" } } }}
                header={col.header}
                // sortable
                body={(rowData) => {
                  return (
                    findLabel(aplicaSobreOptions, rowData.aplica_sobre) ||
                    "No asignada"
                  );
                }}
              />
            );
          }

          return (
            <Column
              key={`${col.field}-${Math.random()}`}
              field={col.field}
              style={{
                fontSize: "12px",
                textAlign: "center",
                verticalAlign: "middle",
              }}
              headerStyle={{ textAlign: "center", fontSize: "12px" }}
              pt={{ headerContent: { style: { justifyContent: "center" } } }}
              header={col.header}
              // sortable
            />
          );
        })}

        <Column
          //key={`${col.field}-${Math.random()}`}
          header="Acción"
          headerStyle={{ textAlign: "center", fontSize: "12px" }}
          pt={{ headerContent: { style: { justifyContent: "center" } } }}
          body={(rowData) => (
            <Button
              icon={<CreateOutlined />}
              onClick={() => handleEdit(rowData["id_param_comision"] ?? rowData["id_param"])}
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
    </>
  );
};
