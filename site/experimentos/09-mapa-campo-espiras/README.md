# Experimento 09 — Mapeamento 3D do campo de espiras

Página do roteiro com o visualizador dos mapas de campo magnético medidos por um
magnetômetro de três eixos (MLX90393 + ESP32) levado por uma impressora 3D sobre
uma bobina plana. Este arquivo é o contrato entre o software de coleta e o
visualizador: descreve o formato dos arquivos e as convenções de eixos.

## Formato do arquivo (`mapa-campo v1`)

CSV em UTF-8, separador vírgula e ponto decimal. Linhas que começam com `#` são
comentários; as do tipo `# chave: valor` no topo, antes do cabeçalho, são
metadados. Depois do cabeçalho, linhas com `#` são ignoradas.

```text
# formato: mapa-campo v1
# geometria: circulo
# dimensao_mm: 150
# voltas: 20
# corrente_A: 1.000
# leituras_por_ponto: 16
# data: 2026-11-24T14:30:00-03:00
# observacao: texto livre
passada,tipo,t_s,x_mm,y_mm,z_mm,bx_uT,by_uT,bz_uT,sx_uT,sy_uT,sz_uT,n
desligada,ref,0.0,-120.0,-120.0,180.0,12.10,-15.30,-28.40,0.40,0.45,0.50,16
desligada,ponto,3.1,-120.0,-120.0,20.0,10.32,-15.10,-30.55,0.41,0.44,0.52,16
ligada,ponto,2.9,-120.0,-120.0,20.0,11.02,-14.80,-26.10,0.43,0.40,0.49,16
```

### Metadados

| Chave | Significado |
| --- | --- |
| `formato` | sempre `mapa-campo v1` |
| `geometria` | `circulo`, `quadrado`, `u` ou `outra` (sem modelo) |
| `dimensao_mm` | diâmetro do círculo ou lado do quadrado e do U, em mm |
| `voltas` | número de voltas |
| `corrente_A` | corrente da passada ligada, em A |
| `leituras_por_ponto` | leituras médias em cada ponto (o valor de cada linha está em `n`) |
| `data` | data e hora ISO 8601 |
| `observacao` | texto livre |

### Colunas

| Coluna | Significado |
| --- | --- |
| `passada` | `desligada` ou `ligada` |
| `tipo` | `ponto` (grade) ou `ref` (ponto de referência revisitado) |
| `t_s` | segundos desde o início daquela passada |
| `x_mm`, `y_mm`, `z_mm` | posição do sensor, em mm |
| `bx_uT`, `by_uT`, `bz_uT` | média das n leituras, em μT, já nos eixos da impressora |
| `sx_uT`, `sy_uT`, `sz_uT` | desvio padrão das n leituras (não da média), em μT |
| `n` | número de leituras do ponto |

### Convenções

- Origem no centro da bobina; z é a altura do sensor acima do plano da bobina.
  Os eixos x, y e z são paralelos aos X, Y e Z da impressora.
- A bobina fica no plano z = 0. O quadrado tem lados paralelos a X e Y. O U tem
  três lados e o lado aberto voltado para −Y. Os fios de ligação não são
  modelados.
- A corrente positiva circula no sentido anti-horário visto de cima (+z), o que
  dá Bz > 0 no centro. Se o ajuste der k negativo, a corrente circulou no
  sentido contrário.
- As duas passadas podem vir num arquivo só ou em dois. O visualizador junta
  todos os arquivos carregados e lê as colunas pelo nome, em qualquer ordem.
- Os pontos das duas passadas são pareados pela posição arredondada a 0,1 mm.
  Se uma posição aparece duas vezes na mesma passada, vale a primeira.
- O visualizador avisa quando falta o par de um ponto, quando `formato`,
  `geometria`, `dimensao_mm`, `voltas`, `corrente_A` ou `leituras_por_ponto`
  diferem entre arquivos (vale o primeiro), quando faltam colunas (o arquivo é
  ignorado) e quando uma linha tem campos a mais, a menos ou não numéricos (a
  linha é ignorada). `data` e `observacao` podem mudar de um arquivo para outro.

## Processamento

- ΔB = ligada − desligada em cada posição pareada. A incerteza de cada
  componente é `sqrt(s_lig²/n_lig + s_desl²/n_desl)`.
- Correção de deriva (ligada por padrão): em cada passada, as leituras do ponto
  de referência são interpoladas linearmente no tempo e a variação delas em
  torno da média é subtraída de cada leitura. O salto de zero entre as passadas
  é a diferença das médias da referência menos o campo da bobina no ponto de
  referência, calculado pelo modelo com os parâmetros atuais. Se a referência
  estiver em posições diferentes nas duas passadas, só a deriva dentro de cada
  passada é corrigida.
- O ajuste estima k (μ0 medido = k·μ0) e o centro (x0, y0, z0) da bobina por
  mínimos quadrados ponderados sobre as três componentes: k tem solução fechada
  para cada centro e o centro é buscado por Nelder-Mead. A incerteza vem da
  covariância escalonada por χ²/ν.

## Arquivos desta pasta

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | roteiro, fundamentos, formato, visualização e relatório |
| `formato-mapa.js` | leitura do CSV, junção de arquivos e CSV processado |
| `processamento-mapa.js` | pareamento, grade, correção de deriva, ΔB, cortes e perfis |
| `modelo-biot-savart.js` | campo por segmentos retos e fórmulas do eixo |
| `ajuste-mapa.js` | Nelder-Mead e ajuste de k e do centro |
| `dados-exemplo.js` | gerador do exemplo sintético |
| `vista-3d.js` | cena three.js (versão fixada no import map do `index.html`) |
| `cortes-2d.js`, `perfil-1d.js`, `paletas.js` | desenho do corte, do perfil e cores |
| `visualizador-mapa.js` | ligação da aba Visualização com a página |
| `relatorio.md` | modelo de relatório |

Os testes da lógica pura estão em `site/testes/mapa-campo.test.js`
(`npm test` na raiz do repositório).
