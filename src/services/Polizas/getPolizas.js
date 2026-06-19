import axios from "axios";

const nfCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const formatCOP = (n) => nfCOP.format(Number(n || 0));

export const getPolizas = async (dataFilters) => {
  const tipos_certificado = {
    1: "Nueva",
    2: "Renovación",
    3: "Modificación",
    4: "Cancelación",
  };

  const estados_por_liquidar = {
    0: "Por liquidar",
    1: "Liquidada",
    2: "Cancelada",
    4: "Borrador"
  };

  const ALLOW_RAMOS_PLACA = [1, 7, 8, 11, 14, 15, 22, 24, 25, 26, 27, 30, 31];

  // Sólo para visualización
  const ramos = {
    2: "Hogar",
    4: "Salud",
    5: "Vida",
    6: "Asistencia E/V",
    7: "Motos",
    8: "Pesados",
    9: "Vida deudor",
    10: "Arrendamiento",
    12: "AP Estudiantil",
    13: "AP",
    1: "Autos Livianos",
    14: "Autos Pasajeros",
    15: "Autos Colectivo",
    16: "Bicicleta",
    17: "Credito",
    18: "Cumplimiento",
    19: "Equipo Maquinaria",
    20: "Exequias",
    21: "Hogar Deudor",
    22: "Manejo",
    23: "PYME",
    24: "RCE Autos Livianos",
    25: "RCE Motos",
    26: "RCE Pesados",
    27: "RCE Pasajeros",
    28: "RCC Colectivos",
    29: "RCE Colectivos",
    30: "RC Cumplimiento",
    31: "RC Hidrocarburos",
    32: "RC Medica Profesional",
    33: "",
  };

  const formas_pago = {
    2: "Contado",
    1: "Financiada",
  };

  const aseguradoras = {
    1: "Allianz",
    2: "AXA Colpatria",
    3: "Bolivar",
    4: "Equidad",
    5: "Estado",
    6: "HDI Seguros",
    7: "Mapfre",
    8: "Mundial",
    9: "Previsora",
    10: "Qualitas",
    11: "SBS Seguros",
    12: "Solidaria",
    13: "Zurich",
    14: "Assist Card",
    15: "Universal",
    16: "Assist 1",
    17: "Los Olivos",
    18: "Sura",
    19: "Cesce",
    20: "Colmena",
    21: "Coomeva",
    22: "Palig",
  };

  // --------- Normalizadores / parsers ---------
  const norm = (s) =>
    String(s ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const parseListFromJsonish = (raw) => {
    if (Array.isArray(raw)) return raw;
    let text = String(raw ?? "").trim();
    if (!text) return [];
    try {
      const p = JSON.parse(text);
      if (Array.isArray(p)) return p;
    } catch (_) {}
    try {
      const unescaped = text.replace(/\\"/g, '"');
      const p2 = JSON.parse(unescaped);
      if (Array.isArray(p2)) return p2;
    } catch (_) {}
    return text
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((x) => x.replace(/['"]/g, "").trim())
      .filter(Boolean);
  };

  // Sinónimos de ramos -> clave canónica
  const RAMO_CANON = {
    autos: [
      "autos",
      "autos livianos",
      "auto",
      "automoviles",
      "automóviles",
      "vehiculos",
      "vehículos",
      "carros",
      "livianos",
      "particulares",
    ],
    pesados: [
      "pesados",
      "camiones",
      "tractocamion",
      "tractomula",
      "flota pesada",
      "carga",
    ],
    motos: ["moto", "motocicletas", "moto"],
    hogar: ["hogar", "vivienda", "casa"],
    vida: ["vida"],
    salud: ["salud"],
    "asistencia en viajes": ["asistencia en viajes", "viajes", "viaje"],
  };
  const aliasToCanon = new Map();
  Object.entries(RAMO_CANON).forEach(([canon, aliases]) => {
    aliases.forEach((a) => aliasToCanon.set(norm(a), canon));
  });
  const canonizeRamo = (txt) => aliasToCanon.get(norm(txt)) || norm(txt);

  // Conserva ceros a la derecha si vienen en el string ("0.070")
  const keepDecimalsStr = (v) => {
    if (v === null || v === undefined) return "0";
    const raw = String(v).trim().replace(",", ".");
    if (!raw) return "0";
    const n = Number(raw);
    if (!isFinite(n)) return "0";
    const decs = raw.includes(".") ? raw.split(".")[1].length : 0;
    return n.toFixed(decs);
  };

  // --------- Matching de comisión ---------
  // Devuelve:
  //   pctStr: string tal cual (p.ej. "0.070") que representa 0.07%
  //   pctNum: número en unidades de % (0.07 significa 0.07%)
  //   pctFrac: fracción para multiplicar la base (0.07% = 0.0007)
  //
  // Prioridad:
  //   1. Comisión con ramo "Todos" (aplica a cualquier ramo) que coincida en tipo_expedicion y unidad_negocio
  //   2. Comisión con ramo específico que coincida en tipo_expedicion y unidad_negocio
  //   3. Igual sin filtro de unidad_negocio (fallback si no hay unidad)
  const selectComision = (
    comisiones = [],
    ramoPolizaNombre,
    tipoCertificadoNombre,
    unidadNegocioNombre = null   // ej. "Directo", "Asesor 10", "Asesor Ganador", "Freelance"
  ) => {
    const tipoPoliza = norm(tipoCertificadoNombre); // ej. "nueva"
    const ramoPolizaCanon = canonizeRamo(ramoPolizaNombre); // ej. "pesados"

    // Mapeo de nombres internos -> posibles nombres en las comisiones
    const unidadNegocioAliases = {
      "directo":        ["negocio directo", "directo"],
      "freelance":      ["freelance", "asesor freelance"],
      "asesor 10":      ["asesor 10"],
      "asesor ganador": ["asesor ganador"],
    };
    const unidadNorm = unidadNegocioNombre ? norm(unidadNegocioNombre) : null;
    const unidadAliases = unidadNorm
      ? (unidadNegocioAliases[unidadNorm] ?? [unidadNorm])
      : null;

    const tipoOk = (c) => {
      const tiposC = parseListFromJsonish(c?.tipo_expedicion).map(norm);
      return tiposC.length > 0
        ? tiposC.includes(tipoPoliza)
        : norm(c?.tipo_expedicion) === tipoPoliza;
    };

    const unidadOk = (c) => {
      if (!unidadAliases) return true; // sin filtro de unidad
      const unidadesC = parseListFromJsonish(c?.unidad_negocio).map(norm);
      if (unidadesC.length === 0) return true; // comisión sin restricción de unidad
      return unidadesC.some((u) => unidadAliases.includes(u));
    };

    const esTodos = (c) => {
      const ramsC = parseListFromJsonish(c?.ramo).map(norm);
      return ramsC.some((r) => r === "todos");
    };

    const esRamoEspecifico = (c) => {
      const ramsC = parseListFromJsonish(c?.ramo).map((x) => canonizeRamo(x));
      return ramsC.length > 0 && ramsC.some((canon) => canon === ramoPolizaCanon);
    };

    const lista = comisiones || [];

    // 1. "Todos" + tipo_expedicion coincide + unidad_negocio coincide
    let match = lista.find((c) => tipoOk(c) && unidadOk(c) && esTodos(c));

    // 2. Ramo específico + tipo_expedicion coincide + unidad_negocio coincide
    if (!match) {
      match = lista.find((c) => tipoOk(c) && unidadOk(c) && esRamoEspecifico(c));
    }

    // 3. Fallback sin filtro de unidad: "Todos" + tipo_expedicion
    if (!match) {
      match = lista.find((c) => tipoOk(c) && esTodos(c));
    }

    // 4. Fallback sin filtro de unidad: ramo específico + tipo_expedicion
    if (!match) {
      match = lista.find((c) => tipoOk(c) && esRamoEspecifico(c));
    }

    if (!match) return { pctStr: "0", pctNum: 0, pctFrac: 0 };

    const pctStr = keepDecimalsStr(match.valor_comision); // "0.070"
    const pctNum = Number(pctStr) || 0; // 0.07 (unidades de %)
    const pctFrac = pctNum / 100; // 0.0007 (fracción)
    return { pctStr, pctNum, pctFrac };
  };

  try {
    const { data } = await axios.post(
      "/Policy/retrievePolizas",
      { dataFilters },
      { headers: { "Content-Type": "application/json" } }
    );

    const lista = Array.isArray(data?.data) ? data.data : [];

    if (lista.length === 0) {
      return {
        codStatus: 404,
        message: "No se encontraron polizas",
        error: true,
        data: [],
      };
    }

    // ====== Mapa del anexo 0 (NUEVA) por póliza, con % realmente usado ======
    const basePorPoliza = new Map();
    for (const p of lista) {
      if (Number(p?.no_certificado) === 0) {
        const key = String(p?.id_poliza ?? "");
        if (!key) continue;

        const ramoNombre0 =
          ramos[Number(p.ramo_poliza)] !== undefined
            ? ramos[Number(p.ramo_poliza)]
            : String(p.ramo_poliza);

        // % que aplica a la “Nueva”
        const unidadNegocioNombre0 = {
          1: "Freelance",
          2: "Directo",
          3: "Asesor 10",
          4: "Asesor Ganador",
        }[Number(p.unidad_negocio_poliza)] || null;

        const { pctStr, pctNum, pctFrac } = selectComision(
          p.comisiones,
          ramoNombre0,
          "Nueva",
          unidadNegocioNombre0
        );

        const prima0 = Number(p?.prima_neta_poliza ?? 0);
        const base0 = prima0 + Number(p?.asistencias_otros_poliza ?? 0);
        const liquidada0 = Number(p?.liquidada ?? 0);
        const valorComision0 = base0 * pctFrac;

        // guardamos % y valor usados en el anexo 0
        basePorPoliza.set(key, {
          prima0,
          base0,
          liquidada0,
          pctStr0: pctStr,
          pctNum0: pctNum,
          pctFrac0: pctFrac,
          valorComision0,
          poliza0: p,
        });
      }
    }

    // ====== Filtro de la lista base que quieres mostrar ======
    // - NUEVAS: siempre
    // - MODIFICACIONES: sólo si cambia base vs anexo 0
    // - CANCELACIONES: siempre

    const listaTrabajo = lista.filter((p) => {
      const tipo = Number(p?.tipo_certificado);
      if (tipo === 1) return true; // Nueva
      if (tipo === 2) return true; // Renovación  ✅
      if (tipo === 4) return true; // Cancelación

      if (tipo === 3) {
        const key = String(p?.id_poliza ?? "");
        if (!key || !basePorPoliza.has(key)) return false;
        const { prima0, base0 } = basePorPoliza.get(key);
        const primaAct = Number(p?.prima_neta_poliza ?? 0);
        const baseAct = primaAct + Number(p?.asistencias_otros_poliza ?? 0);
        return primaAct !== prima0 || baseAct !== base0;
      }
      return false;
    });

    // ====== Mapeo final ======
    return listaTrabajo.map((poliza) => {
      const ramoNombre =
        ramos[Number(poliza.ramo_poliza)] !== undefined
          ? ramos[Number(poliza.ramo_poliza)]
          : String(poliza.ramo_poliza);

      const tipoCertNombre =
        tipos_certificado[Number(poliza.tipo_certificado)] || "Desconocido";

      const esMod = Number(poliza.tipo_certificado) === 3;
      const esCancel = Number(poliza.tipo_certificado) === 4;
      const esNueva = Number(poliza.tipo_certificado) === 1;

      const key = String(poliza?.id_poliza ?? "");

      // Unidad de negocio de esta póliza (para filtrar comisiones correctas)
      const unidadNegocioMap = {
        1: "Freelance",
        2: "Directo",
        3: "Asesor 10",
        4: "Asesor Ganador",
      };
      const unidadNegocioNombre =
        unidadNegocioMap[Number(poliza.unidad_negocio_poliza)] || null;

      // Base del renglón actual
      const primaNeta = Number(
        poliza.ramo_poliza != 6
          ? poliza.prima_neta_poliza ?? 0
          : poliza.ramo_poliza == 6
          ? poliza.valor_asistencia_aviajes ?? 0
          : poliza.prima_neta_poliza ?? 0
      );
      const asist = Number(poliza.asistencias_otros_poliza ?? 0);
      const base = primaNeta + asist;

      // === Porcentaje a usar ===
      // - Modificación y Cancelación deben usar el % de "Nueva"
      // - Para Cancelación, si existe el anexo 0, usamos exactamente el % del anexo 0 (lo realmente aplicado)
      let pctStr, pctNum, pctFrac;

      if (esCancel) {
        const baseInfo = basePorPoliza.get(key);
        if (baseInfo) {
          pctStr = baseInfo.pctStr0;
          pctNum = baseInfo.pctNum0;
          pctFrac = baseInfo.pctFrac0;
        } else {
          // Fallback: buscar comisión usando regla de "Nueva"
          const sel = selectComision(poliza.comisiones, ramoNombre, "Nueva", unidadNegocioNombre);
          pctStr = sel.pctStr;
          pctNum = sel.pctNum;
          pctFrac = sel.pctFrac;
        }
      } else {
        const tipoParaComision = esMod || esNueva ? "Nueva" : tipoCertNombre;
        const sel = selectComision(
          poliza.comisiones,
          ramoNombre,
          tipoParaComision,
          unidadNegocioNombre
        );
        pctStr = sel.pctStr;
        pctNum = sel.pctNum;
        pctFrac = sel.pctFrac;
      }

      // === Valores de comisión / reverso ===
      // - Nueva / Modificación: comisión = base * %
      // - Cancelación: comisión = $0; valor_a_reversar = -(base_cancelación * %_anexo0)
      let valorComisionCOP = base * pctFrac;
      let valorComisionStr = formatCOP(valorComisionCOP);

      let valorAReversarStr = "N/A";
      if (esCancel) {
        const montoReversarAbs = Math.abs(base) * pctFrac; // siempre positivo
        valorAReversarStr = formatCOP(-montoReversarAbs); // negativo
        valorComisionStr = formatCOP(0); // comisión en cancelación = 0
      }

      const nombreFreelance =
        poliza.usuario_freelance != null
          ? poliza.usuario_freelance.info_usuario.u_nombre +
            " " +
            poliza.usuario_freelance.info_usuario.u_apellido
          : "N/A";

      const unidadesNegocio = {
        1: "Freelance",
        2: "Directo",
        3: "Asesor 10",
        4: "Asesor Ganador",
      };

      const financieras = {
        0: "N/A",
        1: "Finesa",
        2: "CrediMapfre",
        3: "HDI - Financia Ya",
        4: "Bolivar",
        5: "Sura",
        6: "Allianz",
        7: "CrediSeguro",
        8: "Previcredito",
        9: "Estado",
      };

      return {
        id_poliza: poliza.id_poliza,
        id_anexo_poliza: poliza.id_anexo_poliza,
        id_remision: poliza.id_remision || "N/A",
        poliza: poliza.no_poliza,
        tipo_expedicion: tipoCertNombre,
        fecha_expedicion: poliza.fecha_exp_poliza,

        ramo: ramoNombre || "Desconocido",

        aseguradora:
          aseguradoras[Number(poliza.aseguradora_poliza)] || "Desconocido",
        asegurado: poliza.nombre_completo_asegurado,
        identificacion_asegurado: poliza.numero_documento_asegurado,
        
        // Datos del tomador
        nombre_tomador: poliza.nombre_completo_tomador || "N/A",
        documento_tomador: poliza.numero_documento_tomador || "N/A",
        
        placa: ALLOW_RAMOS_PLACA.includes(Number(poliza.ramo_poliza))
          ? poliza.placa_veh_poliza || "N/A"
          : "N/A",
        anexo: poliza.no_certificado,

        // Valores financieros separados
        asistencia: formatCOP(Number(poliza.asistencias_otros_poliza ?? 0)),
        prima_neta: formatCOP(Number(poliza.prima_neta_poliza ?? 0)),
        gastos_expedicion: formatCOP(Number(poliza.gastos_expedicion_poliza ?? 0)),
        iva: formatCOP(Number(poliza.iva_poliza ?? 0)),
        valor_total: formatCOP(Number(poliza.valor_total_poliza ?? 0)),
        
        // Vigencia
        fecha_inicio_vigencia: poliza.fecha_inicio_vig_poliza || "N/A",
        fecha_fin_vigencia: poliza.fecha_fin_vig_poliza || "N/A",

        usuario_sga:
          poliza.usuario_sga?.info_usuario?.u_nombre +
          " " +
          poliza.usuario_sga?.info_usuario?.u_apellido,
        usuario_sga_documento: poliza.usuario_sga?.info_usuario?.u_documento,

        forma_de_pago:
          formas_pago[Number(poliza.forma_pago_poliza)] || "Desconocido",
        
        // Unidad de negocio y financiación
        unidad_negocio: unidadesNegocio[Number(poliza.unidad_negocio_poliza)] || "N/A",
        financiera: financieras[Number(poliza.financiada_por)] || "N/A",
        cuotas: poliza.no_cuotas || "0",
        
        // Estado cartera (basado en liquidación)
        estado_cartera: Number(poliza.liquidada) === 1 ? "Pagada" : "Pendiente",
        
        // Observaciones
        observaciones: poliza.observaciones_gstn_comercial || "N/A",

        asesor_freelance: nombreFreelance,
        asesor_10: poliza.asesor_10 || "N/A",
        asesor_ganador: poliza.asesor_ganador || "N/A",

        prima_sin_iva_asistencia: formatCOP(base),

        valor_a_reversar: valorAReversarStr,
        valor_comision: valorComisionStr,

        estado_liquidacion:
          Number(poliza.ya_liquidada_para_usuario) !== 1
            ? "Por liquidar"
            : poliza.estado_liquidacion_real === "Borrador"
              ? "Borrador"
              : poliza.estado_liquidacion_real === "Por pagar"
                ? "Por pagar"
                : poliza.estado_liquidacion_real === "Pagada"
                  ? "Liquidada"
                  : poliza.estado_liquidacion_real === "Anulada"
                    ? "Por liquidar"
                    : estados_por_liquidar[Number(poliza.ya_liquidada_para_usuario)] ||
                      "Desconocido",
        seleccionado:
          poliza.estado_liquidacion_real === "Anulada"
            ? false
            : Number(poliza.seleccionada_poliza) === 1,
        ya_liquidada_para_usuario:
          poliza.estado_liquidacion_real === "Anulada"
            ? 0
            : Number(poliza.ya_liquidada_para_usuario) === 1,

        analista_comercial: poliza.analista_comercial || "N/A",
        id_liquidacion:
          Number(poliza.ya_liquidada_para_usuario) === 1 && poliza.id_liquidacion
            ? poliza.id_liquidacion
            : "N/A",
        fecha_generacion_liquidacion:
          poliza.estado_liquidacion_real === "Anulada"
            ? "-"
            : poliza.pal_fecha_usuario || "-",
        fecha_pago_liquidacion:
          poliza.estado_liquidacion_real === "Anulada"
            ? "-"
            : poliza.pal_fecha_pago_usuario || "-",

        // % que se usó para calcular
        porcentaje_comision_decimal: pctStr,
        porcentaje_comision_pct: pctNum,
        porcentaje_comision_fraccion: pctFrac,
      };
    });
  } catch (error) {
    return error;
  }
};
