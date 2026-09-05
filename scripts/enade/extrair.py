"""Extract faithful question images and auxiliary text from the six supplied PDFs.

Run with Python + pymupdf 1.28.2 + Pillow. No network access is needed.
The PDF crop is authoritative; extracted text is for searching and accessibility.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pymupdf as pdf
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "site/enade"
EXAMS = [
    dict(id="2024", year=2024, application="regular", title="2024 · Enade", booklet="Tipo 1", first=28, last=63, pages=list(range(22, 46))),
    dict(id="2025-regular", year=2025, application="regular", title="2025 · Aplicação regular", booklet="Tipo 1", first=31, last=80, pages=list(range(20, 40))),
    dict(id="2025-reaplicacao", year=2025, application="reaplicacao", title="2025 · Reaplicação", booklet="Tipo 5", first=31, last=80, pages=list(range(20, 44))),
]

# Visually checked against the supplied answer sheets, including the raster table
# in the 2025 regular PDF. Index 0 corresponds to each exam's first physics item.
ANSWERS = {
    "2024": "D D B C C C D B A A B C C B D A B A C C D A B C A C D A D B A D B A B C".split(),
    "2025-regular": "B B B A D D C B B C D A B D B C D C D C C C B A C C D C C A A D B C A A C C D C B C D C B D D B B A".split(),
    "2025-reaplicacao": "A D D D A A C B C B C C A C B B D B B B A C D B A C C B C D B D C C D D A C A D D C C D A B D D A A".split(),
}
DIGITS = str.maketrans("ϬϭϮϯϰϱϲϳϴϵ", "0123456789")


def heading(text: str) -> tuple[str, list[int]] | None:
    text = text.strip()
    if text.startswith(("QUESTÃO", "Yh\x1c^d\x08K")):
        nums = [int(n) for n in re.findall(r"[0-9]+", text.translate(DIGITS))]
        return ("question", nums) if nums else None
    if text.startswith(("Texto para", "dĞǆƚŽ")):
        return "context", [int(n) for n in re.findall(r"[0-9]+", text.translate(DIGITS))]
    if text.startswith(("Área livre", "\x06ƌĞĂ\x03ůŝǀƌĞ")):
        return "end", []
    return None


def lines(page: pdf.Page) -> list[tuple[pdf.Rect, str]]:
    return [(pdf.Rect(line["bbox"]), "".join(span["text"] for span in line["spans"]))
            for block in page.get_text("dict")["blocks"] if block["type"] == 0
            for line in block["lines"]]


def clean_text(text: str) -> str:
    text = re.sub(r"^Yh[\s\S]*?([Ϭ-ϵ]{2})\s*", lambda m: "QUESTÃO " + m[1].translate(DIGITS) + "\n", text)
    # Remove only known corrupted headings, leaving the original image intact.
    text = "\n".join(line for line in text.splitlines() if not line.startswith(("dĞǆƚŽ", "\x06ƌĞĂ")))
    return text.strip()


def save_segment(page: pdf.Page, box: pdf.Rect, name: str, render: bool) -> dict:
    output = BASE / "imagens" / f"{name}.webp"
    image_width = image_height = 0
    if render:
        pix = page.get_pixmap(matrix=pdf.Matrix(3, 3), clip=box, alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        bounds = ImageChops.difference(image, Image.new("RGB", image.size, "white")).getbbox()
        if bounds:
            x0, y0, x1, y1 = bounds
            image = image.crop((max(0, x0-8), max(0, y0-8), min(image.width, x1+8), min(image.height, y1+8)))
        image.save(output, "WEBP", lossless=True, method=4)
        image_width, image_height = image.size
    elif output.exists():
        with Image.open(output) as image:
            image_width, image_height = image.size
    return dict(src=f"imagens/{name}.webp", page=page.number+1, width=image_width, height=image_height,
                crop=[round(v, 3) for v in box], text=clean_text(page.get_text(clip=box, sort=True)))


def extract(exam: dict, render: bool) -> tuple[list[dict], list[dict]]:
    doc = pdf.open(BASE / "originais" / f"{exam['id']}-prova.pdf")
    questions: dict[int, dict] = {}
    contexts: list[dict] = []
    current = None
    for page_number in exam["pages"]:
        page = doc[page_number-1]
        two_columns = any(abs(draw["rect"].x0-page.rect.width/2) < 5 and draw["rect"].height > 100 and draw["rect"].width < 2 for draw in page.get_drawings())
        bounds = [(28, 544)] if exam["year"] == 2024 else ([(62, 314), (323, 577)] if two_columns else [(62, 577)])
        top, bottom = (55, 744) if exam["year"] == 2024 else (90, 779)
        page_lines = lines(page)
        for left, right in bounds:
            markers = sorted([(box.y0 if heading(text)[0] == "end" else box.y0-2, heading(text)) for box, text in page_lines
                              if left <= box.x0 < right and top <= box.y0 < bottom and heading(text)], key=lambda item: item[0])
            edges = [(top, None), *markers, (bottom, ("end", []))]
            for (y0, mark), (y1, _) in zip(edges, edges[1:]):
                if mark:
                    kind, nums = mark
                    if kind == "end":
                        current = None
                    elif kind == "question":
                        n = nums[0]
                        if not exam["first"] <= n <= exam["last"]:
                            raise ValueError(f"Unexpected question {exam['id']}: {n}")
                        if n in questions:
                            raise ValueError(f"Duplicate question {exam['id']}: {n}")
                        current = dict(id=f"{exam['id']}-q{n}", examId=exam["id"], number=n, kind="objetiva", segments=[])
                        questions[n] = current
                    else:
                        assert len(nums) == 2, (exam["id"], nums)
                        current = dict(id=f"{exam['id']}-contexto-{nums[0]}-{nums[1]}", first=nums[0], last=nums[1], segments=[])
                        contexts.append(current)
                if current is not None and y1-y0 > 5:
                    index = len(current["segments"])+1
                    current["segments"].append(save_segment(page, pdf.Rect(left, max(top, y0), right, min(bottom, y1)), f"{current['id']}-{index}", render))
            # A page/column ending without an explicit "Área livre" may continue
            # the current question/context on the next page/column.
    assert set(questions) == set(range(exam["first"], exam["last"]+1))
    assert len(ANSWERS[exam["id"]]) == len(questions)
    for n, question in questions.items():
        question["contextIds"] = [c["id"] for c in contexts if c["first"] <= n <= c["last"]]
        question["answer"] = ANSWERS[exam["id"]][n-exam["first"]]
        question["solution"] = None
        question["text"] = "\n\n".join(s.pop("text") for s in question["segments"])
    for context in contexts:
        context["text"] = "\n\n".join(s.pop("text") for s in context["segments"])
    result = list(questions.values())
    if exam["id"] == "2024":
        end = next(box.y0-4 for box, text in lines(doc[19]) if text.startswith("Área livre"))
        segment = save_segment(doc[19], pdf.Rect(28, 55, 540, end), "2024-discursiva-1", render)
        result.append(dict(id="2024-discursiva", examId="2024", number=None, kind="discursiva", contextIds=[],
                           text=segment.pop("text"), segments=[segment], answer=None, solution=None))
    return result, contexts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-images", action="store_true")
    parser.add_argument("--ocr", action="store_true", help="Repair corrupted PDF font mappings with Tesseract (por)")
    args = parser.parse_args()
    (BASE / "imagens").mkdir(exist_ok=True)
    result = dict(schemaVersion=1, exams=EXAMS, contexts=[], questions=[])
    for exam in EXAMS:
        questions, contexts = extract(exam, not args.no_images)
        result["questions"].extend(questions)
        result["contexts"].extend(contexts)
        exam["pdf"] = f"originais/{exam['id']}-prova.pdf"
        exam["answerPdf"] = f"originais/{exam['id']}-gabarito.pdf"
        print(exam["id"], len(questions), "questions;", len(contexts), "shared contexts")
    editorial_path = BASE / "classificacao.json"
    if editorial_path.exists():
        editorial = json.loads(editorial_path.read_text())
        assert set(editorial["questions"]) == {q["id"] for q in result["questions"]}
        result["topics"] = editorial["topics"]
        for question in result["questions"]:
            question.update(editorial["questions"][question["id"]])
            question["contextIds"].extend(question.pop("additionalContextIds", []))
    if args.ocr:
        def repair(item: dict) -> None:
            if not re.search(r"[\u0180-\u024f\u03ec-\u03f5\x00-\x08]", item["text"]):
                return
            texts = []
            for segment in item["segments"]:
                # The original PDF crop remains authoritative for figures/formulas.
                process = subprocess.run(["tesseract", str(BASE / segment["src"]), "stdout", "-l", "por", "--psm", "6"], capture_output=True, text=True, check=True, env={**__import__("os").environ, "OMP_THREAD_LIMIT": "1"})
                texts.append(process.stdout.strip())
            item["text"] = "\n\n".join(texts)
            item["textMethod"] = "ocr"
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(repair, [*result["contexts"], *result["questions"]]))
    (BASE / "catalogo.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
    sources = json.loads((BASE / "fontes.json").read_text())
    for source in sources["files"]:
        data = (BASE / source["localPath"]).read_bytes()
        assert data.startswith(b"%PDF-") and len(data) == source["bytes"]
        source["sha256"] = hashlib.sha256(data).hexdigest()
    (BASE / "fontes.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2)+"\n")


if __name__ == "__main__":
    main()
