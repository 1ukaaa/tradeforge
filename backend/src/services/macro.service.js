// backend/src/services/macro.service.js
// MacroLens — Service d'indicateurs macro US via FRED (Federal Reserve Bank of St. Louis)
// API gratuite, no rate limit agressif (500 req/jour par défaut avec clé)
// Sans clé : 120 req/min en accès anonyme (suffisant pour notre usage)

const axios = require('axios');
const db = require('../core/database');

// ─── Configuration ────────────────────────────────────────────────────────────

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = process.env.FRED_API_KEY || null; // Optionnel, marche sans mais limité
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6h (FRED met à jour une fois par release)
const OBSERVATIONS_LIMIT = 30; // ~30 mois = 2 ans et demi avec marge

// ─── Définition des indicateurs US macro pertinents ──────────────────────────
// Focus : Indices US (S&P500, Nasdaq, Dow), Matières Premières (pétrole), Métaux (or, argent)

const MACRO_INDICATORS = {
  // 🔴 INFLATION - Driver #1 des marchés
  CPI: {
    seriesId: 'CPIAUCSL',
    label: 'CPI (All Items)',
    shortLabel: 'CPI',
    category: 'inflation',
    unit: 'Index 1982-84=100',
    frequency: 'monthly',
    description: 'Consumer Price Index — Indice des prix à la consommation US (tous items)',
    importance: 'high',
    color: '#ef4444',
  },
  CORE_CPI: {
    seriesId: 'CPILFESL',
    label: 'Core CPI (ex. Food & Energy)',
    shortLabel: 'Core CPI',
    category: 'inflation',
    unit: 'Index 1982-84=100',
    frequency: 'monthly',
    description: 'CPI hors alimentation et énergie — indicateur privilégié de la Fed',
    importance: 'high',
    color: '#f97316',
  },
  PCE: {
    seriesId: 'PCEPI',
    label: 'PCE Price Index',
    shortLabel: 'PCE',
    category: 'inflation',
    unit: 'Index 2017=100',
    frequency: 'monthly',
    description: 'Personal Consumption Expenditures — Indicateur préféré de la Fed pour l\'inflation',
    importance: 'high',
    color: '#fb923c',
  },
  PPI: {
    seriesId: 'PPIACO',
    label: 'PPI (All Commodities)',
    shortLabel: 'PPI',
    category: 'inflation',
    unit: 'Index 1982=100',
    frequency: 'monthly',
    description: 'Producer Price Index — Inflation à la production, anticipe le CPI',
    importance: 'medium',
    color: '#fbbf24',
  },

  // 🟢 EMPLOI - Driver #2 (Dual mandate Fed)
  NFP: {
    seriesId: 'PAYEMS',
    label: 'Non-Farm Payrolls',
    shortLabel: 'NFP',
    category: 'employment',
    unit: 'Milliers de postes',
    frequency: 'monthly',
    description: 'Créations d\'emplois hors secteur agricole — l\'annonce la plus attendue du marché',
    importance: 'high',
    color: '#22c55e',
  },
  UNEMPLOYMENT: {
    seriesId: 'UNRATE',
    label: 'Unemployment Rate',
    shortLabel: 'Chômage',
    category: 'employment',
    unit: '%',
    frequency: 'monthly',
    description: 'Taux de chômage US — objectif 2e mandat de la Fed',
    importance: 'high',
    color: '#16a34a',
  },
  JOBLESS_CLAIMS: {
    seriesId: 'ICSA',
    label: 'Initial Jobless Claims',
    shortLabel: 'Jobless Claims',
    category: 'employment',
    unit: 'Personnes',
    frequency: 'weekly',
    description: 'Nouvelles demandes d\'allocations chômage — indicateur hebdomadaire du marché du travail',
    importance: 'medium',
    color: '#4ade80',
  },

  // 🔵 POLITIQUE MONÉTAIRE - Driver #3 (Fed = dieu des marchés)
  FED_RATE: {
    seriesId: 'FEDFUNDS',
    label: 'Federal Funds Rate',
    shortLabel: 'Fed Rate',
    category: 'monetary',
    unit: '%',
    frequency: 'monthly',
    description: 'Taux directeur de la Fed — LE taux qui influence tout le reste',
    importance: 'high',
    color: '#6366f1',
  },
  TREASURY_10Y: {
    seriesId: 'GS10',
    label: 'Treasury Yield 10Y',
    shortLabel: 'T-Note 10Y',
    category: 'monetary',
    unit: '%',
    frequency: 'monthly',
    description: 'Rendement du T-Bond 10 ans — baromètre mondial du risque et impact direct sur l\'or/USD',
    importance: 'high',
    color: '#8b5cf6',
  },
  DXY_PROXY: {
    seriesId: 'DTWEXBGS',
    label: 'USD Trade Weighted Index',
    shortLabel: 'USD Index',
    category: 'monetary',
    unit: 'Index',
    frequency: 'weekly',
    description: 'Indice USD pondéré — proxy du DXY, corrélation inverse avec or et matières premières',
    importance: 'high',
    color: '#a78bfa',
  },

  // 🟡 CROISSANCE - Contexte macro général
  GDP: {
    seriesId: 'GDP',
    label: 'GDP (Gross Domestic Product)',
    shortLabel: 'GDP',
    category: 'growth',
    unit: 'Milliards $',
    frequency: 'quarterly',
    description: 'PIB nominal US — tendance de croissance économique sur le long terme',
    importance: 'medium',
    color: '#eab308',
  },
  RETAIL_SALES: {
    seriesId: 'RSXFS',
    label: 'Retail Sales (ex. Food)',
    shortLabel: 'Retail Sales',
    category: 'growth',
    unit: 'Millions $',
    frequency: 'monthly',
    description: 'Ventes au détail hors alimentation — proxy de la consommation, driver des indices US',
    importance: 'medium',
    color: '#ca8a04',
  },
  ISM_MANUFACTURING: {
    seriesId: 'MANEMP',
    label: 'Manufacturing Employees',
    shortLabel: 'Manuf. Emploi',
    category: 'growth',
    unit: 'Milliers',
    frequency: 'monthly',
    description: 'Emplois dans le secteur manufacturier — proxy de l\'activité industrielle US',
    importance: 'low',
    color: '#a16207',
  },

  // 🟤 MATIÈRES PREMIÈRES & MÉTAUX (clés pour ton trading)
  OIL_WTI: {
    seriesId: 'DCOILWTICO',
    label: 'WTI Crude Oil Price',
    shortLabel: 'WTI Pétrole',
    category: 'commodities',
    unit: '$ / baril',
    frequency: 'daily',
    description: 'Prix du pétrole brut WTI — référence US, corrélé aux devises CAD/NOK et aux indices',
    importance: 'high',
    color: '#92400e',
  },
  OIL_BRENT: {
    seriesId: 'DCOILBRENTEU',
    label: 'Brent Crude Oil Price',
    shortLabel: 'Brent',
    category: 'commodities',
    unit: '$ / baril',
    frequency: 'daily',
    description: 'Prix du pétrole Brent (Europe) — référence mondiale, différentiel vs WTI indicateur de tension géopolitique',
    importance: 'medium',
    color: '#78350f',
  },
  GOLD: {
    seriesId: 'WPU102501',
    label: 'PPI Gold (Producer Price Index)',
    shortLabel: 'Or (PPI)',
    category: 'commodities',
    unit: 'Index 1982=100',
    frequency: 'monthly',
    description: 'Indice de prix producteur pour l\'or — proxy de la tendance du prix de l\'or (données BLS/FRED actives)',
    importance: 'high',
    color: '#d97706',
  },
  SILVER: {
    seriesId: 'WPU1023',
    label: 'PPI Silver (Producer Price Index)',
    shortLabel: 'Argent (PPI)',
    category: 'commodities',
    unit: 'Index 1982=100',
    frequency: 'monthly',
    description: 'Indice de prix producteur pour l\'argent — proxy de la tendance du prix de l\'argent (données BLS/FRED actives)',
    importance: 'medium',
    color: '#9ca3af',
  },
  COPPER: {
    seriesId: 'PCOPPUSDM',
    label: 'Copper Price',
    shortLabel: 'Cuivre',
    category: 'commodities',
    unit: '$ / tonne',
    frequency: 'monthly',
    description: 'Prix du cuivre ($ / tonne métrique) — "Dr. Copper", indicateur avancé de la santé économique mondiale',
    importance: 'medium',
    color: '#c2410c',
  },
};


// ─── Cache en mémoire (par indicateur) ───────────────────────────────────────

const memoryCache = {};

// ─── DB Helpers ───────────────────────────────────────────────────────────────

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS macro_indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_key TEXT NOT NULL,
    series_id TEXT NOT NULL,
    data TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    UNIQUE(indicator_key)
  )
`;

const UPSERT_INDICATOR_SQL = `
  INSERT INTO macro_indicators (indicator_key, series_id, data, fetched_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(indicator_key) DO UPDATE SET
    series_id = excluded.series_id,
    data = excluded.data,
    fetched_at = excluded.fetched_at
`;

const SELECT_INDICATOR_SQL = `
  SELECT data, fetched_at FROM macro_indicators WHERE indicator_key = ?
`;

const SELECT_ALL_SQL = `
  SELECT indicator_key, data, fetched_at FROM macro_indicators
`;

let tableEnsured = false;

const ensureTable = async () => {
  if (tableEnsured) return;
  try {
    await db.execute(CREATE_TABLE_SQL);
    tableEnsured = true;
  } catch (err) {
    console.error('[MacroLens] Erreur création table:', err.message);
  }
};

// ─── FRED API Fetcher ─────────────────────────────────────────────────────────

/**
 * FRED require une api_key valide. 
 * Clé gratuite disponible sur : https://fred.stlouisfed.org/docs/api/api_key.html
 * En attendant, on utilise la clé de développement publique FRED officielle.
 */
const getFredApiKey = () => {
  // Priorité 1 : env variable
  if (process.env.FRED_API_KEY && process.env.FRED_API_KEY.length > 5) {
    return process.env.FRED_API_KEY;
  }
  // Priorité 2 : clé de développement FRED publique (limitée à 120 req/min)
  return process.env.FRED_API_KEY_FALLBACK || null;
};

const fetchFromFred = async (seriesId, limit = OBSERVATIONS_LIMIT) => {
  const apiKey = getFredApiKey();

  const params = {
    series_id: seriesId,
    file_type: 'json',
    sort_order: 'desc',
    limit,
    observation_start: '2023-01-01',
  };

  if (apiKey) {
    params.api_key = apiKey;
  }

  try {
    const { data } = await axios.get(FRED_BASE_URL, {
      params,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TradeForge/MacroLens',
      },
    });

    if (!data?.observations) {
      throw new Error(`Pas d'observations pour ${seriesId}`);
    }

    // Trier par date ASC pour l'affichage chronologique
    const observations = data.observations
      .filter(obs => obs.value !== '.' && obs.value !== '') // Exclure valeurs manquantes
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .reverse(); // Remettre en ordre chronologique (ASC)

    return observations;
  } catch (err) {
    const status = err.response?.status;
    const fredError = err.response?.data?.error_message;
    console.error(`[MacroLens] Erreur FRED (${seriesId}): ${fredError || err.message} [HTTP ${status}]`);
    if (status === 400 && fredError?.includes('api_key')) {
      throw new Error('Clé FRED API invalide ou manquante. Créer une clé gratuite sur fred.stlouisfed.org');
    }
    throw err;
  }
};


// ─── Service Principal ────────────────────────────────────────────────────────

/**
 * Récupère les données d'un indicateur spécifique (cache DB + mémoire)
 */
const getIndicator = async (key) => {
  await ensureTable();

  const indicator = MACRO_INDICATORS[key];
  if (!indicator) {
    throw new Error(`Indicateur inconnu: ${key}`);
  }

  const now = Date.now();

  // 1. Check cache mémoire
  if (memoryCache[key] && (now - memoryCache[key].fetchedAt) < CACHE_DURATION_MS) {
    return { ...indicator, observations: memoryCache[key].data, fromCache: true };
  }

  // 2. Check cache DB
  try {
    const result = await db.execute({ sql: SELECT_INDICATOR_SQL, args: [key] });
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const fetchedAt = new Date(row.fetched_at).getTime();
      if ((now - fetchedAt) < CACHE_DURATION_MS) {
        const parsedData = JSON.parse(row.data);
        memoryCache[key] = { data: parsedData, fetchedAt };
        return { ...indicator, observations: parsedData, fromCache: true };
      }
    }
  } catch (err) {
    console.warn(`[MacroLens] Erreur lecture DB pour ${key}:`, err.message);
  }

  // 3. Fetch depuis FRED
  console.log(`[MacroLens] Fetch FRED pour ${key} (${indicator.seriesId})...`);
  const observations = await fetchFromFred(indicator.seriesId);

  // 4. Persister en DB
  const nowIso = new Date().toISOString();
  try {
    await db.execute({
      sql: UPSERT_INDICATOR_SQL,
      args: [key, indicator.seriesId, JSON.stringify(observations), nowIso],
    });
  } catch (err) {
    console.warn(`[MacroLens] Erreur persistance DB pour ${key}:`, err.message);
  }

  // 5. Mettre à jour le cache mémoire
  memoryCache[key] = { data: observations, fetchedAt: now };

  return { ...indicator, observations, fromCache: false };
};

/**
 * Récupère tous les indicateurs ou un sous-ensemble par catégorie
 */
const getAllIndicators = async (category = null) => {
  await ensureTable();

  const keys = category
    ? Object.keys(MACRO_INDICATORS).filter(k => MACRO_INDICATORS[k].category === category)
    : Object.keys(MACRO_INDICATORS);

  const results = await Promise.allSettled(keys.map(key => getIndicator(key)));

  return results
    .map((result, i) => {
      if (result.status === 'rejected') {
        const key = keys[i];
        const indicator = MACRO_INDICATORS[key];
        console.error(`[MacroLens] Échec pour ${key}:`, result.reason?.message);
        return {
          ...indicator,
          key,
          observations: [],
          error: result.reason?.message || 'Erreur inconnue',
        };
      }
      return { ...result.value, key: keys[i] };
    });
};

/**
 * Retourne la liste des indicateurs disponibles (metadata seulement, sans données)
 */
const getIndicatorsList = () => {
  return Object.entries(MACRO_INDICATORS).map(([key, meta]) => ({
    key,
    ...meta,
  }));
};

/**
 * Force le refresh d'un indicateur (invalide le cache)
 */
const refreshIndicator = async (key) => {
  delete memoryCache[key];
  return getIndicator(key);
};

module.exports = {
  getIndicator,
  getAllIndicators,
  getIndicatorsList,
  refreshIndicator,
  MACRO_INDICATORS,
};
