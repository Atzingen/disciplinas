"""Atualiza a leitura dos notebooks dentro do capítulo 3, sem executá-los.

Use o ambiente dos notebooks (nbconvert). Execute a partir de qualquer pasta.
"""
from pathlib import Path
import base64
import html
import json
import re
import struct

from nbconvert.filters.markdown import markdown2html

ROOT = Path(__file__).resolve().parents[2]
TOPIC = ROOT / "site/topicos/02-visao-computacional"
PAGE = TOPIC / "03-convolucao-redes/index.html"
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")


def text(value: str | list[str]) -> str:
    return "".join(value) if isinstance(value, list) else value


def pre(value: str) -> str:
    cleaned = ANSI.sub("", value).replace("\r", "\n")
    return '<pre class="vision-code vision-output">' + html.escape(cleaned) + '</pre>'


def render(path: Path) -> str:
    notebook = json.loads(path.read_text())
    name = path.stem
    pieces = [f'<article class="vision-notebook" data-notebook="{name}">']
    pieces.append('<p class="vision-notebook-intro">A prática completa está abaixo: explicação, código e resultados da execução.</p>')
    heading = name
    figure_number = 0
    for index, cell in enumerate(notebook["cells"]):
        source = text(cell["source"])
        if cell["cell_type"] == "markdown":
            headings = re.findall(r"^#+ (.+)$", source, re.M)
            if headings:
                heading = headings[-1]
            rendered = str(markdown2html(source))
            rendered = re.sub(r'<a class="anchor-link".*?</a>', '', rendered)
            rendered = re.sub(r' id="[^"]*"', '', rendered)
            rendered = re.sub(r'<(/?)h([1-6])', lambda m: f'<{m[1]}h{min(int(m[2])+2,6)}', rendered)
            pieces.append(rendered)
        elif cell["cell_type"] == "code":
            pieces.append(f'<div class="vision-cell" data-cell="{index}"><p class="vision-cell-label">Código · célula {cell["execution_count"]}</p>')
            pieces.append('<pre class="vision-code"><code class="language-python">' + html.escape(source) + '</code></pre>')
            for output in cell.get("outputs", []):
                data = output.get("data", {})
                if "image/png" in data:
                    figure_number += 1
                    relative = f'imagens/notebooks/{name}-{figure_number:02}.png'
                    image = TOPIC / relative
                    image.parent.mkdir(parents=True, exist_ok=True)
                    png = base64.b64decode(text(data["image/png"]))
                    image.write_bytes(png)
                    width, height = struct.unpack(">II", png[16:24])
                    caption = f'{heading} — resultado da execução'
                    pieces.append(f'<figure class="vision-figure"><img src="../{relative}" loading="lazy" width="{width}" height="{height}" alt="{html.escape(caption, quote=True)}"><figcaption>{html.escape(caption)}</figcaption></figure>')
                elif "application/vnd.jupyter.widget-view+json" in data:
                    pieces.append('<p class="vision-widget-note">Este controle Python funciona ao executar o notebook no Jupyter. As figuras desta página mostram os resultados salvos; a demonstração no início do capítulo permite experimentar no navegador.</p>')
                elif "text/plain" in data:
                    pieces.append(pre(text(data["text/plain"])))
                elif output.get("output_type") == "stream":
                    block = pre(text(output["text"]))
                    if output.get("name") == "stderr":
                        block = '<details class="vision-environment"><summary>Mensagens do ambiente da execução</summary>' + block + '</details>'
                    pieces.append(block)
            pieces.append('</div>')
    pieces.append(f'<p><a class="vision-download" href="../notebooks/{name}.ipynb" download>Baixar esta prática como notebook (.ipynb)</a></p></article>')
    return '\n'.join(pieces)


page = PAGE.read_text()
for path in sorted((TOPIC / "notebooks").glob("*.ipynb")):
    name = path.stem
    start = f'<!-- notebook:{name}:inicio -->'
    end = f'<!-- notebook:{name}:fim -->'
    block = start + '\n' + render(path) + '\n' + end
    pattern = re.escape(start) + r'.*?' + re.escape(end)
    if start in page:
        page, count = re.subn(pattern, lambda m: block, page, flags=re.S)
    else:
        pattern = r'<article class="vision-notebook">(?:(?!</article>).)*href="../notebooks/' + re.escape(name) + r'\.ipynb".*?</article>'
        page, count = re.subn(pattern, lambda m: block, page, flags=re.S)
    assert count == 1, f'Esperava uma seção para {name}; achei {count}'
PAGE.write_text(page)
print('Quatro práticas incorporadas ao capítulo 3.')
