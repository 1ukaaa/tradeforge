import json, csv
from pathlib import Path
from .schema import ModelOutput

OUT_DIR = Path("out"); OUT_DIR.mkdir(exist_ok=True)

def save_json(data: ModelOutput, fname: str) -> Path:
    p = OUT_DIR / f"{fname}.json"
    p.write_text(data.model_dump_json(indent=2), encoding="utf-8")
    return p

def append_csv(row: dict, fname: str = "journal"):
    csv_path = OUT_DIR / f"{fname}.csv"
    header = ["date","pair","bias","exec_tf","direction","entry_zone","invalidation","targets","comment"]
    exists = csv_path.exists()
    with csv_path.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header)
        if not exists: w.writeheader()
        w.writerow({k: row.get(k,"") for k in header})
