from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date

class Meta(BaseModel):
    pair: str
    date: date
    timeframes: List[str]
    bias: Literal["bullish","bearish","neutral"]
    outputs_requested: List[Literal["text","sheets","notion","twitter"]] = Field(default_factory=list)
    outputs_produced: List[Literal["text","sheets","notion","twitter"]] = Field(default_factory=list)

class AnalysisSections(BaseModel):
    trend_multi_tf: List[str]               # bullets pour Monthly/Weekly/Daily
    daily: List[str]                        # bullets Daily
    intraday: List[str]                     # bullets H1/H4/M15
    scenarios: List[str]                    # au moins 2 scénarios
    summary: List[str]                      # biais, zones clés, timing, plan

class AnalysisStructured(BaseModel):
    sections: AnalysisSections
    markdown_report: str                    # le rendu EXACT en Markdown demandé

class GoogleSheetsRow(BaseModel):
    date: date; pair: str; bias: str
    exec_tf: str; direction: str
    entry_zone: str; invalidation: str
    targets: str; comment: str = ""

class TwitterBundle(BaseModel):
    twitter_post: Optional[str] = None
    twitter_thread: Optional[List[str]] = None

class ModelOutput(BaseModel):
    meta: Meta
    analysis_structured: Optional[AnalysisStructured] = None
    google_sheets_row: Optional[GoogleSheetsRow] = None
    notion_markdown: Optional[str] = None
    twitter: Optional[TwitterBundle] = None
