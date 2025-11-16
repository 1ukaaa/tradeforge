// backend/src/config/seed.config.js

// Données de seeding copiées de l'ancien index.js
const journalSeed = [
  {
    type: "trade",
    content:
      "TYPE : Trade\n🎯 Objectif : 19320 → TP 1, TP 2 à 19415.\nConclusion : TP final, plan maintenu.",
    plan: "Entrée long sur cassure H1 / Stop sous support 19240.",
    transcript: "Breakout long sur NAS100 validé par impulsion H1.",
    createdAt: "2025-02-12T13:20:00Z", // Date ISO pour tri correct
    metadata: {
      title: "Breakout long sur NAS100 après pression macro",
      symbol: "NAS100 / US30",
      date: "12 fév 2025 · 14:20", // Gardé pour affichage
      timeframe: "H1 / H4",
      result: "TP",
      grade: "+1,3%",
      accountId: "forex-account",
      accountName: "Forex (EUR)",
      pnlAmount: 1350,
      pnlCurrency: "EUR",
      pnlPercent: 1.3,
      planSummary: "Entrée sur retracement M15 validé + momentum H1.",
      outcome: "Parcours conforme à l’hypothèse, TP2 atteint.",
      planAdherence: 92,
      tags: ["Momentum", "Breakout", "Niveau clé"],
      nextSteps: "Réviser la zone S pour préparer la prochaine entrée.",
      risk: "Surveillance de la divergence RSI H1.",
    },
  },
  {
    type: "analyse",
    content:
      "TYPE : Analyse\nScénario long si Weekly casse 1.0900, scénario short si reprise sous 1.0840.\nPas de prise de position immédiate, suivre le momentum.",
    plan: "Priorité long > 1.0900 sinon attendre pullback S1 + confirmation H4.",
    transcript: "Analyse EUR/USD pré-NFP.",
    createdAt: "2025-02-11T20:10:00Z", // Date ISO pour tri correct
    metadata: {
      title: "Deux scénarios sur EUR/USD avant NFP",
      symbol: "EURUSD",
      date: "11 fév 2025 · 20:10",
      timeframe: "Daily / H4",
      result: "Analyse",
      grade: "Scénarios croisés",
      planSummary: "Long au-dessus de Weekly 1.0900, sinon long au pullback S1.",
      outcome: "Deux chemins, la patience reste la règle.",
      planAdherence: 0,
      tags: ["Macro", "News", "Multi-thème"],
      nextSteps: "Garder le flux de liquidité avant décision.",
      risk: "Breakdown sous 1.0800 invalide bullish.",
    },
  },
  {
    type: "trade",
    content:
      "TYPE : Trade\nObjectif SL 86.10, TP à 84.95.\nSL déclenché après forced liquidity, ajuster la lecture.",
    plan: "Short UKOIL après rejet 88, SL sous 86.20.",
    transcript: "Short pétrole après inventaires.",
    createdAt: "2025-02-08T09:35:00Z", // Date ISO pour tri correct
    metadata: {
      title: "Short CTA sur pétrole après décalage inventaires",
      symbol: "UKOIL",
      date: "08 fév 2025 · 09:35",
      timeframe: "H4 / Daily",
      result: "SL",
      grade: "-0,8% + apprentissage",
      accountId: "forex-account",
      accountName: "Forex (EUR)",
      pnlAmount: -800,
      pnlCurrency: "EUR",
      pnlPercent: -0.8,
      planSummary: "Short continuation, stop sous 86.20.",
      outcome: "SL mais plan solide, ajuster flux.",
      planAdherence: 78,
      tags: ["Macro event", "Volatilité"],
      nextSteps: "Réévaluer la cause du rejet puis la suite.",
      risk: "Reprise possible si 89 cassé.",
    },
  },
  {
    type: "trade",
    content:
      "TYPE : Trade\nAchat partiel sur BTC/USD après reprise de momentum H4.",
    plan: "Accumulation progressive sur la zone 64k avec invalidation sous 62k.",
    transcript: "Scénario long crypto sur rebond de liquidité.",
    createdAt: "2025-02-05T15:10:00Z",
    metadata: {
      title: "Rebond BTC sur zone 64k",
      symbol: "BTCUSD",
      date: "05 fév 2025 · 16:10",
      timeframe: "H4 / Daily",
      result: "TP",
      grade: "+0,9%",
      accountId: "crypto-account",
      accountName: "Crypto (USD)",
      pnlAmount: 420,
      pnlCurrency: "USD",
      pnlPercent: 0.9,
      planSummary: "Entrée progressive, sortie partielle sur 66k.",
      outcome: "Objectif partiel atteint, reste à pyramider sur cassure.",
      planAdherence: 80,
      tags: ["Crypto", "Momentum"],
      nextSteps: "Surveiller l'orderflow avant breakout.",
      risk: "Retour sous 63k invalide l'hypothèse.",
    },
  },
];

module.exports = {
  journalSeed,
};
