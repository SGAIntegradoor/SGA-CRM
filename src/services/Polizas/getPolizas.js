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
  const selectComision = (
    comisiones = [],
    ramoPolizaNombre,
    tipoCertificadoNombre
  ) => {
    const tipoPoliza = norm(tipoCertificadoNombre); // ej. "nueva"
    // console.log(tipoPoliza)
    const ramoPolizaCanon = canonizeRamo(ramoPolizaNombre); // ej. "autos"
    // console.log(ramoPolizaCanon)

    const match = (comisiones || []).find((c) => {
      const tiposC = parseListFromJsonish(c?.tipo_expedicion).map(norm);
      const tipoOk =
        tiposC.length > 0
          ? tiposC.includes(tipoPoliza)
          : norm(c?.tipo_expedicion) === tipoPoliza;
      if (!tipoOk) return false;

      const ramsC = parseListFromJsonish(c?.ramo).map((x) => canonizeRamo(x));
      console.log(ramsC);

      if (ramsC.length === 0) return false;

      return ramsC.some((canon) => canon === ramoPolizaCanon);
    });

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
        const { pctStr, pctNum, pctFrac } = selectComision(
          p.comisiones,
          ramoNombre0,
          "Nueva"
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
      // - Modificación y Cancelación deben usar el % de “Nueva”
      // - Para Cancelación, si existe el anexo 0, usamos exactamente el % del anexo 0 (lo realmente aplicado)
      let pctStr, pctNum, pctFrac;

      if (esCancel) {
        const baseInfo = basePorPoliza.get(key);
        if (baseInfo) {
          pctStr = baseInfo.pctStr0;
          pctNum = baseInfo.pctNum0;
          pctFrac = baseInfo.pctFrac0;
        } else {
          // Fallback: buscar comisión usando regla de “Nueva”
          const sel = selectComision(poliza.comisiones, ramoNombre, "Nueva");
          pctStr = sel.pctStr;
          pctNum = sel.pctNum;
          pctFrac = sel.pctFrac;
        }
      } else {
        const tipoParaComision = esMod || esNueva ? "Nueva" : tipoCertNombre;
        const sel = selectComision(
          poliza.comisiones,
          ramoNombre,
          tipoParaComision
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
        placa: ALLOW_RAMOS_PLACA.includes(Number(poliza.ramo_poliza))
          ? poliza.placa_veh_poliza || "N/A"
          : "N/A",
        anexo: poliza.no_certificado,

        usuario_sga:
          poliza.usuario_sga?.info_usuario?.u_nombre +
          " " +
          poliza.usuario_sga?.info_usuario?.u_apellido,
        usuario_sga_documento: poliza.usuario_sga?.info_usuario?.u_documento,

        forma_de_pago:
          formas_pago[Number(poliza.forma_pago_poliza)] || "Desconocido",

        asesor_freelance: nombreFreelance,
        asesor_10: poliza.asesor_10 || "N/A",
        asesor_ganador: poliza.asesor_ganador || "N/A",

        prima_sin_iva_asistencia: formatCOP(base),

        valor_a_reversar: valorAReversarStr,
        valor_comision: valorComisionStr,

        estado_liquidacion:
          estados_por_liquidar[Number(poliza.ya_liquidada_para_usuario)] ||
          "Desconocido",
        seleccionado: Number(poliza.seleccionada_poliza) === 1,
        ya_liquidada_para_usuario:
          Number(poliza.ya_liquidada_para_usuario) === 1,

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
