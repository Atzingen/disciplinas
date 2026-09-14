# Relatório — Experimento 7: carga e descarga de capacitores

> Este documento orienta a redação do relatório. Os tempos nominais são previsões;
> não são dados experimentais. Substitua os campos em branco por medições e
> argumentos do grupo. Anexe os três CSV originais, inclusive os pontos que não
> forem usados nos ajustes. Identifique separadamente qualquer coleta parcial.

## Identificação

**Curso/turma:** ____________________

**Data, grupo e integrantes:** ____________________

**Arduino, computador, multímetro e capacímetro utilizados:** ____________________

**Capacitor: fabricante, série, capacitância, tensão nominal e tolerância:** ____________________

## Resumo

Redija depois da análise um parágrafo que apresente a pergunta investigada,
a montagem, a aquisição de dados e os principais resultados quantitativos.
Informe a faixa de resistências e o capacitor mantido fixo. Apresente as
meias-vidas medidas com suas incertezas e declare se a proporcionalidade
entre constante de tempo e resistência foi sustentada. Não use apenas
expressões como “o resultado foi satisfatório”: cite números e limitações.

## Questão investigativa e previsão

Como a resistência altera a carga e a descarga do mesmo capacitor? A hipótese
ideal prevê uma constante de tempo proporcional à resistência e a mesma
constante para as duas fases de cada par. Registre antes da coleta qual
resistor deve produzir a curva mais lenta e qual deve dar a maior corrente
inicial. Explique por que o valor final ideal da tensão não depende de R.

Neste roteiro, o capacitor nominal é **2.200 µF** e os resistores são **47 kΩ,
56 kΩ e 68 kΩ**. As meias-vidas nominais ficam entre um e dois minutos.
A duração de cada aquisição não é a meia-vida: cada fase acompanha cinco
constantes de tempo. Os três pares completos representam aproximadamente
63 minutos de registro, sem incluir montagem e trocas.

| R nominal (kΩ) | R medido (kΩ) | τ nominal (s) | t₁/₂ nominal (s) | Cada fase: 5τ (s) |
| --- | --- | --- | --- | --- |
| 47 | ______ | 103,4 | 71,7 | 517 |
| 56 | ______ | 123,2 | 85,4 | 616 |
| 68 | ______ | 149,6 | 103,7 | 748 |

Recalcule as previsões com os valores medidos, caso disponíveis. Declare
se a capacitância usada é nominal, medida por capacímetro ou estimada de um
ajuste. Não utilize a capacitância extraída de uma curva como uma medição
independente para “validar” essa mesma curva.

## Referencial teórico

Desenvolva a equação diferencial a partir da lei das malhas e da relação
entre corrente e tensão no capacitor. Para cada fase, a fonte é constante:

\[
\begin{aligned}
V_s&=Ri+V_C, & i&=C\frac{dV_C}{dt},\\
RC\frac{dV_C}{dt}+V_C&=V_s, & \tau&=RC,\\
V_C(t)&=V_\infty+(V_0-V_\infty)e^{-t/\tau}.
\end{aligned}
\]

Explique o significado e a unidade de cada grandeza. Na carga ideal iniciada
em zero, V∞ corresponde ao nível alto de D8; na descarga ideal, corresponde
a zero. O programa muda a saída digital, mas mantém o mesmo caminho através
do resistor. O capacitor não troca de polaridade durante a descarga.

Demonstre a relação da meia-vida com a constante de tempo:

\[
\frac{|V_C(t_{1/2})-V_\infty|}{|V_0-V_\infty|}=\frac12,
\qquad t_{1/2}=RC\ln2.
\]

Na carga, a quantidade que se reduz pela metade é a distância restante até
o patamar. Com tensão inicial diferente de zero, a tensão no instante da
meia-vida é (V₀ + V∞)/2, e não necessariamente V∞/2. Explique também os
percentuais em τ e em 5τ. Compare carga elétrica Q = CV꜀, tensão medida e
corrente inferida por i = (Vₛ − V꜀)/R; não chame a leitura do ADC de medição
direta de carga elétrica.

## Materiais e métodos

Descreva a montagem realmente utilizada e inclua fotografia ou esquema com
os pinos identificados: D8, resistor escolhido, nó A0/positivo do capacitor,
negativo e GND. Informe a alimentação USB, o modelo da placa e a tensão
medida de referência. Registre a polaridade do eletrolítico e o procedimento
de descarga antes de manusear a montagem.

A descarga inicial utiliza um resistor auxiliar de 1 kΩ em paralelo com o
capacitor durante pelo menos 15 segundos, seguida da confirmação de tensão
inferior a 0,05 V. O auxiliar é retirado antes de registrar a curva. Explique
como deixá-lo conectado alteraria drasticamente a resistência equivalente.
Não faça curto no capacitor para descarregá-lo e não o descarregue através
de uma placa sem alimentação.

Registre a versão do sketch, o valor de RESISTOR_OHM em cada envio e os nomes
dos arquivos. O intervalo nominal é 20 ms e a velocidade serial é 115200 baud.
O programa aguarda o comando de início, verifica a tensão inicial e executa
carga por 5τ nominal, seguida de descarga por 5τ nominal. O tempo é reiniciado
na transição. O mesmo capacitor permanece instalado nos três pares, enquanto
o resistor e sua identificação no código são alterados com a montagem
apropriadamente descarregada e desenergizada.

Informe também o método de aquisição: coletor Web Serial da própria página ou
o script Python. No navegador, registre o navegador e a versão usados e baixe o
CSV antes de desconectar ou iniciar outro par. O seletor de porta depende de um
clique do usuário e de uma página em HTTPS ou localhost. Em ambos os métodos,
preserve a saída serial recebida sem substituir os tempos reais por uma grade
ideal de 20 ms.

Caso alguma parte do procedimento tenha sido modificada, descreva a alteração
com sua justificativa. Informe se houve reinicialização, perda de comunicação,
ensaio descartado ou necessidade de prolongar a fase para investigar o patamar.
Não omita ocorrências relevantes para interpretar os resultados.

## Dados brutos

Anexe **R47k.csv, R56k.csv e R68k.csv**, ou os nomes equivalentes adotados pelo
grupo. Cada CSV contém as colunas fase, t_ms, adc e r_nominal_ohm. Diferencie
o valor nominal registrado pelo programa da resistência medida na bancada.

| Arquivo | R nominal/medido | N carga | N descarga | Maior Δt (ms) | Completo ou parcial |
| --- | --- | --- | --- | --- | --- |
| ______ | ______ | ______ | ______ | ______ | ______ |
| ______ | ______ | ______ | ______ | ______ | ______ |
| ______ | ______ | ______ | ______ | ______ | ______ |

Conserve os tempos reais e os inteiros do ADC sem arredondamento adicional.
Verifique monotonicidade do tempo dentro de cada fase, duração e presença
 das duas fases. O reinício do tempo na passagem da carga para a descarga é
esperado; uma regressão de tempo dentro da mesma fase não é.

Informe a alimentação e os níveis alto e baixo de D8 medidos antes/depois
dos ensaios. Se um multímetro ficou conectado ao capacitor durante a coleta,
registre sua impedância de entrada: ela faz parte do circuito. Discuta sua
influência, mesmo quando for considerada pequena.

## Tratamento e análise

Converta t_ms em segundos. Para a tensão, indique a referência usada na
aproximação V꜀ = ADC × Vref/1023 e a resolução nominal de cerca de 4,88 mV
para Vref = 5 V. O código do ADC não fornece mais resolução porque a curva
contém milhares de pontos. Não acrescente casas decimais sem justificativa.

Produza dois gráficos principais: um com as três curvas de carga e outro com
as três de descarga. Mostre unidades, legenda com a resistência medida,
pontos experimentais e curvas ajustadas. Diferencie dados reais de previsão
ideal e use uma escala que permita comparar os tempos. É possível reduzir
os marcadores visíveis para legibilidade sem apagar pontos do arquivo bruto.

Ajuste cada curva à forma geral exponencial, com V₀ e V∞ apropriados a cada
fase. Não imponha 5 V como início da descarga, pois a carga anterior é finita
e pode sofrer fuga. Não adote automaticamente a última amostra como patamar
assintótico exato. Apresente o método de ajuste, os parâmetros livres, os
intervalos utilizados, as incertezas e eventuais restrições físicas.

| R medido (kΩ) | Fase | τ ± uτ (s) | t₁/₂ ± u (s) | V₀ / V∞ (V) | τ/R (µF) |
| --- | --- | --- | --- | --- | --- |
| ______ | Carga | ______ | ______ | ______ | ______ |
| ______ | Descarga | ______ | ______ | ______ | ______ |
| ______ | Carga | ______ | ______ | ______ | ______ |
| ______ | Descarga | ______ | ______ | ______ | ______ |
| ______ | Carga | ______ | ______ | ______ | ______ |
| ______ | Descarga | ______ | ______ | ______ | ______ |

Para uma verificação independente da leitura do parâmetro, estime graficamente
a meia-vida pelo cruzamento de (V₀ + V∞)/2, interpolando entre os pontos
vizinhos e discutindo o ruído. Essa estimativa ainda depende dos patamares
utilizados; ela não é inteiramente independente do ajuste se os patamares
vierem dele. Compare o resultado com τ ln 2.

Apresente também a linearização:

\[
\begin{aligned}
y(t)&=\ln\left|\frac{V(t)-V_\infty}{V_0-V_\infty}\right|
=-\frac{t}{\tau},\\
m&=-\frac1\tau, & t_{1/2}&=-\frac{\ln2}{m}.
\end{aligned}
\]

Não tome logaritmo de zero. Pontos cuja diferença até o patamar é dominada
por quantização ou ruído devem ficar fora da linearização, com critério
explicitado. A transformação muda a distribuição de erros e amplifica o
ruído no final; compare a reta com o ajuste exponencial na escala original.
Mostre resíduos em função do tempo e não se limite a informar R².

Compare τ/R entre as seis curvas. No modelo ideal, essa razão estima a
capacitância. Faça também o gráfico τ versus R: a inclinação esperada é C,
e o intercepto ideal é zero. Com apenas três resistências, a inferência sobre
linearidade é limitada; discuta a dispersão e as incertezas sem exagerar a
força da evidência.

## Incertezas e adequação do modelo

Separe tolerância nominal, incerteza instrumental e incerteza de ajuste.
Uma tolerância de fabricante não é automaticamente uma incerteza-padrão;
explique a distribuição assumida se fizer a conversão. Para grandezas
independentes, a propagação ideal fornece:

\[
\left(\frac{u_\tau}{\tau}\right)^2=
\left(\frac{u_R}{R}\right)^2+\left(\frac{u_C}{C}\right)^2,
\qquad u_{t_{1/2}}=(\ln2)u_\tau.
\]

Considere a quantização, a referência de tensão, os tempos reais, a repetição
de códigos, a deriva e a correlação entre amostras próximas. Compare um ajuste
com todos os pontos e outro com um ponto a cada aproximadamente 100 ms,
preservando os originais. A maior contagem de leituras não corrige fuga nem
substitui repetição independente do ensaio.

Avalie a hipótese de fuga por uma resistência Rₗ em paralelo com C. Nesse
modelo, τef = (R ∥ Rₗ)C e V∞,carga = Vₛ Rₗ/(R + Rₗ). A razão τ/R deixa de
representar diretamente C. Se houver patamar reduzido ou desvio sistemático,
discuta se o modelo de fuga constante é adequado; a fuga real pode variar
com a tensão e com o tempo de polarização do eletrolítico.

## Discussão

1. As seis meias-vidas medidas ficaram entre 60 e 120 s? Se não, qual desvio
   das condições nominais explica os dados, e qual evidência sustenta isso?
2. Para cada resistor, carga e descarga forneceram τ compatíveis dentro das
   incertezas? Compare numericamente, sem atribuir toda diferença a “erro humano”.
3. O resistor maior mudou principalmente a velocidade, o patamar ou ambos?
   Compare essa observação com os modelos ideal e com fuga.
4. As capacitâncias estimadas concordam entre si e com uma medida independente?
   Se não houver capacímetro, explicite que não houve essa verificação.
5. Por que a carga chega a 75% da variação total após duas meias-vidas,
   enquanto a descarga ideal conserva 25% da tensão inicial?
6. Uma coleta de dois minutos mostraria toda a curva destes circuitos?
   Use RC e o valor exponencial para justificar a resposta.
7. Quais efeitos permanecem ao aumentar a taxa de aquisição? Em que situação
   faria mais sentido repetir o ensaio do que acrescentar mais pontos?
8. O circuito, os arquivos e a análise permitiriam a outra equipe reproduzir
   o procedimento? Identifique informações que ainda faltariam.

## Conclusão

Retome a hipótese e cite as seis meias-vidas, a compatibilidade entre carga
e descarga e a relação observada entre τ e R. Indique a faixa de capacitância
estimada apenas quando o modelo utilizado permitir essa interpretação.
Distinga o que foi medido, o que foi inferido e o que permanece hipótese.

Encerre com as limitações sustentadas pelos resíduos e pelas condições reais
da bancada. Proponha uma melhoria concreta, como selecionar um capacitor
com menor fuga, medir a capacitância independentemente ou repetir os ensaios
para avaliar a dispersão. Evite concluir apenas que “a teoria foi comprovada”.

## Referências

CAVALCANTE, Marisa Almeida; TAVOLARO, Cristiane Rodrigues Caetano; MOLISANI,
Elio. **Física com Arduino para iniciantes**. Revista Brasileira de Ensino de
Física, v. 33, n. 4, 4503, 2011.
https://doi.org/10.1590/S1806-11172011000400018.

A sequência de aquisição e chaveamento se baseia nas seções 2.1–2.2 do artigo.
Os componentes de 2.200 µF e 47/56/68 kΩ, o intervalo de 20 ms e os arquivos
CSV são adaptações deste roteiro. Informe também as referências dos
instrumentos, da placa e do software efetivamente utilizados.

## Checklist de entrega

- [ ] identificação completa e esquema/fotografia com polaridade;
- [ ] resistores medidos e especificação do mesmo capacitor nos três pares;
- [ ] previsões registradas antes dos ensaios;
- [ ] três CSV completos preservados e coletas parciais identificadas;
- [ ] três curvas de carga e três de descarga com unidades e legendas;
- [ ] seis ajustes exponenciais, parâmetros e resíduos;
- [ ] meias-vidas por ajuste e por cruzamento do nível intermediário;
- [ ] linearizações com critérios de seleção de pontos;
- [ ] comparação de τ/R e gráfico τ versus R;
- [ ] discussão de tolerância, quantização, fuga e referência de tensão;
- [ ] conclusão quantitativa e referências.
