// backend/src/services/economic.service.js
const axios = require("axios");
const db = require("../core/database");
const { ECONOMIC_EVENTS_SOURCE_URL } = require("../config/server.config");

// Cache en mémoire simple
let cache = {
  data: [],
  lastFetch: 0,
};

// Verrou pour éviter le spam 429 pendant le hot-reload
let isFetching = false;

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 heures
const UPSERT_EVENT_SQL = `
  INSERT INTO economic_events (event_id, title, currency, impact, date, payload, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(event_id) DO UPDATE SET
    title = excluded.title,
    currency = excluded.currency,
    impact = excluded.impact,
    date = excluded.date,
    payload = excluded.payload,
    updatedAt = excluded.updatedAt
`;
const SELECT_EVENTS_SQL = `
  SELECT payload
  FROM economic_events
  ORDER BY date ASC, id ASC
`;

let cacheWarm = false;

const parseStoredPayload = (payload) => {
  try {
    return JSON.parse(payload);
  } catch (err) {
    console.warn("Service éco: Impossible de parser un événement stocké:", err.message);
    return null;
  }
};

const getStoredEconomicEvents = async () => {
  try {
    const result = await db.execute(SELECT_EVENTS_SQL);
    return result.rows
      .map(({ payload }) => parseStoredPayload(payload))
      .filter(Boolean);
  } catch (err) {
    console.error("Service éco: Erreur lors de la lecture en base:", err.message);
    return [];
  }
};

const persistEconomicEvents = async (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }

  const nowIso = new Date().toISOString();
  const rows = events
    .filter((event) => event?.id && event?.date)
    .map((event) => ({
      event_id: event.id,
      title: event.title || "Événement",
      currency: event.extendedProps?.currency || null,
      impact: event.extendedProps?.impact || null,
      date: event.date,
      payload: JSON.stringify(event),
      createdAt: nowIso,
      updatedAt: nowIso,
    }));

  if (rows.length === 0) {
    return;
  }

  const statements = rows.map((record) => ({
    sql: UPSERT_EVENT_SQL,
    args: [
      record.event_id,
      record.title,
      record.currency,
      record.impact,
      record.date,
      record.payload,
      record.createdAt,
      record.updatedAt,
    ],
  }));

  try {
    await db.batch(statements, "write");
  } catch (err) {
    console.error("Service éco: Erreur lors de la persistance:", err.message);
  }
};

const ensureCacheWarm = async () => {
  if (cacheWarm) return;
  cache.data = await getStoredEconomicEvents();
  cacheWarm = true;
};

/**
 * Transforme les événements JSON bruts de Forex Factory
 * en événements compatibles avec FullCalendar.
 */
const mapEvents = (events) => {
  if (!Array.isArray(events)) {
    console.warn("Service éco: La source JSON n'est pas un tableau.");
    return [];
  }

  return events
    .map((event) => {
      // *** LOGIQUE MISE À JOUR POUR INCLURE TOUS LES IMPACTS ***
      
      // 1. Lire les champs
      const impact = event.impact ? event.impact.toLowerCase() : "none";
      const currency = event.country || "???";
      const title = event.title || "Événement inconnu";
      const date = event.date;
      
      // 2. Définir les couleurs par impact
      let color;
      switch (impact) {
        case "high":
          color = "#880e4f"; // Rose foncé
          break;
        case "medium":
          color = "#c66900"; // Orange
          break;
        case "low":
          color = "#0288d1"; // Bleu
          break;
        case "holiday":
          color = "#2e7d32"; // Vert
          break;
        default:
          color = "#5f6368"; // Gris
      }

      // 3. RETOURNER L'OBJET COMPLET
      // On ne filtre plus ici, le frontend s'en chargera.
      return {
        id: `${date}-${currency}-${title}`, // ID unique
        title: `(${currency}) ${title}`,
        date: date,
        allDay: false, // La plupart des annonces ont une heure précise
        color: color,
        // PROPRIÉTÉ AJOUTÉE (ESSENTIELLE POUR LES FILTRES)
        extendedProps: {
          type: 'economic',
          impact: impact,
          currency: currency,
        }
      };
    });
  // .filter(Boolean) n'est plus nécessaire car on ne retourne plus 'null'
};


const getEconomicEvents = async () => {
  const now = Date.now();
  await ensureCacheWarm();
  
  // 1. Le cache est-il valide ?
  if (now - cache.lastFetch < CACHE_DURATION && cache.data.length > 0) {
    console.log("Service éco (JSON) : Renvoi des événements depuis le cache (valide).");
    return cache.data;
  }

  // 2. Une requête est-elle déjà en cours ? (Protection 429)
  if (isFetching) {
    console.log("Service éco (JSON) : Requête déjà en cours, renvoi du cache (périmé).");
    return cache.data;
  }

  console.log("Service éco (JSON) : Récupération des nouveaux événements JSON...");
  isFetching = true; // Pose le verrou

  // Utilise la variable d'environnement (elle doit pointer vers le .json)
  const url = ECONOMIC_EVENTS_SOURCE_URL;
  if (!url) {
    console.warn("URL FOREX_FACTORY_URL non définie dans .env");
    isFetching = false; // Libère le verrou
    if (!cache.data.length) {
      cache.data = await getStoredEconomicEvents();
    }
    return cache.data;
  }

  try {
    new URL(url);
  } catch {
    console.warn("URL FOREX_FACTORY_URL invalide:", url);
    isFetching = false;
    if (!cache.data.length) {
      cache.data = await getStoredEconomicEvents();
    }
    return cache.data;
  }

  try {
    // Axios gère le parsing JSON automatiquement
    const { data: jsonEvents } = await axios.get(url);

    // Transforme les données JSON en événements de calendrier
    const allEvents = mapEvents(jsonEvents); // Appel de la fonction corrigée

    // Persiste les événements pour conserver l'historique
    await persistEconomicEvents(allEvents);

    const storedEvents = await getStoredEconomicEvents();

    // Met à jour le cache
    cache = {
      data: storedEvents,
      lastFetch: now,
    };

    console.log(`Service éco (JSON) : Cache mis à jour et ${storedEvents.length} événements persistés.`);
    return storedEvents;

  } catch (err) {
    console.error("Erreur lors de la récupération du calendrier JSON:", err.message);
    // En cas d'erreur (ex: 429), on renvoie les événements persistés
    const storedEvents = await getStoredEconomicEvents();
    if (storedEvents.length) {
      console.log("Service éco : Renvoi des événements persistés en base.");
    }
    cache.data = storedEvents.length ? storedEvents : cache.data;
    return cache.data || [];
  } finally {
    // Quoi qu'il arrive, libère le verrou
    isFetching = false;
  }
};

module.exports = {
  getEconomicEvents,
};
