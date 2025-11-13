// backend/src/services/economic.service.js
const axios = require("axios");
const { ECONOMIC_EVENTS_SOURCE_URL } = require("../config/server.config");

// Cache en mémoire simple
let cache = {
  data: [],
  lastFetch: 0,
};

// Verrou pour éviter le spam 429 pendant le hot-reload
let isFetching = false;

const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 heures

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
          impact: impact 
        }
      };
    });
  // .filter(Boolean) n'est plus nécessaire car on ne retourne plus 'null'
};


const getEconomicEvents = async () => {
  const now = Date.now();
  
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
    return [];
  }

  try {
    new URL(url);
  } catch {
    console.warn("URL FOREX_FACTORY_URL invalide:", url);
    isFetching = false;
    return [];
  }

  try {
    // Axios gère le parsing JSON automatiquement
    const { data: jsonEvents } = await axios.get(url);

    // Transforme les données JSON en événements de calendrier
    const allEvents = mapEvents(jsonEvents); // Appel de la fonction corrigée

    // Met à jour le cache
    cache = {
      data: allEvents,
      lastFetch: now,
    };

    console.log(`Service éco (JSON) : Cache mis à jour avec ${allEvents.length} événements.`);
    return allEvents;

  } catch (err) {
    console.error("Erreur lors de la récupération du calendrier JSON:", err.message);
    // En cas d'erreur (ex: 429), on renvoie l'ancien cache s'il existe
    return cache.data || [];
  } finally {
    // Quoi qu'il arrive, libère le verrou
    isFetching = false;
  }
};

module.exports = {
  getEconomicEvents,
};
