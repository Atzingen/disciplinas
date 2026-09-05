"""Check that original PDF words are not cut at the crop boundaries."""
from __future__ import annotations

import json
from pathlib import Path

import pymupdf as pdf

BASE = Path(__file__).resolve().parents[2] / "site/enade"
data = json.loads((BASE / "catalogo.json").read_text())
docs = {exam["id"]: pdf.open(BASE / exam["pdf"]) for exam in data["exams"]}
failures = []
for item in data["questions"] + data["contexts"]:
    exam = item.get("examId") or next(key for key in docs if item["id"].startswith(key+"-contexto"))
    for segment in item["segments"]:
        rect = pdf.Rect(segment["crop"])
        for word in docs[exam][segment["page"]-1].get_text("words"):
            box = pdf.Rect(word[:4])
            if not rect.intersects(box):
                continue
            if (box.y0 < rect.y1-2 and box.y1 > rect.y1+1 and rect.x0 <= box.x0 and box.x1 <= rect.x1):
                failures.append((item["id"], "bottom", word[4]))
            if box.x0 < rect.x1-2 and box.x1 > rect.x1+1 and rect.y0 <= box.y0 and box.y1 <= rect.y1:
                failures.append((item["id"], "right", word[4]))
assert not failures, f"Clipped words ({len(failures)}): {failures[:30]}"
print("No clipped words at bottom/right boundaries in all question and context segments.")
