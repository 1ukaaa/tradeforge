// frontend/src/utils/journalUtils.js

/**
 * Vérifie si une date est valide.
 * @param {Date} value - L'objet Date.
 * @returns {boolean}
 */
export const isValidDate = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime());

/**
 * Formate une date ISO en format court.
 * @param {string} iso - La chaîne ISO de la date.
 * @param {object} options - Options pour Intl.DateTimeFormat.
 * @returns {string} - La date formatée.
 */
export const formatDate = (iso, options = {}) => {
  const defaults = { day: "2-digit", month: "short", year: "numeric" };
  if (!iso) return "Date inconnue";
  try {
    const date = new Date(iso);
    if (!isValidDate(date)) return iso; // Retourne l'original si invalide
    return new Intl.DateTimeFormat("fr-FR", { ...defaults, ...options }).format(
      date
    );
  } catch {
    return iso;
  }
};

/**
 * Informations de style pour les types d'entrée.
 */
export const typeLabel = {
  trade: { chip: "Trade", color: "error" },
  analyse: { chip: "Analyse", color: "success" },
};

/**
 * Détermine la couleur de la puce (Chip) en fonction du résultat.
 * @param {string} result - Le texte du résultat (ex: "TP", "SL", "Break Even").
 * @returns {'success' | 'error' | 'info' | 'default'} - La couleur MUI.
 */
export const resultTone = (result) => {
  if (!result) return "default";
  const normalized = result.toLowerCase();
  if (/(gain|profit|gagné|positif|win|tp)/i.test(normalized)) return "success";
  if (/(perte|loss|négatif|raté|down|sl)/i.test(normalized)) return "error";
  if (/(be|break even)/i.test(normalized)) return "info";
  return "default";
};

/**
 * Récupère la source de la première image d'une entrée.
 * @param {object} entry - L'objet entrée du journal.
 * @returns {string | null} - La source (data URL) de l'image, ou null.
 */
export const getEntryImage = (entry) => {
  return entry?.metadata?.images?.[0]?.src || null;
};

/**
 * Récupère un titre valide pour l'entrée.
 * @param {object} entry - L'objet entrée du journal.
 * @returns {string} - Le titre ou un fallback.
 */
export const getEntryTitle = (entry) => {
  return entry?.metadata?.title || "Entrée sans titre";
};

/**
 * Tente de deviner la direction (Buy/Sell) d'un trade.
 * @param {object} entry - L'objet entrée.
 * @returns {'buy' | 'sell' | 'neutral'}
 */
export const getEntryDirection = (entry) => {
  if (entry.type !== 'trade') return 'neutral';
  
  const meta = entry.metadata || {};
  const content = entry.content || "";
  const title = meta.title || "";
  // On vérifie aussi dans les tags
  const tags = (meta.tags || []).join(' ').toLowerCase();

  // Mots-clés pour Achat/Long
  const buyTerms = ['long', 'buy', 'achat', 'bullish', 'hausse'];
  // Mots-clés pour Vente/Short
  const sellTerms = ['short', 'sell', 'vente', 'bearish', 'baisse'];

  const textToSearch = `${title.toLowerCase()} ${content.toLowerCase()} ${tags}`;

  // Si on trouve un terme "sell"
  if (sellTerms.some(term => textToSearch.includes(term))) {
    return 'sell';
  }
  // Si on trouve un terme "buy"
  if (buyTerms.some(term => textToSearch.includes(term))) {
    return 'buy';
  }
  
  return 'neutral'; // Par défaut (on affichera un 'buy' par exemple)
};