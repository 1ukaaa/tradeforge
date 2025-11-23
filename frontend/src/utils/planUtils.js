// --- CONSTANTES PARTAGÉES ---

export const TRADING_WINDOWS = ["Asie / Pacifique", "Europe", "US"];

export const TRADING_STYLES = [
  { value: "swing", label: "Swing trading" },
  { value: "intra", label: "Intraday" },
  { value: "scalp", label: "Scalping" },
];

// Le plan par défaut sert de fallback si rien n'est chargé
export const DEFAULT_PLAN = {
  windows: ["Europe", "US"],
  style: "swing",
  pairs: "EURUSD, NAS100, DAX",
  tradeDuringNews: false,
  entryStrategy:
    "Attendre un retracement M15 confirmé par un support Daily, puis valider sur impulsion H1 avant d'entrer.",
  risk: "1,5 % maximum par trade, stop sous le dernier swing et TP1 à +0,5 % / TP2 à +1,2 %.",
  management:
    "Sorties progressives : basculer en BE dès +0,2 %, verrouiller un tiers à TP1 et laisser le reste courir lorsque le momentum le permet.",
  notes: "Pas de trade pendant les annonces majeures, vérification des niveaux macro avant toute entrée.",
};

// --- FONCTIONS UTILITAIRES PARTAGÉES ---

/**
 * Construit la description textuelle complète du plan de trading.
 * @param {object} plan - L'objet plan de trading.
 * @returns {string} - La description formatée.
 */
export const buildPlanDescription = (plan) => {
  const safePlan = plan || DEFAULT_PLAN;
  const windowsArray = Array.isArray(safePlan.windows) ? safePlan.windows : [];
  const windows = windowsArray.length ? windowsArray.join(" / ") : "Horaires à définir";
  const styleLabel =
    TRADING_STYLES.find((option) => option.value === safePlan.style)?.label || safePlan.style || "Style non défini";
  const pairs = safePlan.pairs || "Paires non définies";
  const news = safePlan.tradeDuringNews ? "Oui (sur setups définis)" : "Non, on évite les annonces";

  return [
    `1. Horaires : ${windows}`,
    `2. Style : ${styleLabel}`,
    `3. Instruments : ${pairs}`,
    `4. Trading pendant annonces : ${news}`,
    `5. Entrées : ${safePlan.entryStrategy || "Non définie"}`,
    `6. Gestion du risque : ${safePlan.risk || "Non défini"}`,
    `7. Sorties : ${safePlan.management || "Non définie"}`,
    `8. Notes supplémentaires : ${safePlan.notes || "Aucune"}`,
  ].join("\n");
};

/**
 * Formate un timestamp ISO en date/heure lisible.
 * @param {string} timestamp - Le timestamp ISO.
 * @returns {string} - La date formatée.
 */
export const formatSavedAt = (timestamp) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(timestamp)
    );
  } catch {
    return timestamp || "";
  }
};
