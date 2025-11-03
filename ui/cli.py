# tradeforge/ui/cli.py
from __future__ import annotations
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv, find_dotenv

# Charger les variables .env avant tout
load_dotenv(find_dotenv())

# Clients LLM
try:
    # Client live (Gemini)
    from core.llm_gemini import GeminiClientLive, LLMError as LLMErrorLive
except Exception:
    GeminiClientLive = None  # type: ignore
    class LLMErrorLive(RuntimeError): ...
# Client mock (offline)
from core.llm import GeminiClient as GeminiClientMock

# Storage
from core.storage import save_json, append_csv


def read_input(args: argparse.Namespace) -> str:
    """Récupère le texte source: --file > --text > stdin > prompt."""
    if args.file:
        return Path(args.file).read_text(encoding="utf-8")
    if args.text:
        return args.text
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return input("Colle ton analyse puis Entrée:\n")


def sanitize_name(s: str) -> str:
    """Nettoie une chaîne pour nom de fichier."""
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", s.strip().lower()).strip("-")


def build_llm_input(raw_text: str, outputs_list: list[str]) -> str:
    """
    Construit l'entrée transmise au modèle.
    Compatibilité ascendante: on inclut les flags dans le corps si le template
    ne gère pas explicitement {requested_outputs_json}.
    """
    suffix = "\n\nFlags d'activation reçus:\n" + json.dumps(outputs_list, ensure_ascii=False)
    return raw_text.strip() + suffix


def print_summary(out) -> None:
    """Résumé console minimal."""
    try:
        pair = out.meta.pair
        bias = out.meta.bias
        scen = ""
        try:
            scen = out.analysis_structured.sections.scenarios[0]
        except Exception:
            try:
                scen = out.analysis_structured.scenarios[0]  # compat ancienne structure
            except Exception:
                scen = ""
        if scen:
            print(f"[{pair}] {bias} | scénario: {scen}")
        else:
            print(f"[{pair}] {bias}")
    except Exception:
        print("Analyse générée.")


def main() -> int:
    ap = argparse.ArgumentParser(description="TradeForge V1 – console")
    ap.add_argument("--text", help="Analyse brute en argument")
    ap.add_argument("--file", help="Chemin d'un .txt")
    ap.add_argument("--live", action="store_true", help="Utiliser Gemini réel")
    ap.add_argument(
        "--outputs",
        default="text,sheets,notion,twitter",
        help="Liste comma parmi: text,sheets,notion,twitter"
    )
    ap.add_argument("--debug", action="store_true", help="Traceback détaillé en cas d'erreur")
    args = ap.parse_args()

    raw = read_input(args)
    requested = [x.strip() for x in args.outputs.split(",") if x.strip()]
    llm_input = build_llm_input(raw, requested)

    # Sélection client
    if args.live:
        if GeminiClientLive is None:
            print("Client Gemini live indisponible. Vérifie l'installation et les imports.")
            return 1
        client = GeminiClientLive()  # lit GEMINI_API_KEY depuis l'environnement
        LLMErr = LLMErrorLive
    else:
        client = GeminiClientMock(api_key=None)
        LLMErr = RuntimeError  # placeholder, le mock ne lève pas ce type

    try:
        # Important: on envoie le texte déjà enrichi des flags.
        out = client.generate(llm_input)

        # Résumé console
        print_summary(out)

        # Sauvegardes
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        fname = f"{stamp}_{sanitize_name(out.meta.pair)}"
        jpath = save_json(out, fname)

        # CSV journal si présent
        try:
            row = out.google_sheets_row.model_dump()
            append_csv(row)
            csv_info = "Journal CSV -> out/journal.csv"
        except Exception:
            csv_info = "Journal CSV: aucun bloc 'sheets' demandé/produit"

        print(f"JSON -> {jpath}")
        print(csv_info)
        return 0

    except (LLMErr, Exception) as e:
        if args.debug:
            import traceback
            traceback.print_exc()
        print(f"Erreur génération: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
