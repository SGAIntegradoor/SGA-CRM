import React, { useState, useMemo, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputIcon } from "primereact/inputicon";
import { IconField } from "primereact/iconfield";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import * as xlsx from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

/**
 * TableComisiones
 *
 * Props:
 *  - data: array de pólizas (cada item debe tener id_anexo_poliza y seleccionado)
 *  - headers: columnas
 *  - from: string para condicionar paginación
 *  - onToggleSelect(row, checked): callback para selección individual (debe manejar backend y actualizar 'data' en el padre)
 *  - setIsLoading(boolean): función para manejar loader del padre
 *  - loading: boolean opcional del padre
 */
export const TableComisiones = ({
  data = [],
  headers = [],
  from = "",
  onToggleSelect = () => {},
  setIsLoading = () => {},
  loading,
}) => {
  const dt = useRef(null);

  // selectedMap: mapa id -> boolean para controlar selección local (optimistic)
  const [selectedMap, setSelectedMap] = useState(() => ({}));
  // selectedRows: lista de ids seleccionados (derivado de selectedMap)
  const [selectedRows, setSelectedRows] = useState([]);

  // rows por página y primer índice
  const [rows, setRows] = useState(6);
  const [first, setFirst] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  // Sync inicial: poblar selectedMap desde data cuando carga o cambia
  useEffect(() => {
    const map = {};
    (data || []).forEach((p) => {
      const id = p.id_anexo_poliza;
      if (id !== undefined) map[id] = p.seleccionado === true || p.seleccionado === 1 || p.seleccionado === "1";
    });
    setSelectedMap((prev) => ({ ...map, ...prev })); // priorizar prev (evita perder selecciones optimistas)
  }, [data]);

  // Mantener selectedRows como array de ids cada vez que selectedMap cambie
  useEffect(() => {
    const ids = Object.entries(selectedMap)
      .filter(([, val]) => val)
      .map(([k]) => parseInt(k, 10));
    setSelectedRows(ids);
  }, [selectedMap]);

  // Debug
  useEffect(() => {
    console.log("selectedRows:", selectedRows);
  }, [selectedRows]);

  // Campos a buscar (dinámicos desde headers)
  const searchFields = useMemo(() => headers.map((h) => h.field), [headers]);

  // filtered: data filtrada por globalFilterValue
  const filtered = useMemo(() => {
    const term = String(globalFilterValue ?? "").trim().toLowerCase();
    if (!term) return data;
    return data.filter((item) =>
      searchFields.some((f) =>
        String(item?.[f] ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, searchFields, globalFilterValue]);

  // Export visible to Excel
  const exportExcel = () => {
    const worksheet = xlsx.utils.json_to_sheet(filtered);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(blob, `polizas_export_${Date.now()}.xlsx`);
  };

  // helpers
  const isTruthy = (v) => v === true || v === 1 || v === "1" || v === "true" || v === "TRUE";
  const isChecked = (val) => isTruthy(val);
  const isWasSettled = (val) => isTruthy(val);

  // helper para obtener ids de la página actual (filtrada)
  const getPageIds = () => {
    const pageRows = filtered.slice(first, first + rows);
    return pageRows
      .filter((r) => !isWasSettled(r.ya_liquidada_para_usuario))
      .map((r) => r.id_anexo_poliza)
      .filter((id) => id !== undefined && id !== null);
  };

  // Petición batch al backend (ajusta URL según tu API)
  const selectPolizasBatch = async (ids = [], selected = true) => {
    // Endpoint de ejemplo: POST /api/comisiones/select-polizas
    const url = "/api/comisiones/select-polizas";
    const body = { ids, selected };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.message || `Error ${res.status}`;
      throw new Error(msg);
    }
    return json;
  };

  // SELECT PAGE (batch)
  const selectPageRows = async () => {
    const ids = getPageIds();
    if (!ids.length) {
      return;
    }

    // Optimistic update local
    const prevSelectedMap = { ...selectedMap };
    const newSelectedMap = { ...selectedMap };
    ids.forEach((id) => (newSelectedMap[id] = true));
    setSelectedMap(newSelectedMap);

    // show loader
    try {
      setIsLoading(true);
      // llamar batch
      // await selectPolizasBatch(ids, true);
      // si backend responde OK, dejamos optimistic state como está
      // (opcional: podrías refrescar data desde padre)
    } catch (err) {
      console.error("Error batch select:", err);
      // rollback
      setSelectedMap(prevSelectedMap);
      Swal.fire("Error", err.message || "No se pudo seleccionar las pólizas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // DESELECT PAGE (batch)
  const deselectPageRows = async () => {
    const ids = getPageIds();
    if (!ids.length) {
      return;
    }

    const prevSelectedMap = { ...selectedMap };
    const newSelectedMap = { ...selectedMap };
    ids.forEach((id) => (newSelectedMap[id] = false));
    setSelectedMap(newSelectedMap);

    try {
      setIsLoading(true);
      await selectPolizasBatch(ids, false);
    } catch (err) {
      console.error("Error batch deselect:", err);
      setSelectedMap(prevSelectedMap);
      Swal.fire("Error", err.message || "No se pudo deseleccionar las pólizas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de checkbox individual: mantiene comportamiento existente llamando al prop onToggleSelect
  // y además sincroniza selectedMap localmente para consistencia UI.
  const handleSingleToggle = async (row, checked) => {
    const id = row.id_anexo_poliza;
    // Optimistic local change
    setSelectedMap((prev) => ({ ...prev, [id]: checked }));

    try {
      // delegar la acción individual al padre (onToggleSelect debe manejar backend y actualizar data)
      const maybePromise = onToggleSelect(row, checked);
      // si devuelve promesa, esperamos su resolución para poder manejar fallos
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (err) {
      console.error("Error en selección individual:", err);
      // rollback
      setSelectedMap((prev) => ({ ...prev, [id]: !checked }));
      Swal.fire("Error", err.message || "No se pudo actualizar la selección", "error");
    }
  };

  // Cuando cambies el rows desde el dropdown, mover al primer índice
  const handleRowsChange = (value) => {
    setRows(value);
    setFirst(0);
  };

  // Header con botones (export, select page, deselect page, search)
  const header = (
    <div className="flex flex-row items-center text-[10px] xl:justify-between md:justify-normal border-0 w-full gap-3">
      <div className="flex flex-row items-center gap-3">
        <Dropdown
          value={rows}
          options={[6, 10, 25, 50].map((val) => ({ label: `${val}`, value: val }))}
          onChange={(e) => handleRowsChange(e.value)}
          className="custom-dropdown-mini w-[60px] max-w-[60px]"
        />
        <Button
          type="button"
          icon="pi pi-file-excel"
          severity="success"
          onClick={exportExcel}
          rounded
          className="mr-3 text-[8px] h-[25px]"
        />
      </div>

      <div className="flex flex-row items-center gap-3">
        <Button
          label="Seleccionar página"
          icon="pi pi-check-square"
          className="!text-[10px] h-[32px] bg-lime-9000 border-lime-9000 hover:border-lime-600 hover:bg-lime-600 ml-1 !p-2"
          onClick={selectPageRows}
        />
        <Button
          label="Deseleccionar página"
          icon="pi pi-times"
          className="!text-[10px] h-[32px] bg-lime-9000 border-lime-9000 hover:border-lime-600 hover:bg-lime-600 ml-1 !p-2"
          onClick={deselectPageRows}
        />
        <IconField iconPosition="right">
          <InputIcon className="pi pi-search xs:block xxs:hidden !p-1 !text-[11px]" />
          <InputText
            value={globalFilterValue}
            onChange={(e) => {
              setGlobalFilterValue(e.target.value);
              setFirst(0);
            }}
            placeholder="Buscar..."
            className="!text-[10px] xxs:hidden xs:block xs:text-md xl:block lg:block md:block xs:w-auto xs:max-w-[110px] xxs:w-auto xxs:max-w-[90px] xl:w-auto xl:max-w-[200px] placeholder:pl-[5px] placeholder:text-[11px] !p-1"
          />
        </IconField>
      </div>
    </div>
  );

  return (
    <>
      {/* Estilos locales para filas pagadas */}
      <style>{`
        .my-table .p-datatable-tbody > tr.row-paid {
          opacity: 0.55;
        }
        .my-table .p-datatable-tbody > tr.row-paid td {
          background-color: #f3f4f6 !important;
          color: #6b7280 !important;
        }
        .my-table .p-datatable-tbody > tr.row-paid a,
        .my-table .p-datatable-tbody > tr.row-paid button,
        .my-table .p-datatable-tbody > tr.row-paid input,
        .my-table .p-datatable-tbody > tr.row-paid .p-checkbox,
        .my-table .p-datatable-tbody > tr.row-paid .p-inputtext {
          pointer-events: none;
        }
        .my-table .p-datatable-tbody > tr.row-paid.p-row-odd td,
        .my-table .p-datatable-tbody > tr.row-paid.p-row-even td {
          background-image: none !important;
        }

        /* Estilos para dropdown compacto (si quieres, mueve a CSS global) */
        .custom-dropdown-mini .p-dropdown-label { font-size: 10px !important; padding: 2px 6px !important; line-height: 1rem !important; }
        .custom-dropdown-mini.p-dropdown { padding: 0px 4px !important; min-height: 28px !important; height: 28px !important; }
        .custom-dropdown-mini .p-dropdown-items .p-dropdown-item { font-size: 10px !important; padding: 2px 6px !important; }
        .custom-dropdown-mini .p-dropdown-trigger { width: 18px !important; }
        .custom-dropdown-mini .p-dropdown-trigger-icon { font-size: 10px !important; }
      `}</style>

      <DataTable
        ref={dt}
        value={filtered}
        dataKey="id_anexo_poliza"
        style={{ textAlign: "center", verticalAlign: "middle", padding: 0 }}
        paginator={from === ""}
        rows={rows}
        first={first}
        onPage={(e) => {
          setFirst(e.first);
          if (e.rows && e.rows !== rows) setRows(e.rows);
        }}
        className="my-table text-xs"
        stripedRows
        showGridlines
        header={from === "" ? header : undefined}
        emptyMessage="No se encontró ningún registro"
        currentPageReportTemplate={from === "" ? "Mostrando {first} a {last} de {totalRecords} registros" : ""}
        paginatorTemplate={from === "" ? "CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" : ""}
        rowClassName={(row) => {
          const selected = selectedMap[row.id_anexo_poliza] ?? isChecked(row.seleccionado);
          if (selected) return " bg-lime-50";
        }}
      >
        {headers.map((col) => {
          // Columna de selección (checkbox)
          if (col.field === "seleccionado") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const checked = selectedMap[row.id_anexo_poliza] ?? isChecked(row.seleccionado);
                  return (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleSingleToggle(row, e.target.checked)}
                      disabled={isWasSettled(row.ya_liquidada_para_usuario)}
                    />
                  );
                }}
                style={{ textAlign: "center", width: 120 }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }

          // Columna de tipo (resalta Cancelación)
          if (col.field === "tipo_expedicion") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const tipoExpedicion = row[col.field] || "N/A";
                  const isCancel = String(tipoExpedicion).toLowerCase() === "cancelación";
                  return (
                    <span style={isCancel ? { color: "red", fontWeight: "bold" } : {}}>
                      {tipoExpedicion}
                    </span>
                  );
                }}
                style={{ textAlign: "center" }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }

          // Columna valor_a_reversar (si tiene valor, rojo)
          if (col.field === "valor_a_reversar") {
            return (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={(row) => {
                  const valor = row[col.field] ?? "N/A";
                  const showRed = valor !== "N/A" && valor !== null && valor !== "";
                  return <span style={showRed ? { color: "red" } : {}}>{valor}</span>;
                }}
                style={{ textAlign: "center", width: 120 }}
                headerStyle={{ textAlign: "center" }}
              />
            );
          }

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
