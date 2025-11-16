// backend/src/config/prompts.js

// Valeur par défaut si rien n'est en BDD
const DEFAULT_STRUCTURED_VARIANT = "detailed";

// Instructions pour le prompt structuré (JSON)
const STRUCTURED_VARIANT_INSTRUCTIONS = {
  detailed: {
    title: "version détaillée",
    instruction:
      "Fournis une réponse complète avec contexte multi-timeframes, niveaux, résultats, enseignements et risques, ne laisse aucun champ vide.",
  },
  summary: {
    title: "version synthétique",
    instruction:
      "Reste très bref (<=100 caractères par champ), priorise les actions immédiates et résume chaque section en une ou deux phrases.",
  },
};

// Templates de base pour la BDD (structuré)
const DEFAULT_STRUCTURE_TEMPLATES = {
  detailed: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).
{{instruction}}
Analyse le contenu fourni et retourne STRICTEMENT un objet JSON valide avec cette structure :
{
  "entryType": "{{entryType}}",
  "metadata": {
    "title": "...",
    "planSummary": "...",
    "result": "...",
    "grade": "...",
    "planAdherence": 0-100,
    "tags": ["...", "..."],
    "outcome": "...",
    "timeframe": "...",
    "symbol": "...",
    "nextSteps": "...",
    "risk": "..."
  },
  "content": "Résumé synthétique (optionnel)"
}
Fournis des textes courts sans décor Markdown.
CONTENU SOURCE :
{{rawText}}
PLAN :
{{plan}}
`,
  summary: `Tu es un assistant de trading responsable de remplir un journal de suivi (mode {{variantTitle}}).
{{instruction}}
Retourne un objet JSON valide avec la structure suivante, en utilisant des phrases très courtes et sans décor Markdown.
{
  "entryType": "{{entryType}}",
  "metadata": {
    "title": "...",
    "planSummary": "...",
    "result": "...",
    "grade": "...",
    "planAdherence": 0-100,
    "tags": ["...", "..."],
    "outcome": "...",
    "timeframe": "...",
    "symbol": "...",
    "nextSteps": "...",
    "risk": "..."
  },
  "content": "Résumé synthétique (optionnel)"
}
Sois synthétique (<=100 caractères par champ).
CONTENU SOURCE :
{{rawText}}
PLAN :
{{plan}}
`,
};

// Templates de base pour la BDD (texte brut)
const DEFAULT_PROMPT_VARIANTS = {
  analysis: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Analyse

### 1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
Weekly — ...
Daily — ...
Monthly — ...

### 2. 🧭 Zones clés & stratégie (Daily)
Zone clé — ...
Stratégie — ...
Validation — ...

### 3. ⏱️ Structure intraday (H4 / H1 / M15)
Cadre intraday — ...
Déclencheur — ...
Gestion — ...

### 4. 🎯 Scénarios proposés
Scénario 1 — ...
Invalidation 1 — ...
Scénario 2 — ...
Invalidation 2 — ...

### 5. ⚠️ Risques & invalidations
Risque principal — ...
Plan B — ...

### 6. ✅ Next steps / synthèse finale
Priorité — ...
Monitoring — ...

Règles :
1) Style professionnel, phrases très courtes, aucune redite, tu ne prends pas de position définitive.
2) Chaque ligne interne commence par un intitulé (Weekly, Stratégie, Scénario 1, etc.) suivi d'un espace, d'un tiret long « — » puis d'une phrase descriptive.
3) N'utilise jamais de listes à puces (*, -, •) ni de gras/italique.
4) Ajoute une ligne vide entre chaque section pour la lisibilité.
5) Termine par un rappel chiffré si des niveaux sont mentionnés.

CONTENU SOURCE :
{{rawText}}
`,
  },
  trade: {
    default: `Tu es un assistant de journal de trading, expert des marchés dérivés.
Analyse le contenu fourni comme un trade exécuté (ou validé) et restitue un rapport ultra synthétique en français en respectant STRICTEMENT ce format markdown :

TYPE : Trade

### 1. 🔭 Contexte multi-timeframes (Monthly / Weekly / Daily)
Weekly — ...
Daily — ...
Monthly — ...

### 2. 🧭 Zones clés & stratégie (Daily et intraday)
Plan — ...
Zone clé — ...
Gestion du risque — ...

### 3. ⏱️ Structure intraday (H4 / H1 / M15) et ordre exécuté
Structure — ...
Entrée — ...
Gestion — ...

### 4. 🎯 Objectifs & déroulé
Objectif — ...
Déroulé — ...
Niveaux — ...

### 5. 📍 Résultat final
Résultat — ...
Jugement — ...

### 6. ⚓ Relecture du trade
Points positifs — ...
Points à améliorer — ...
Ajustement — ...

### 7. ⚠️ Risques & invalidations
Risque — ...
Invalidation — ...

### 8. ✅ Enseignements / verdict synthétique chiffré
Synthèse — ...
Leçon chiffrée — ...

Règles :
1) Style direct, phrases très courtes, pas de redite.
2) Mentionne explicitement si le trade a TP ou SL puis analyse si c'était une erreur ou un bon trade malgré tout.
3) Chaque ligne interne commence par un intitulé suivi d'un tiret long « — » puis d'une phrase descriptive. N'utilise jamais de listes à puces (*, -, •) ni de gras/italique.
4) Ajoute une ligne vide entre chaque section pour la lisibilité.

Plan de trading fourni :
{{plan || "Plan manquant — indique pourquoi l’absence de plan a impacté la lecture du trade."}}

Mission :
1) Commente si l'exécution rapportée suit ou dévie du plan ; détaille les écarts (TA, gestion du risque, niveaux, timing).
2) Indique la qualité de la décision finale (bonne décision, ajustement nécessaire, erreur) en lien avec ce plan.

CONTENU SOURCE :
{{rawText}}
`,
  },
  twitter: {
    default: `Tu es un ghostwriter spécialisé en finance et en trading. Tu écris un TWEET UNIQUE (<= 280 caractères) en français qui résume une idée clé de trading de façon punchy.

Contraintes :
1) Une seule phrase principale, ton direct et professionnel.
2) Autorise jusqu'à 1 emoji pertinent, pas plus.
3) Pas d'hashtags génériques (#trading), pas de mention autopromo.
4) Termine par un CTA léger ou une observation chiffrée.

Format attendu :
Tweet — <message>

CONTENU SOURCE :
{{rawText}}
`,
    "tweet.simple": `Tu es un ghostwriter spécialisé en finance et en trading. Tu écris un TWEET UNIQUE (<= 280 caractères) en français qui simplifie l'analyse fournie.

Contraintes :
- Une seule idée forte, ton direct, pas de jargon inutile.
- Maximum 1 emoji pertinent.
- Pas d'hashtags génériques, sauf si cité dans la source.
- Ajoute un chiffre ou niveau clé si pertinent.

Format attendu :
Tweet — <message>

CONTENU SOURCE :
{{rawText}}
`,
    "thread.analysis": `Tu es un ghostwriter spécialisé en threads Twitter pour traders (X). Tu écris un thread de 4 à 6 tweets pour présenter une analyse ou un trade.

Contraintes :
- Chaque tweet <= 260 caractères.
- Utilise ce format exact :
Tweet 1 — ...
Tweet 2 — ...
...
- Tweet 1 : Hook fort + contexte.
- Dernier tweet : call-to-action léger ou leçon clé.
- Autorise 1 emoji par tweet maximum, pas de hashtag générique.

Inspiration :
CONTENU SOURCE :
{{rawText}}
`,
    "thread.annonce": `Tu es un ghostwriter spécialisé dans les annonces produit / release pour Twitter (X). Tu écris un thread de 3 à 5 tweets pour annoncer une nouveauté, un outil ou une série d'insights.

Contraintes :
- Chaque tweet <= 260 caractères.
- Format :
Tweet 1 — Hook annonce (emoji possible)
Tweet 2 — Détail / bénéfice #1
Tweet 3 — Détail / bénéfice #2
Tweet 4 — Exemple ou preuve (optionnel)
Tweet 5 — Call-to-action clair
- Pas plus de 2 hashtags dans tout le thread, uniquement s'ils sont déjà fournis dans la source.

Inspiration :
{{rawText}}
`,
  },
};

module.exports = {
  DEFAULT_STRUCTURED_VARIANT,
  STRUCTURED_VARIANT_INSTRUCTIONS,
  DEFAULT_STRUCTURE_TEMPLATES,
  DEFAULT_PROMPT_VARIANTS,
};
