// utils/textFormat.js

// Permitir letras (incluye acentos), espacios, apóstrofo y guion.
// Bloquea dígitos y otros símbolos.
const NON_LETTERS_RE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]/g;

export const sanitizeLetters = (input = "") =>
  String(input)
    .replace(NON_LETTERS_RE, "")   // quita todo lo que no sea letra/espacio/'/-
    .replace(/\s+/g, " ")          // colapsa espacios múltiples
    .trim();                       // recorta extremos

// Capitaliza cada palabra, respeta preposiciones comunes en minúscula (salvo si van primero)
// y también capitaliza correctamente partes separadas por guion (e.g. "pérez-gómez").
export const toTitleName = (input = "") => {
  const clean = sanitizeLetters(input);
  if (!clean) return "";

  const LOWER_WORDS = new Set([
    "de","del","la","las","los","y","da","das","do","dos","di","du","van","von","san","santa"
  ]);

  return clean
    .split(" ")
    .map((word, idx) => {
      const w = word.toLowerCase();
      if (idx > 0 && LOWER_WORDS.has(w)) return w; // mantiene preposiciones en minúscula

      // Manejo de compuestos con guion: "pérez-gómez" -> "Pérez-Gómez"
      return w
        .split("-")
        .map(part => part ? part[0].toUpperCase() + part.slice(1) : "")
        .join("-");
    })
    .join(" ");
};
