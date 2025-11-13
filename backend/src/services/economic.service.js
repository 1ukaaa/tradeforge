// backend/src/services/economic.service.js
const axios = require("axios");
require("dotenv").config();

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
      // *** LOGIQUE MISE À JOUR BASÉE SUR LE JSON FOURNI ***
      
      // 1. Lire les champs (basé sur votre JSON)
      const impact = event.impact ? event.impact.toLowerCase() : "none";
      const currency = event.country || "???"; // Clé correcte: event.country
      const title = event.title || "Événement inconnu"; // Clé correcte: event.title
      const date = event.date; // Clé correcte: event.date
      
      // 2. Filtrer les impacts (on ne garde que 'high' et 'medium')
      const isHighImpact = impact === "high";
      const isMediumImpact = impact === "medium";

      if (!isHighImpact && !isMediumImpact) {
        // Cela exclura "Low" et "Holiday"
        return null; 
      }

      return {
        id: `${date}-${currency}-${title}`, // ID unique
        title: `(${currency}) ${title}`,
        date: date,
        allDay: false,
        color: isHighImpact ? "#880e4f" : "#c66900", // Rose pour High, Orange pour Medium
      };
    })
    .filter(Boolean); // Retire tous les 'null' (événements filtrés)
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
  const url = process.env.FOREX_FACTORY_URL; 
  if (!url) {
    console.warn("URL FOREX_FACTORY_URL non définie dans .env");
    isFetching = false; // Libère le verrou
    return [];
  }

  try {
    // Axios gère le parsing JSON automatiquement
    const { data: jsonEvents } = await axios.get(url);

    // Transforme les données JSON en événements de calendrier
    const filtered = mapEvents(jsonEvents); // Appel de la fonction corrigée

    // Met à jour le cache
    cache = {
      data: filtered,
      lastFetch: now,
    };

    console.log(`Service éco (JSON) : Cache mis à jour avec ${filtered.length} événements.`);
    return filtered;

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