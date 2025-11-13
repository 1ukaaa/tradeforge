// frontend/src/services/economicClient.js
const ECONOMIC_ENDPOINT = "http://localhost:5050/api/economic-events";

export const fetchEconomicEvents = async () => {
  const response = await fetch(ECONOMIC_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Erreur serveur (${response.status})`);
  }
  const data = await response.json();
  return data.events || [];
};