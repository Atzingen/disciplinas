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
- Visitas à referência idênticas (mesma passada, mesmo `t_s` e mesma posição)
  vindas de arquivos diferentes, como o CSV parcial e o final da mesma coleta,
  contam uma vez só, com aviso.

## Processamento

- ΔB = ligada − desligada em cada posição pareada. A incerteza de cada
  componente é `sqrt(s_lig²/n_lig + s_desl²/n_desl)`.
- Correção de deriva (ligada por padrão): em cada passada, as leituras do ponto
  de referência são interpoladas linearmente no tempo. Com a referência na mesma
  posição nas duas passadas, cada ponto dá
  `relativo = (ligada − ref ligada(t)) − (desligada − ref desligada(t'))`, o
  campo da bobina relativo ao campo dela na referência, sem zero do sensor nem
  fundo e sem depender de modelo. O ajuste compara esse relativo com
  `B(P) − B(ref)`. O ΔB mostrado é `relativo + B_modelo(ref)`, com os parâmetros
  atuais do modelo (só exibição). Sem modelo, ou com a referência em posições
  diferentes, só a deriva dentro de cada passada é corrigida. A incerteza entra
  com o peso de cada visita à referência na interpolação.
- O ajuste estima k (μ0 medido = k·μ0) e o centro (x0, y0, z0) da bobina por
  mínimos quadrados ponderados sobre as três componentes: k tem solução fechada
  para cada centro e o centro é buscado por Nelder-Mead. A incerteza vem da
  covariância escalonada por χ²/ν. O peso de cada componente usa uma incerteza
  de pelo menos metade da mediana, para um ponto com desvio zero não valer mais
  que quatro pontos típicos.

## Coleta (aba Coleta)

A aba Coleta conduz a impressora e lê o sensor pelo Web Serial do navegador
(Chrome, Edge ou Opera no computador; Safari e Firefox não têm). Ela conecta as
duas portas, lê o firmware (`M115`) e o curso do bico (`M211`; na Tycoon Slim,
X de -14 a 240, Y de 0 a 250 e Z de 0 a 300 mm; 240 x 240 x 300 mm se ela não
informar) e roda as duas passadas com pausa, parada e retomada. O andamento fica
salvo no `localStorage` do navegador, e o CSV sai neste formato. "Ver no
visualizador" abre na aba Visualização o que já foi medido.

A montagem é descrita no assistente "Configurar o experimento", em cinco etapas,
cada uma com um desenho feito com os valores digitados: impressora (conexão,
home e a confirmação de que houve home desde que ela foi ligada), sensor no
cabeçote, bobina na mesa, plano e conferência (com o percurso pelos cantos).
Todas as medidas são em mm, nos eixos da impressora; X, Y e Z do Marlin são a
ponta do bico, e Z = 0 é o bico encostado na mesa depois do home.

| Medida | O que é |
| --- | --- |
| `dx`, `dy` | posição do sensor em relação ao bico (sensor em X = bico + dx) |
| `dz` | quanto o sensor fica abaixo da ponta do bico (positivo) |
| `hb` | altura do plano do fio sobre a mesa |
| `xc`, `yc` | centro da bobina, em coordenadas da impressora |

A origem sai dessas medidas (`coleta-setup.js`): com o bico em X0 = xc − dx,
Y0 = yc − dy, o sensor fica sobre o centro da bobina, e com o bico em
Z = hb + dz + z o sensor fica z acima do plano do fio. O centro e o hb também
podem ser tirados da posição da impressora (sensor sobre o centro marcado;
sensor encostado no topo do enrolamento). "Sugerir a partir da bobina" monta uma
grade quadrada de ±(raio + margem), passo de 10 % do diâmetro (5 a 20 mm) e
alturas de 20 a 180 mm, cortada para caber no que o sensor alcança. As medidas,
o firmware e o curso vão para os metadados do CSV (`sensor_dx_mm`,
`sensor_dy_mm`, `sensor_dz_mm`, `bobina_hb_mm`, `bobina_xc_mm`, `bobina_yc_mm`,
`firmware`, `curso`). Mudar qualquer medida depois de concluir pede concluir o
assistente de novo; nenhuma passada começa sem a configuração concluída e sem o
home confirmado.

Em cada ponto a aba envia `G1 X.. Y.. Z.. F..`, `M400` e `G4 P<pausa>` e só então
pede a medida. O primeiro comando só sai depois de 1,5 s sem linhas chegando da
impressora, porque um "ok" atrasado do boot deixaria os seguintes fora de ordem.
Pelo mesmo motivo, um comando sem resposta deixa a conexão "fora de sincronia" e
a aba recusa novos comandos até reconectar; o mesmo vale para uma medida da ESP32
sem resposta, cuja resposta atrasada seria o campo de outro ponto. Só as
mensagens de ocupado do Marlin (`echo:busy`) renovam o prazo de um comando, para
a porta errada (a da ESP32, que não para de mandar linhas) não travar a aba.
"echo:Home XYZ First" (movimento recusado por falta de home) interrompe a
passada, e a posição é conferida com `M114` no primeiro ponto de cada passada e
em cada visita à referência. O primeiro movimento sobe antes de andar no plano e
só então desce.

Uma operação de impressora por vez: movimento manual, home, console e passada
travam os outros botões até terminar. Medidas, eixos da caneta, plano e dados
fixos da bobina ficam congelados do início da primeira passada até "Descartar",
para a passada ligada repetir exatamente a grade da desligada; nada muda antes
de todas as confirmações. A corrente é gravada quando a passada ligada começa e
trava, e a retomada pede a confirmação dessa corrente; a observação continua
editável e fica salva com a coleta. Recomeçar uma passada apaga antes as
medidas dela. Com uma coleta salva, o console recusa os comandos que mudam o
referencial da impressora (G28, G92, M206, M428, M501, M502 e G53 a G59); sem coleta, eles
tiram a confirmação do home (o G28 a refaz). Um home numa coleta ainda sem medidas a desfaz. "Percorrer
os cantos" vai aos cantos da grade de fato medida (com faixa que não é múltipla
do passo, antes do máximo digitado) e confere cada um com `M114`. O ponto de
referência é visitado no começo de uma linha a cada N linhas (padrão 4): o eixo
Z é lento e subir até a referência a cada linha alongaria muito a passada.

Protocolo do sketch `sensor_mlx90393/sensor_mlx90393.ino` (ESP32, 115200):

- `s`: modo silencioso; a placa para de imprimir leituras sozinha.
- `f`: faixa de campo fraco (±4,9 mT em X e Y).
- `r16`: média de 16 leituras (2 a 256), respondida em uma linha
  `med,n,frente,esquerda,cima,s_frente,s_esquerda,s_cima`, em μT, nos eixos da
  caneta, com a calibração gravada aplicada. Com menos de duas leituras válidas
  (sem como estimar o desvio): `erro,leitura`. O número é lido só até o fim da
  linha, para não engolir o comando seguinte.
- O fim do setup imprime `obs: pronto`.

Os eixos da caneta (frente, esquerda, cima) são levados aos eixos da impressora
pela escolha feita na aba (por exemplo frente = +Y, esquerda = −X, cima = +Z).
No Linux, o usuário precisa estar no grupo `uucp` (Arch) ou `dialout` (Debian,
Ubuntu) para abrir as portas.

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
| `coleta-mapa.js` | ligação da aba Coleta com a página |
| `coleta-marlin.js`, `coleta-sensor.js`, `coleta-serial.js` | conversa com o Marlin, com a ESP32 e com a porta Web Serial |
| `coleta-varredura.js` | plano da varredura, limites, eixos, CSV e execução de uma passada |
| `coleta-setup.js` | medidas da montagem, origem, alcance do sensor e plano sugerido |
| `coleta-desenhos.js` | desenhos SVG das etapas do assistente |
| `sensor_mlx90393/sensor_mlx90393.ino` | sketch da ESP32 com o MLX90393 |
| `relatorio.md` | modelo de relatório |

Os testes da lógica pura estão em `site/testes/mapa-campo.test.js`,
`site/testes/coleta-mapa-campo.test.js` e `site/testes/coleta-setup.test.js`
(`npm test` na raiz do repositório).
