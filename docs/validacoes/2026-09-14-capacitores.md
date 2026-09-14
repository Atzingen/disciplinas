# Validação local — experimento 07 (2026-09-14)

## Base sincronizada

- Remoto: `git@github.com:Atzingen/disciplinas.git`.
- `main` atualizado por fast-forward de `0557b53` para `32074b4`.
- Após fetch, `git rev-list --left-right --count HEAD...origin/main`: `0 0`.
- Pages existente: https://atzingen.github.io/disciplinas/.
- Workflow consultado: `34434937747`, concluído com sucesso, commit `32074b4`.
- Catálogo público e local antes da edição: SHA-256
  `cf84db927662cb914eac4833deac8cf836381994e69b4a4cd8ade36c09e4e970`.
- A pasta histórica continua chamada `Eletromagnetismo-aulas`; remoto e README
  identificam o nome atual. O `AGENTS.md` local preexistente foi preservado.

## Material acrescentado

`site/experimentos/07-carga-descarga-capacitores/`: página com quatro abas,
esquema, previsões nominais, sketch, coletor Web Serial, alternativa Python e relatório. Integrado ao
catálogo central e à disciplina PRCLFBE. Base bibliográfica:
https://doi.org/10.1590/S1806-11172011000400018, seções 2.1–2.2; componentes
adaptados para 2.200 µF e 47/56/68 kΩ.

## Evidências de software

- Base anterior: 233 testes aprovados.
- Testes do catálogo falharam com a expectativa do sétimo experimento antes
  da inclusão. O teste do coletor falhou antes de sua implementação.
- Final: `npm test`, 241 testes aprovados, zero falhas; `git diff --check` limpo.
- Coletor: preservação do CSV e rejeição de interrupções, falta de uma fase,
  ADC inválido, tempo repetido e alteração do resistor na mesma aquisição.
- Sketch compilado para `arduino:avr:uno`, core AVR 1.8.8: 2.898 bytes de
  flash e 198 bytes de RAM. Toolchain temporário, sem upload para uma placa.
- Verificação C++ com interface Arduino simulada: saída inicialmente baixa,
  recusa de início com capacitor carregado, amostragem em 20 ms, transição
  em 5τ, encerramento após descarga e comando de interrupção.
- Cálculos independentes: τ = 103,4/123,2/149,6 s; meias-vidas =
  71,671/85,396/103,695 s; duração de cada fase = 517/616/748 s.
- Links relativos do novo HTML resolvem para arquivos existentes.

### Coletor Web Serial

- A página detecta contexto seguro e suporte a `navigator.serial`; em navegador
  incompatível, desativa a conexão e encaminha para a alternativa Python.
- A seleção da porta ocorre no clique em **Conectar Arduino** e abre a conexão
  em 115200 baud. Os controles enviam `i` para iniciar e `x` para interromper.
- A captura valida cabeçalho, fases, tempo crescente, ADC, resistor fixo e o
  marcador final. Dados completos ou parciais permanecem disponíveis para
  download local em CSV; a interface bloqueia a desconexão enquanto houver
  dados ainda não salvos.
- Sete testes específicos cobrem preservação do CSV, interrupção, estados
  inválidos, terminalidade de erros, par incompleto, progresso em 5RC e a
  presença da alternativa Python.

## Navegador

Prévia local servida por `python -m http.server 8767 --bind 127.0.0.1 --directory site`.
Playwright verificou a página original do experimento:

- acesso pelo índice, busca por capacitor e cartão da disciplina PRCLFBE;
- quatro abas com somente um painel visível;
- MathJax e conteúdo Markdown do relatório carregados;
- desktop 1440 × 1000 e celular 390 × 844, sem transbordamento horizontal
  da página nas quatro abas; inspeção visual em temas claro e escuro;
- comando de impressão ativa Relatório e chama `window.print` (substituído
  durante o teste; impressão física e paginação em papel não verificadas);
- arquivos .ino, .py e .md disponíveis por HTTP 200;
- download real do sketch pelo botão, com SHA-256 igual ao fonte:
  `c70992942fdc9fc100a4df0f0660c1d1104a22550e474720e7cdf3cd56a02fe0`.

O preview colaborativo T3 verificou o coletor Web Serial em desktop e em
390 × 844, sem transbordamento horizontal. Uma porta serial simulada confirmou
abertura em 115200 baud, envio de `i`, leitura fragmentada do protocolo, quatro
amostras nas duas fases, habilitação do download, CSV preservado e desconexão.
O navegador do preview expôs `navigator.serial`; a seleção de uma porta USB
física não foi acionada.

## Limites e publicação

O novo experimento está somente no checkout local: nenhum commit, push ou
nova publicação foi executado. O Pages confirmado acima corresponde à base
anterior, não à nova página.

Não houve aquisição com Arduino físico. Fuga e tolerância do eletrolítico,
referência de tensão, impedância dos instrumentos e tempos de bancada precisam
ser avaliados no ensaio piloto. As figuras de curvas são previsões teóricas
explicitamente identificadas; não existem dados experimentais fabricados.
