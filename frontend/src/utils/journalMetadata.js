const sanitizeLine = (line = "") =>
  line
    .replace(/\*\*/g, "")
    .replace(/^[\s•*_-]*\d+\.\s*/, "")
    .replace(/^[\s•*_-]+/, "")
    .trim();

const cleanText = (text = "") =>
  text
    .split(/\r?\n/)
    .map((line) => sanitizeLine(line))
    .filter(Boolean)
    .join(" ")
    .trim();

const parseSections = (text = "") => {
  const result = {};
  let currentSection = null;
  text.split(/\r?\n/).forEach((line) => {
    const headerMatch = line.match(/^\s*(\d+)\.\s*(.*)$/);
    if (headerMatch) {
      currentSection = headerMatch[1];
      result[currentSection] = headerMatch[2]?.trim() || "";
      return;
    }
    if (!currentSection) return;
    const trimmed = line.trim();
    if (!trimmed) return;
    result[currentSection] = [result[currentSection], trimmed].filter(Boolean).join(" ").trim();
  });
  return result;
};

const RESERVED_SYMBOLS = new Set(["TYPE", "ANALYSE", "TRADE", "PLAN", "OBJECTIFS", "SCENARIOS", "RISQUES"]);

const guessSymbol = (text = "") => {
  if (!text) return "";
  const slashMatches = text.match(/\b[A-Z]{2,6}\/[A-Z]{2,6}\b/g);
  if (slashMatches?.length) {
    return slashMatches[0];
  }
  const candidates = (text.match(/\b[A-Z]{3,6}[0-9]{0,4}\b/g) || []).filter(
    (token) => !RESERVED_SYMBOLS.has(token)
  );
  if (!candidates.length) {
    return "";
  }
  const withDigits = candidates.find((token) => /\d/.test(token));
  return withDigits || candidates[0];
};

const firstSentence = (text = "") => {
  const match = text.match(/([^.!?]+[.!?])\s*/);
  if (match) return match[1].trim();
  return text.split(/\n/)[0]?.trim() || "";
};

const summarizeShort = (text = "", limit = 120) => {
  const normalized = cleanText(text);
  if (!normalized) return "";
  const sentence = firstSentence(normalized);
  const candidate = sentence || normalized;
  if (candidate.length <= limit) return candidate;
  return `${candidate.slice(0, limit - 1).trim()}…`;
};

export const buildJournalMetadata = (content, plan, entryType) => {
  const trimmedContent = content.trim();
  const firstLine = trimmedContent.split("\n").find((line) => line.trim());
  const snippet = trimmedContent.replace(/\n+/g, " ").slice(0, 220);
  const tags = [entryType === "trade" ? "Trade" : "Analyse", "IA"];
  return {
    title: firstLine || `${entryType === "trade" ? "Trade" : "Analyse"} généré`,
    planSummary: plan?.split("\n")[0]?.trim() || "Plan non renseigné.",
    result: entryType === "trade" ? "Trade validé" : "Analyse IA",
    grade: entryType === "trade" ? "À valider" : "Scénarios croisés",
    planAdherence: entryType === "trade" ? 85 : 40,
    tags,
    outcome: snippet || "Synthèse à compléter.",
    timeframe: entryType === "trade" ? "H1 / H4" : "Daily / H4",
    symbol: "Actif non défini",
    nextSteps:
      entryType === "trade"
        ? "Vérifier la gestion du stop et préparer la revue journalière."
        : "Suivre les niveaux mentionnés et actualiser les signaux.",
    risk:
      entryType === "trade"
        ? "Stop / gestion du risque à surveiller."
        : "Risques macro / invalidation par événements majeurs.",
  };
};

export const structureGeminiResult = (resultText = "", entryType = "analyse", plan = "") => {
  const sections = parseSections(resultText);
  const normalizedSections = Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, cleanText(value)])
  );
  const planSummaryFallback = cleanText(plan?.split(/\r?\n/)[0] ?? "");
  const nextStepsKey = entryType === "trade" ? "8" : "6";
  const summaryKeys = entryType === "trade" ? ["4", "6", nextStepsKey] : ["4", nextStepsKey];
  const summaryPieces = summaryKeys
    .map((key) => summarizeShort(normalizedSections[key] || ""))
    .filter(Boolean);
  const summary = summaryPieces.join(" · ") || summarizeShort(resultText);
  const metadata = {
    title:
      `${entryType === "trade" ? "Trade" : "Analyse"} Gemini · ${summarizeShort(
        normalizedSections["1"] || normalizedSections["2"] || planSummaryFallback
      ) || "Synthèse IA"}`,
    result:
      summarizeShort(normalizedSections[entryType === "trade" ? "5" : "4"] || "") ||
      (entryType === "trade" ? "Trade validé" : "Analyse IA"),
    grade:
      summarizeShort(normalizedSections["6"] || "") ||
      (entryType === "trade" ? "Relecture du trade" : "Scénarios croisés"),
    timeframe: summarizeShort(normalizedSections["3"] || normalizedSections["1"] || ""),
    symbol: guessSymbol(resultText) || guessSymbol(plan) || "EURUSD",
    nextSteps: summarizeShort(normalizedSections[nextStepsKey] || ""),
    risk: summarizeShort(normalizedSections[entryType === "trade" ? "7" : "5"] || ""),
    tags: ["Gemini", entryType === "trade" ? "Trade" : "Analyse"],
    planSummary: summarizeShort(normalizedSections["2"] || planSummaryFallback),
    outcome: summary,
  };

  return { metadata, summary };
};
