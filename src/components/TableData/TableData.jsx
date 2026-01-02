import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Button } from "primereact/button";
import { NavContext } from "../../context/NavContext";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import { Dropdown } from "primereact/dropdown";
import { CreateOutlined } from "@mui/icons-material/";

export const TableData = ({ data, headers, from, numRow = 6 }) => {
  const { moving, setSelectedClientId, selectedClientId, isNewClient, setNewClient } =
    useContext(NavContext);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(null);
  const [filteredData, setFilteredData] = useState(data);
  const [rows, setRows] = useState(numRow);
  const dt = useRef(null);

  const nav = useNavigate();

  useEffect(() => {
    initFilters();
  }, []);

  const didQuotate = (rowData) => {
    if (rowData.counter >= 1) {
      return <CheckCircleIcon style={{ color: "green" }} />;
    } else {
      return <CancelIcon style={{ color: "red" }} />;
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-row items-center xl:justify-between md:justify-normal border-0">
        <div className="flex flex-row items-center gap-3">
          <Dropdown
            value={rows}
            options={[6, 10, 25, 50].map((val) => ({
              label: `${val}`,
              value: val,
            }))}
            onChange={(e) => setRows(e.value)}
            className="p-mr-2 w-auto max-w-[80px]"
          />
          <Button
            type="button"
            icon="pi pi-file-excel"
            severity="success"
            rounded
            onClick={exportExcel}
            data-pr-tooltip="XLS"
            className="mr-11"
          />
        </div>
        <IconField iconPosition="right">
          <InputIcon className="pi pi-search xs:block xxs:hidden" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
            className="xxs:hidden xs:block xs:text-md xl:block lg:block md:block xs:w-auto xs:max-w-[110px] xxs:w-auto xxs:max-w-[90px] xl:w-auto xl:max-w-[200px]"
          />
        </IconField>
      </div>
    );
  };

  useEffect(() => {
    filterData();
  }, [globalFilterValue, data]);

  const filterData = () => {
    if (!globalFilterValue) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(globalFilterValue.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  const handlerNavigation = (rowData) => {
    if (rowData.id_cliente_crm) {
      setSelectedClientId(rowData.id_cliente_crm);
      setNewClient(false);
    } else {
      moving("Editar Cotizacion");
      nav("/editar-cotizacion?idCotizacion=" + rowData.id_cotizacion);
    }
  };

  const exportExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(filteredData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAsExcelFile(excelBuffer, "cotizaciones");
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
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
    );
  };

  const initFilters = () => {
    setFilters({
      global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
      id_cotizacion: {
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

  const columns = [
    { field: "aseguradora", header: "Aseguradora" },
    {
      field: "ofertas_cotizadas",
      header: "Cotizo ?",
      body: (rowData) =>
        rowData.ofertas_cotizadas >= 1 ? (
          <CheckCircleIcon style={{ color: "green" }} />
        ) : (
          <CancelIcon style={{ color: "red" }} />
        ),
    },
    { field: "ofertas_cotizadas", header: "Productos Cotizados" },
    {
      field: "mensajes",
      header: "Mensajes",
      body: (rowData) => {
        return Array.isArray(rowData.mensajes)
          ? rowData.mensajes.find(
              (element, index) => element == "Cotizacion Exitosa"
            )
            ? "Cotización Exitosa"
            : rowData.mensajes[0][0].split(",")[0]
          : null;
      },
    },
  ];

  const header = renderHeader();

  const globalFilterSettings =
    from !== ""
      ? ["id_cotizacion", "cli_nombre_completo", "cot_placa"]
      : ["id_cliente_crm", "cli_nombre_completo_crm", "cli_num_documento_crm"];

  return (
    <>
      <DataTable
        ref={dt}
        value={data}
        style={{ textAlign: "center", verticalAlign: "middle", fontSize: "12px" }}
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
        {from !== ""
          ? columns.map((col) => (
              <Column
                //key={`${col.field}-${Math.random()}`}
                field={col.field}
                header={col.header}
                body={col.body}
                sortable 
              />
            ))
          : headers.map((col) => (
              <Column
                key={`${col.field}-${Math.random()}`}
                field={col.field}
                style={{fontSize: "12px"}}
                header={col.header}
                sortable 
              />
            ))}
        {from === "" ? (
          <Column
            //key={`${col.field}-${Math.random()}`}
            header="Acciones"
            body={(rowData) => (
              <Button
                icon={<CreateOutlined />}
                onClick={() => handlerNavigation(rowData)}
                style={{
                  textAlign: "center",
                  backgroundColor: "#88d600",
                  border: "0px",
                }}
              />
            )}
            style={{ textAlign: "center" }}
          />
        ) : null}
      </DataTable>
    </>
  );
};
