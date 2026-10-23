"""Atualiza a página a partir do notebook executado, preservando código e saídas."""

import base64
import html
from pathlib import Path
import re
import struct

import nbformat
from nbconvert.filters.markdown import markdown2html

TOPICO = Path(__file__).resolve().parents[2] / "site/topicos/05-redes-neurais"
notebook = nbformat.read(TOPICO / "redes-neurais.ipynb", as_version=4)
nbformat.validate(notebook)
partes: list[str] = []
titulo = "Redes neurais na prática"
figura = 0

for celula in notebook.cells:
    if celula.cell_type == "markdown":
        titulos = re.findall(r"^#+ (.+)$", celula.source, flags=re.M)
        if titulos:
            titulo = titulos[-1]
        trecho = str(markdown2html(celula.source))
        trecho = re.sub(r"<h1\b.*?</h1>", "", trecho, flags=re.S)
        trecho = re.sub(r'<a class="anchor-link".*?</a>', "", trecho)
        partes.append(trecho)
    elif celula.cell_type == "code":
        assert isinstance(celula.execution_count, int), "Execute todas as células antes de renderizar."
        partes.append(f'<div class="notebook-cell"><p class="cell-label">Célula {celula.execution_count}</p>')
        partes.append('<pre class="notebook-code"><code class="language-python">'
                      + html.escape(celula.source) + '</code></pre>')
        saidas: list[str] = []
        for saida in celula.outputs:
            assert saida.output_type != "error", "O notebook contém erro de execução."
            dados = saida.get("data", {})
            if "image/png" in dados:
                figura += 1
                caminho = f"imagens/figura-{figura:02}.png"
                destino = TOPICO / caminho
                destino.parent.mkdir(exist_ok=True)
                png = base64.b64decode(dados["image/png"])
                destino.write_bytes(png)
                largura, altura = struct.unpack(">II", png[16:24])
                legenda = html.escape(f"{titulo} — resultado desta execução", quote=True)
                saidas.append(f'<figure><img src="{caminho}" width="{largura}" height="{altura}" '
                              f'loading="lazy" alt="{legenda}"><figcaption>{legenda}</figcaption></figure>')
            elif saida.output_type == "stream" or "text/plain" in dados:
                texto = saida.get("text", dados.get("text/plain", ""))
                texto = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", texto)
                bloco = '<pre class="notebook-output">' + html.escape(texto) + '</pre>'
                if saida.get("name") == "stderr":
                    bloco = '<details><summary>Mensagens do ambiente</summary>' + bloco + '</details>'
                saidas.append(bloco)
        partes.append("\n".join(saidas).replace('</pre>\n<pre class="notebook-output">', ''))
        partes.append('</div>')

pagina = TOPICO / "index.html"
bloco_notebook = "\n".join(partes)
conteudo, quantidade = re.subn(
    r"<!-- notebook:inicio -->.*?<!-- notebook:fim -->",
    lambda _: "<!-- notebook:inicio -->\n" + bloco_notebook + "\n<!-- notebook:fim -->",
    pagina.read_text(encoding="utf-8"), flags=re.S,
)
assert quantidade == 1, "Esperava um bloco para a leitura do notebook."
pagina.write_text(conteudo, encoding="utf-8")
print(f"Página atualizada: {len(notebook.cells)} células e {figura} figuras.")
