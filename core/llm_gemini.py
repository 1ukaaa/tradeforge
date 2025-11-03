from __future__ import annotations
import json, os, re
from typing import Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import ValidationError
from dotenv import load_dotenv
import google.generativeai as genai

from .schema import ModelOutput
from .prompt import PROMPT_TEMPLATE

load_dotenv()

class LLMError(RuntimeError): ...

def _find_json_block(text: str, start: int) -> Optional[str]:
    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(text)):
        ch = text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : idx + 1]
    return None

def _extract_json(text: str) -> dict[str, Any]:
    """Extract the first JSON document by walking through the string safely."""
    decoder = json.JSONDecoder()
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\s*```$", "", stripped).strip()
    try:
        return decoder.decode(stripped)
    except json.JSONDecodeError:
        pass

    # Certaines réponses listent simplement les clés top-level sans accolade ouvrante.
    if not stripped.startswith("{"):
        patched = stripped
        if not patched.startswith(("\"", "'")):
            patched = patched.lstrip()
        patched = "{" + patched
        if not stripped.rstrip().endswith("}"):
            patched = patched.rstrip().rstrip(",") + "}"
        try:
            return decoder.decode(patched)
        except json.JSONDecodeError:
            pass

    start = stripped.find("{")
    while start != -1:
        candidate = _find_json_block(stripped, start)
        if candidate:
            try:
                result = decoder.decode(candidate)
                if isinstance(result, dict) and "meta" in result:
                    return result
            except json.JSONDecodeError:
                pass
        start = stripped.find("{", start + 1)

    raise json.JSONDecodeError("Aucun JSON valide trouvé dans la réponse du modèle.", stripped, 0)

class GeminiClientLive:
    def __init__(self, model_name: str = "gemini-2.5-flash", api_key: str | None = None):
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise LLMError("GEMINI_API_KEY manquant")
        genai.configure(api_key=key)
        self.model = genai.GenerativeModel(model_name)

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type((LLMError, ValidationError, json.JSONDecodeError))
    )
    def generate(self, raw_text: str) -> ModelOutput:
        prompt = PROMPT_TEMPLATE.format(raw_text=raw_text)
        resp = self.model.generate_content(prompt)
        if not resp or not resp.text:
            raise LLMError("Réponse vide du modèle")
        data = _extract_json(resp.text)
        return ModelOutput.model_validate(data)
