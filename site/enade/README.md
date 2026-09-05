# Enade · Física

Acervo extraído dos seis PDFs fornecidos na
[pasta do Drive](https://drive.google.com/drive/folders/1ZKgPA12woFtIH7I4VIHq8QhmvMk3LUwP),
baixados em 05/09/2026. Os arquivos originais, inclusive Formação Geral,
permanecem em `originais/`; apenas o componente específico de Física entra
no catálogo.

| Caderno | Questões objetivas | Discursivas específicas | Total |
| --- | --- | --- | --- |
| 2024 · Tipo 1 | 28–63 | 1 | 37 |
| 2025 · Regular · Tipo 1 | 31–80 | 0 | 50 |
| 2025 · Reaplicação · Tipo 5 | 31–80 | 0 | 50 |

A numeração de 2024 difere da orientação inicial de 31–80. A discursiva
específica está na página 20 do PDF. As discursivas gerais de 2025 não
fazem parte deste acervo. Não foi fornecido padrão de resposta para a
discursiva de Física de 2024.

## Arquivos

- `fontes.json`: nomes originais, identificadores e links do Drive, tamanhos
  e hashes SHA-256 dos seis PDFs.
- `classificacao.json`: edição manual dos títulos, temas e palavras-chave.
  Questões podem receber vários temas; a classificação é editorial.
- `catalogo.json`: dados gerados consumidos pela página. Cada questão
  possui ID estável, edição, número, tipo, temas, gabarito, recortes e textos-base.
- `imagens/`: recortes WebP sem perdas, renderizados dos PDFs em escala 3×.
  Preservam fórmulas, gráficos, alternativas e continuação de páginas.
- `../../scripts/enade/`: extração e conferência dos limites dos recortes.

Há 34 textos-base compartilhados. Cada questão referencia os textos de que
depende por `contextIds`. As questões 40, 55, 73 e 74 da reaplicação também
remetem explicitamente a textos anteriores; essas associações estão em
`additionalContextIds` na classificação. A questão 50 de 2024 tem duas partes.

O texto extraído serve à busca e à leitura auxiliar. Alguns mapeamentos de
fontes dos PDFs são defeituosos e exigem OCR; fórmulas e figuras devem sempre
ser conferidas nos recortes originais. O gabarito foi transcrito dos arquivos
fornecidos, incluindo a tabela rasterizada da aplicação regular de 2025.

## Regerar e conferir

Na raiz do repositório, com Python e Tesseract disponíveis (idioma `por`):

```sh
python3 -m venv .venv-enade
.venv-enade/bin/pip install -r scripts/enade/requirements.txt
.venv-enade/bin/python scripts/enade/extrair.py --ocr
.venv-enade/bin/python scripts/enade/validar.py
npm test
npm run serve
```

Abra `/enade/` no servidor local. Para aplicar somente alterações editoriais
sem renderizar as imagens novamente, use `extrair.py --no-images --ocr`.
O processo funciona sem consultar o Drive: usa os PDFs versionados.
O script de validação verifica cortes de palavras nas margens inferior e
direita, complementando a revisão visual dos recortes.

## Adicionar resoluções

As 137 questões começam com `solution: null`. Gabarito e resolução são campos
distintos. Para publicar uma resolução, crie sua página e acrescente o campo
abaixo à entrada correspondente de `classificacao.json`:

```json
"solution": { "url": "resolucoes/2024-q28.html" }
```

O caminho é relativo a `site/enade/`. Regere o catálogo e execute os testes.
A página passa a exibir o link e a questão aparece no filtro **Com resolução**.
Não edite apenas o JSON gerado: ele é substituído na próxima extração.

## Navegação

Os filtros podem ser combinados e compartilhados pela URL. Por exemplo:
`?ano=2025&aplicacao=reaplicacao&topico=optica&busca=difracao`.
Uma questão tem link permanente, como `?questao=2024-q50`.
O botão de retorno mantém os filtros; o modo aula amplia a leitura e sai com
Escape. O gabarito começa recolhido e só entra na impressão se estiver aberto.
