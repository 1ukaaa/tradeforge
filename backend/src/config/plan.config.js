// backend/src/config/plan.config.js

const DEFAULT_PLAN = {
  windows: ["Europe", "US"],
  style: "swing",
  pairs: "EURUSD, NAS100, DAX",
  tradeDuringNews: false,
  entryStrategy:
    "Attendre un retracement M15 confirmé par un support Daily, valider par impulsion H1 avant l’entrée.",
  risk: "1,5 % maximum par trade, stop sous le dernier swing, TP1 à +0,5 % / TP2 à +1,2 %.",
  management:
    "Sorties progressives : basculer en BE dès +0,2 %, verrouiller une portion à TP1 puis laisser courir.",
  notes: "Pas de position pendant annonces majeures, vérifier les niveaux macro avant toute prise.",
};

module.exports = {
  DEFAULT_PLAN,
};