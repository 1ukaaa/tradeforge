from .schema import ModelOutput
from .prompt import PROMPT_TEMPLATE

class GeminiClient:
    # Stub: on branchera l'API réelle au prochain pas
    def __init__(self, api_key: str | None):
        self.api_key = api_key

    def generate(self, raw_text: str) -> ModelOutput:
        # MOCK de réponse pour valider la pipeline sans réseau
        mock = {
            "meta": {"pair":"EURJPY","date":"2025-11-03","timeframes":["W","D","H4","H1"],"bias":"bullish"},
            "analysis_structured":{
                "context":"Marché haussier de fond.",
                "trend":"Haussier W/D.",
                "key_levels":["161.20","160.40","159.80"],
                "scenarios":["Acheter pullback H4 vers 160.40, inval 159.80, tgt 161.20/162.00"],
                "risks":"News JPY; volatilité."
            },
            "google_sheets_row":{
                "date":"2025-11-03","pair":"EURJPY","bias":"bullish","exec_tf":"H4",
                "direction":"long","entry_zone":"160.40-160.60","invalidation":"159.80",
                "targets":"161.20;162.00","comment":"pullback propre"
            },
            "notion_markdown":"# EURJPY – 2025-11-03\n\n## Contexte\nMarché haussier...\n",
            "twitter":{"twitter_post":"EURJPY: tendance haussière, pullback H4 160.40→161.20.",
                       "twitter_thread":["Contexte W/D haussier","Zone clé 160.40","Plan long vers 161.20/162.00"]}
        }
        return ModelOutput.model_validate(mock)
