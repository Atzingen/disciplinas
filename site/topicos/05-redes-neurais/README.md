# Redes neurais na prática — PRCCOMP

Fonte da aula: `redes-neurais.ipynb`. A página `index.html` incorpora todas
as células de código e os resultados da execução, com figuras em `imagens/`.
O catálogo do portal e a aula teórica (Tópico 04, slide XOR) apontam para a prática.

## Executar

No Colab, use o link da página ou envie o arquivo `.ipynb`. Localmente, com Python 3.12:

```bash
python -m pip install -r requirements.txt
python -m notebook redes-neurais.ipynb
```

Execute em ordem, a partir de um kernel novo. CPU é suficiente. O download
inicial do MNIST usa o carregador oficial do Keras e seu cache; o dataset não
é versionado no repositório. O Iris acompanha o scikit-learn.

## Atualizar a leitura do site

A partir da raiz do repositório, com o ambiente Python ativado:

```bash
jupyter nbconvert --execute --to notebook --inplace --ExecutePreprocessor.timeout=600 site/topicos/05-redes-neurais/redes-neurais.ipynb
python scripts/redes-neurais/renderizar.py
npm test
```

O renderizador exige células executadas e não aceita saídas de erro. Edite
o notebook, não o bloco entre `notebook:inicio` e `notebook:fim` no HTML.
Mensagens informativas do ambiente aparecem recolhidas no site.

## Execução registrada

Em 23/10/2026, todas as 18 células de código executaram em CPU, com Python
3.12.12, TensorFlow 2.21.0, Keras 3.15.1, scikit-learn 1.9.1 e Matplotlib
3.11.2. O notebook contém as seis figuras produzidas nessa execução.

- Iris: 90 flores no treino, 30 na validação e 30 no teste; média e desvio
  calculados apenas no treino; rede 4 → 8 → 3, 67 parâmetros, 150 épocas.
  Teste: 26 de 30 acertos (86,7%).
- MNIST: 54.000 imagens no treino, 6.000 na validação e 10.000 no teste;
  pixels divididos por 255; Flatten → Dense(32) → Dense(10), 25.450 parâmetros,
  cinco épocas. Teste: 9.618 acertos e 382 erros (96,18%).

Esses números descrevem a execução salva, não metas garantidas. Os exercícios
orientam a comparar modelos na validação; o teste não deve escolher a arquitetura.
Fontes e atribuição do MNIST constam no próprio notebook.

## Verificação da página e triagem visual

Leitura conferida em 1280 px e 390 px, com temas claro e escuro, sem
transbordamento horizontal. As cinco expressões matemáticas renderizaram
sem erros; o HTML preserva as 18 células de código e as seis imagens do notebook.
O download e os links locais foram verificados.

O menu ativo desta página recebeu contraste de 5,19:1 (branco sobre
`#c43d29`). A navegação por âncoras respeita a altura do cabeçalho no celular.
As exceções do detector em `.impeccable/config.json` são locais: fonte,
identificação curricular e papel quadriculado preservam o portal; o texto
em maiúsculas é um rótulo curto; hierarquia tipográfica, bordas de componentes
ausentes e espaçamento da barra foram conferidos no navegador. O alerta
residual de contraste usa a cor global anterior e ignora a sobrescrita local.

Os avisos dos slides do Tópico 04 (contraste, tipografia, bordas e espaçamento)
são preexistentes, permanecem registrados e não foram suprimidos nem ampliaram
o escopo: nessa aula foi alterado somente o parágrafo que leva à nova prática.
