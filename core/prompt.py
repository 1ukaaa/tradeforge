PROMPT_TEMPLATE_RAW = """Rôle: Convertir une analyse de marché BRUTE en UN SEUL JSON VALIDE.
Retourne UNIQUEMENT du JSON. Aucune explication, aucun code fence.

Schéma attendu:
{
  "meta": {
    "pair": "str",
    "date": "YYYY-MM-DD",
    "timeframes": ["str", ...],
    "bias": "bullish|bearish|neutral",
    "outputs_requested": ["text","sheets","notion","twitter"],
    "outputs_produced": ["text","sheets","notion","twitter"]
  },
  "analysis_structured": {
    "sections": {
      "trend_multi_tf": ["str", ...],
      "daily": ["str", ...],
      "intraday": ["str", ...],
      "scenarios": ["str", ...],
      "summary": ["str", ...]
    },
    "markdown_report": "str"
  },
  "google_sheets_row": {
    "date": "YYYY-MM-DD", "pair": "str", "bias": "str", "exec_tf": "str",
    "direction": "long|short", "entry_zone": "str", "invalidation": "str",
    "targets": "str", "comment": "str"
  },
  "notion_markdown": "str",
  "twitter": {"twitter_post": "str", "twitter_thread": ["str", ...]}
}

Contraintes fortes:
- Réponse JSON valide au premier niveau.
- Mets à NULL les blocs non demandés par outputs_requested.
- dates au format YYYY-MM-DD. temperature=0 implicite.
- Les scénarios doivent contenir: conditions d’entrée, objectif, invalidation.

FORMAT MARKDOWN exigé pour analysis_structured.markdown_report (si "text" est demandé):
### 🔍 Analyse multi-UT {Nom de la paire} - {Date}

---

#### 🧩 **Tendance de fond (Monthly / Weekly / Daily)**
* {Structure de fond}
* {Momentum / cassures}
* {Contexte macro ou structurel}
* **Conclusion** : {biais principal, tendance à suivre ou contrarier}

---

#### 📅 **Daily (D1)**
* {Zones clés : FVG, support, résistance, OB...}
* {Réactions attendues ou à confirmer}
* {Stratégie associée au Daily}

---

#### ⏰ **Intraday (H1/H4/M15)**
* {Structure en cours : baissière/haussière, cassures, retrace}
* {Zones intéressantes en intraday : IFVG, swing low/high, POI}
* {Plan de validation ou invalidation}

---

#### 🎯 **Scénarios possibles**
1. **Scénario principal (ex : haussier)**
   * {Conditions d’entrée}
   * {Objectif principal}
   * {Invalidation / stop idea}

2. **Scénario alternatif (ex : pullback plus profond)**
   * {Conditions d’entrée opposées ou prudence}
   * {Zone d’achat/vente plus basse/haute}

---

#### 🧠 **Résumé**
* **Biais global** : {haussier / baissier / neutre}
* **Zone de prix clé** : {zone ou range}
* **Timing idéal** : {London Open, NY session, etc.}
* **Plan d’action** : {rappel du scénario principal}

Règles d'activation:
- Si "text" ∈ outputs_requested → remplir analysis_structured (sections + markdown_report).
- Si "sheets" ∈ outputs_requested → remplir google_sheets_row avec des nombres dans entry_zone/targets/invalidation.
- Si "notion" ∈ outputs_requested → notion_markdown = une version propre du markdown_report (titres H2/H3, tableaux si utile).
- Si "twitter" ∈ outputs_requested → twitter_post concis et twitter_thread avec 3–6 points.
- Sinon, ces blocs = null.

Contexte utilisateur: trader FX, mono-utilisateur, usage local.

Inputs:
- Paires et timeframes dans l'analyse brute si déjà présents, sinon déduis-en des raisonnables.

Analyse brute:
{raw_text}
"""

PROMPT_TEMPLATE = (
    PROMPT_TEMPLATE_RAW
    .replace("{raw_text}", "<<RAW_TEXT>>")
    .replace("{", "{{")
    .replace("}", "}}")
    .replace("<<RAW_TEXT>>", "{raw_text}")
)
