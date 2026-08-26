# Relatório — Experimento 6: cuba eletrolítica e mapa de potencial

> Preencha somente com observações e medições realizadas pelo grupo. Não
> substitua pontos esquecidos por valores teóricos, médias ou interpolações. A
> matriz completa de potenciais é o dado bruto central deste experimento e deve
> ser preservada junto com a ordem de coleta. A interpolação é permitida apenas
> depois da coleta, para construir curvas entre pontos efetivamente medidos.

## Identificação

**Curso/turma:** ________________________

**Data:** ____/____/________

**Grupo:** ____________________

**Integrantes:** ________________________

**Bancada, fontes e voltímetro (modelos e números de patrimônio):**

________________________________________________________________________________

**Solução utilizada e altura aproximada da coluna líquida:**

________________________________________________________________________________

## Questão investigativa, hipótese e previsão

Três eletrodos cilíndricos são mantidos em potenciais constantes de referência:
\(E_0=0\,\mathrm{V}\) (ground, ou terra de referência),
\(E_5=5\,\mathrm{V}\) e
\(E_{10}=10\,\mathrm{V}\). Eles são posicionados sobre cruzamentos da malha,
formando um triângulo, com separação centro a centro de pelo menos sete
divisões entre **cada par**. A questão investigativa é: como o potencial
\(V(x,y)\) se distribui na solução condutora dentro e ao redor desse triângulo,
e em que medida o mapa experimental permite recuperar as propriedades
esperadas do campo elétrico estacionário?

A hipótese de trabalho é que, afastado das superfícies metálicas e das paredes
da cuba, o potencial varia suavemente, não apresenta máximos ou mínimos locais
isolados e satisfaz aproximadamente a equação de Laplace. Espera-se que as
curvas equipotenciais sejam contínuas, que fiquem mais próximas onde o módulo
do campo é maior e que os vetores obtidos por
\(\vec E=-\nabla V\) as cruzem perpendicularmente. Também se espera que os
maiores valores de potencial ocorram junto ao eletrodo de 10 V e os menores
junto ao de 0 V, sem que isso implique uma interpolação linear simples entre
os três centros: a geometria circular dos eletrodos e as paredes finitas
deformam o mapa.

Antes de energizar, anexe um esboço da previsão sobre uma cópia da malha.
Identifique os três eletrodos, desenhe as curvas previstas de 1 V a 9 V e
marque pelo menos cinco vetores de campo com sentido estimado. Indique no
desenho onde você prevê:

1. maior módulo de \(\vec E\);
2. maior espaçamento entre equipotenciais;
3. maior influência das paredes da cuba;
4. uma região cujo potencial esteja próximo de 5 V sem tocar \(E_5\).

Não redesenhe essa previsão depois das medidas. A comparação entre previsão e
resultado faz parte da análise.

## Segurança e integridade da montagem

Confirme cada item antes de ligar as fontes:

- [ ] a cuba está estável, seca por fora e afastada das fontes e tomadas;
- [ ] foi usada somente a solução fornecida ou autorizada pelo professor;
- [ ] os três eletrodos foram posicionados e fixados com as fontes desligadas;
- [ ] as saídas usadas são isoladas ou foram explicitamente aprovadas para
  compartilhar a mesma referência;
- [ ] o eletrodo de 0 V e o terminal COM do voltímetro estão ligados ao mesmo
  ponto de referência;
- [ ] as saídas foram ajustadas e conferidas em 5,00 V e 10,00 V em relação à
  referência, e não simplesmente copiadas dos displays fotografados;
- [ ] foi configurado um limite de corrente compatível com o equipamento,
  conforme orientação do professor;
- [ ] o teste inicial energizado durou apenas 5–10 s;
- [ ] não houve aquecimento, corrente anormal, bolhas persistentes, mudança de
  cor ou odor;
- [ ] o grupo sabe onde desligar imediatamente as duas saídas.

Durante a coleta, não toque na solução nem nos eletrodos energizados. Mantenha
a ponta de prova pelo cabo isolante, evite raspar a malha e faça pausas para
reduzir eletrólise e polarização. Se ocorrer derramamento, desligue as fontes
antes de limpar e comunique o professor. Registre qualquer desvio dessas
condições, mesmo que a coleta tenha sido concluída.

## Preparação geométrica e fundamentos

### Coordenadas e distância entre os eletrodos

Defina \(\Delta\) como o passo físico da malha, isto é, a distância entre dois
traços consecutivos. Use as coordenadas impressas na cuba ou estabeleça uma
origem e um sentido positivo para cada eixo. Em unidades de divisão da malha,
a separação entre os centros \(i\) e \(j\) é

$$
\begin{aligned}
d_{ij}
&=\Delta\sqrt{(x_i-x_j)^2+(y_i-y_j)^2},\\
\frac{d_{ij}}{\Delta}
&=\sqrt{(x_i-x_j)^2+(y_i-y_j)^2}\geq 7.
\end{aligned}
$$

Calcule e registre as três distâncias:
\(d_{0,5}\), \(d_{0,10}\) e \(d_{5,10}\). A condição precisa ser atendida por
todas elas. Contar sete linhas atravessadas não é suficiente: conte sete
**intervalos** ou use a expressão acima.

### Quadrado de varredura

O domínio medido é o menor quadrado alinhado à malha que contém os três centros
e deixa pelo menos duas divisões completas de margem em cada um dos quatro
lados. Determine primeiro as extensões dos centros,

$$
\begin{aligned}
L_x &= x_{\max}-x_{\min},\\
L_y &= y_{\max}-y_{\min}.
\end{aligned}
$$

O lado do quadrado, em número de intervalos, deve satisfazer

$$
N\geq \max(L_x,L_y)+4.
$$

As quatro divisões adicionais representam duas antes e duas depois dos
eletrodos extremos. Se \(L_x\neq L_y\), amplie a direção menor, repartindo as
divisões extras entre suas duas bordas, até que as duas direções tenham \(N\)
intervalos. O quadrado contém \((N+1)^2\) cruzamentos. Pontos cobertos pelas
bases metálicas são registrados como condição de fronteira; os demais devem
receber uma leitura. Portanto, o número de pontos ausentes ao final deve ser
zero.

### Por que a cuba representa um problema eletrostático

Na solução condutora, em regime aproximadamente estacionário, a densidade de
corrente está relacionada ao campo por \(\vec J=\sigma\vec E\). A conservação
de carga exige \(\nabla\cdot\vec J=0\) fora dos eletrodos. Admitindo
condutividade \(\sigma\) aproximadamente uniforme e usando
\(\vec E=-\nabla V\),

$$
\begin{aligned}
\nabla\cdot\vec J &= 0,\\
\nabla\cdot(-\sigma\nabla V) &= 0,\\
\nabla^2V &= 0.
\end{aligned}
$$

Assim, o mesmo problema matemático que descreve o potencial eletrostático em
uma região sem carga volumétrica descreve o potencial estacionário medido na
cuba. Os cilindros impõem condições de Dirichlet — valores fixos de \(V\) —
enquanto as paredes isolantes e a profundidade finita introduzem condições de
contorno adicionais. A analogia é forte, mas não perfeita: há corrente real,
reações eletroquímicas possíveis e uma geometria tridimensional de pequena
espessura.

### Equipotenciais e campo elétrico

Ao longo de uma curva equipotencial, \(dV=0\). Como

$$
dV=-\vec E\cdot d\vec\ell,
$$

o campo é perpendicular ao deslocamento tangente à curva. Seu sentido é do
maior para o menor potencial. Em uma malha quadrada de passo físico
\(\Delta\), use diferenças centrais nos pontos internos:

$$
\begin{aligned}
E_x(i,j)&\approx-
\frac{V_{i+1,j}-V_{i-1,j}}{2\Delta},\\
E_y(i,j)&\approx-
\frac{V_{i,j+1}-V_{i,j-1}}{2\Delta},\\
|\vec E(i,j)|&=
\sqrt{E_x(i,j)^2+E_y(i,j)^2}.
\end{aligned}
$$

Converta \(\Delta\) para metros antes do cálculo para expressar o resultado em
\(\mathrm{V/m}\), equivalente a \(\mathrm{N/C}\). Próximo à borda do quadrado,
onde um dos vizinhos externos não foi medido, use diferença progressiva ou
regressiva e identifique essa aproximação como menos precisa.

### Teste discreto da equação de Laplace

Para uma malha quadrada e um ponto interior afastado dos cilindros, a equação
de Laplace implica aproximadamente a propriedade do valor médio:

$$
V_{i,j}\approx
\frac{V_{i+1,j}+V_{i-1,j}+V_{i,j+1}+V_{i,j-1}}{4}.
$$

Defina o resíduo local

$$
r_L(i,j)=V_{i,j}-
\frac{V_{i+1,j}+V_{i-1,j}+V_{i,j+1}+V_{i,j-1}}{4}.
$$

Um resíduo próximo de zero é compatível com o modelo, mas precisa ser
comparado à resolução, à repetibilidade e à deriva temporal. Calcule ainda o
resíduo quadrático médio para os \(M\) pontos escolhidos:

$$
r_{\mathrm{RMS}}=
\sqrt{\frac{1}{M}\sum_{m=1}^{M}r_{L,m}^2}.
$$

## Procedimento executado e controles experimentais

Descreva o que foi realmente feito, incluindo qualquer correção de ligação,
reposicionamento ou pausa:

1. Meça o passo físico \(\Delta\) da malha com uma régua, preferencialmente
   sobre dez intervalos e dividindo o comprimento por dez para reduzir o erro
   relativo.
2. Com a cuba vazia e as fontes desligadas, posicione os centros dos três
   cilindros em cruzamentos da malha, formando um triângulo não degenerado.
3. Registre as coordenadas e calcule as três separações. Reposicione qualquer
   cilindro se uma delas for menor que \(7\Delta\).
4. Delimite no papel o quadrado de \(N\) intervalos com margem mínima de
   \(2\Delta\) nos quatro lados. Conte e anote os \((N+1)^2\) cruzamentos
   esperados.
5. Adicione a solução condutora até manter as três bases igualmente imersas.
   Espere cessarem ondas ou oscilações da superfície.
6. Com as saídas ainda desligadas, conecte \(E_0\) à referência comum,
   \(E_5\) à saída de 5 V e \(E_{10}\) à saída de 10 V. Ligue o COM do
   voltímetro a \(E_0\).
7. Energize por 5–10 s, verifique a corrente e procure sinais de eletrólise,
   aquecimento ou instabilidade. Desligue para corrigir qualquer problema.
8. Energize novamente e meça diretamente nos bornes \(V_0\), \(V_5\) e
   \(V_{10}\). Registre os valores reais, não apenas os ajustes nominais.
9. Comece em um canto do quadrado. Percorra todos os cruzamentos de uma linha
   e inverta o sentido na linha seguinte, realizando uma varredura em
   serpentina. Registre também a ordem da medida ou o horário de cada linha.
10. Em cada ponto, mantenha a ponta vertical, à mesma profundidade, aguarde a
    estabilização e anote todas as casas fornecidas pelo voltímetro. Não toque
    nos cilindros com a ponta.
11. Ao concluir cada linha, confirme que existem \(N+1\) registros, contando
    leituras e posições de fronteira. Corrija imediatamente qualquer lacuna.
12. Faça pausas periódicas com as saídas desligadas. Registre a duração
    aproximada da coleta e o número de pausas.
13. Ao terminar, repita cinco pontos distribuídos pelo quadrado: um próximo de
    cada eletrodo e dois em regiões intermediárias. Use as mesmas coordenadas e
    condições da primeira leitura.
14. Meça novamente \(V_0\), \(V_5\) e \(V_{10}\), desligue as duas saídas e só
    então desmonte os cabos e retire os cilindros.

Tempo total entre primeira e última leitura: _______________________________

Pausas e ocorrências observadas:

________________________________________________________________________________

________________________________________________________________________________

## Dados brutos

### Tabela 1 — geometria e fronteiras

Passo da malha: \(\Delta=\) __________ cm = __________ m

| Eletrodo | x (divisões) | y (divisões) | V inicial (V) | V final (V) |
| --- | ---: | ---: | ---: | ---: |
| \(E_0\) | | | | |
| \(E_5\) | | | | |
| \(E_{10}\) | | | | |

| Par | Distância (divisões) | Distância física (cm) | Atende \(\geq7\Delta\)? |
| --- | ---: | ---: | --- |
| \(E_0\)–\(E_5\) | | | |
| \(E_0\)–\(E_{10}\) | | | |
| \(E_5\)–\(E_{10}\) | | | |

### Tabela 2 — quadrado e controle de cobertura

| Parâmetro | Valor |
| --- | ---: |
| \(x_\mathrm{esq}\) | |
| \(x_\mathrm{dir}\) | |
| \(y_\mathrm{inf}\) | |
| \(y_\mathrm{sup}\) | |
| Intervalos por lado \(N\) | |
| Cruzamentos esperados \((N+1)^2\) | |
| Leituras realizadas | |
| Posições sob os eletrodos | |
| Pontos ausentes | |

Anexe a matriz completa \(V(x,y)\), com uma linha para cada coordenada \(y\) e
uma coluna para cada \(x\). Identifique as células cobertas por \(E_0\),
\(E_5\) e \(E_{10}\). Se os dados foram registrados em formato longo, anexe o
CSV com as colunas <code>x</code>, <code>y</code>, <code>V</code>,
<code>status</code> e <code>ordem_de_medida</code>. Informe aqui o nome do
arquivo ou da folha anexada:

________________________________________________________________________________

### Tabela 3 — repetibilidade e deriva

| Ponto | x | y | V original (V) | V repetido (V) | Diferença (V) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 — próximo de \(E_0\) | | | | | |
| 2 — próximo de \(E_5\) | | | | | |
| 3 — próximo de \(E_{10}\) | | | | | |
| 4 — intermediário | | | | | |
| 5 — intermediário | | | | | |

Resolução do voltímetro: __________ V

Exatidão declarada: ________________________

### Tabela 4 — campo elétrico por diferenças finitas

| Ponto | x | y | Método | \(E_x\) (V/m) | \(E_y\) (V/m) | \(|\vec E|\) (V/m) |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| 1 | | | central | | | |
| 2 | | | central | | | |
| 3 | | | central | | | |
| 4 | | | central | | | |
| 5 | | | central | | | |
| 6 | | | central | | | |
| 7 | | | | | | |
| 8 | | | | | | |

### Tabela 5 — teste discreto de Laplace

| Ponto | x | y | \(V_C\) (V) | Média dos 4 vizinhos (V) | \(r_L\) (V) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |
| 9 | | | | | |
| 10 | | | | | |

\(r_{\mathrm{RMS}}=\) __________ V

## Tratamento e análise

Conduza a análise na ordem abaixo e mostre as contas, não apenas os gráficos.

1. **Validação geométrica.** Calcule as três distâncias centro a centro e
   demonstre que cada uma é de pelo menos sete divisões. Mostre as quatro
   margens entre os eletrodos extremos e as bordas do quadrado. Explique como a
   dimensão menor foi ampliada para produzir um quadrado.

2. **Auditoria de cobertura.** Compare o número esperado \((N+1)^2\) com a soma
   das leituras, das posições cobertas pelos cilindros e de eventuais pontos
   ausentes. O resultado precisa fechar exatamente. Se houver ausência,
   identifique-a e explique por que não foi possível voltar à bancada; não
   preencha o dado por interpolação.

3. **Estabilidade das fronteiras.** Para cada eletrodo, calcule
   \(\Delta V_k=V_{k,\mathrm{final}}-V_{k,\mathrm{inicial}}\). Compare essa
   deriva com a resolução do instrumento. Uma variação coerente em toda a
   região pode deslocar o mapa sem alterar muito sua forma; variações
   independentes dos eletrodos modificam também os gradientes.

4. **Repetibilidade.** Calcule as cinco diferenças entre leituras repetidas,
   sua média, o maior módulo e, se adequado, o desvio-padrão. Examine se a
   diferença cresce com a ordem temporal da coleta, o que pode indicar
   polarização, evaporação, aquecimento ou mudança de contato.

5. **Mapa de potencial.** Produza um mapa de cores ou superfície
   \(V(x,y)\) usando apenas os dados medidos. Marque os três discos na escala
   correta, indique os eixos e mantenha a mesma razão de aspecto nos dois eixos
   para não deformar ângulos ou distâncias.

6. **Equipotenciais.** Trace as curvas de 1 V a 9 V. Localize cada cruzamento
   de uma curva com um segmento da malha por interpolação linear entre os dois
   valores vizinhos que cercam o nível escolhido. Não force uma curva a passar
   por regiões onde os dados não a sustentam. Compare forma e espaçamento com
   o esboço previsto.

7. **Campo elétrico.** Selecione pelo menos oito pontos distribuídos entre a
   região central, as proximidades dos eletrodos e a margem externa. Calcule
   \(E_x\), \(E_y\) e \(|\vec E|\). Desenhe os vetores com uma escala única,
   declarada na legenda. Verifique se apontam aproximadamente do maior para o
   menor potencial e se cruzam as equipotenciais perto de \(90^\circ\).

8. **Teste de Laplace.** Escolha dez pontos internos com os quatro vizinhos
   disponíveis e fora das bases. Calcule \(r_L\) e \(r_{\mathrm{RMS}}\).
   Compare a magnitude dos resíduos com a resolução e com a diferença dos
   pontos repetidos. Procure relação entre resíduos grandes e proximidade de
   cilindros, paredes ou região medida tardiamente.

9. **Efeitos de borda.** Compare o padrão dentro do triângulo com a faixa
   externa de duas divisões. A margem não existe apenas para decorar o gráfico:
   ela mostra como as equipotenciais continuam além dos centros e permite
   reconhecer a influência das paredes. Discuta se duas divisões foram
   suficientes para enxergar essa continuidade.

10. **Princípio do máximo.** Verifique se algum ponto da solução, fora dos
    eletrodos, apresentou valor estável abaixo de 0 V ou acima de 10 V. Um
    resultado assim não é esperado no modelo harmônico estacionário e deve ser
    investigado como erro de referência, ruído, deriva ou transiente, não
    aceito automaticamente.

Anexe todos os cálculos, códigos ou fórmulas de planilha usados. Um gráfico sem
rastreabilidade até a matriz bruta não constitui evidência completa.

## Incertezas e qualidade da evidência

Separe as fontes de incerteza e descreva seu provável efeito:

- **Voltímetro.** Informe resolução, exatidão e impedância de entrada quando
  disponíveis. A resolução limita a distinção entre equipotenciais próximas,
  enquanto um erro de ganho afeta todos os valores de modo aproximadamente
  proporcional.
- **Fontes.** Use os valores medidos nos bornes, não apenas 5 V e 10 V
  nominais. Discuta deriva, regulação sob carga e eventual diferença entre as
  referências das duas saídas.
- **Posição horizontal.** A ponta tem espessura finita e pode não coincidir
  exatamente com o cruzamento. Esse erro é mais importante onde o gradiente é
  grande.
- **Profundidade da ponta.** Variações de imersão podem amostrar regiões
  ligeiramente diferentes do volume condutor. Descreva como o grupo manteve a
  profundidade aproximadamente constante.
- **Geometria dos eletrodos.** Os cilindros têm raio não nulo, e a condição de
  fronteira vale na superfície metálica, não somente no ponto central marcado
  na planilha.
- **Solução.** Temperatura, concentração, evaporação, contaminação,
  polarização e bolhas podem alterar localmente a condutividade. Relate sinais
  observáveis e pausas realizadas.
- **Bordas e profundidade.** A cuba é finita e tridimensional. A malha no fundo
  representa coordenadas no plano, mas a corrente ocupa uma camada de espessura
  finita e encontra paredes isolantes.
- **Ordem da varredura.** Como os pontos são medidos em momentos diferentes,
  qualquer deriva temporal pode parecer uma variação espacial. A trajetória em
  serpentina reduz erros de coordenada, mas não elimina esse acoplamento.
- **Interpolação e diferenças finitas.** Equipotenciais entre cruzamentos e
  derivadas discretas são aproximações. O campo calculado amplifica ruído
  porque resulta de diferenças entre leituras.

Proponha uma incerteza representativa para \(V\) combinando resolução e
repetibilidade. Para o campo, explique qualitativamente por que a incerteza
cresce quando \(\Delta V\) entre vizinhos é comparável à incerteza de cada
leitura. Não apresente mais algarismos significativos que os dados justificam.

## Discussão

Responda com apoio explícito em seus mapas, tabelas e cálculos:

1. Em que regiões as equipotenciais ficaram mais próximas? Os valores de
   \(|\vec E|\) calculados confirmam a interpretação visual?
2. Os vetores de campo cruzaram as equipotenciais a aproximadamente
   \(90^\circ\)? Identifique a maior discrepância e proponha uma causa.
3. Por que o eletrodo de 5 V não torna toda a linha geométrica entre 0 V e
   10 V uma equipotencial de 5 V?
4. Como a presença do terceiro cilindro altera o mapa que seria produzido por
   apenas dois eletrodos em 0 V e 10 V?
5. Os resíduos de Laplace são compatíveis com a repetibilidade? Em quais
   regiões o modelo discreto funcionou melhor e pior?
6. O mapa contém algum máximo ou mínimo interior não associado a um eletrodo?
   Relacione sua resposta ao princípio do máximo para funções harmônicas.
7. O que a faixa externa de duas divisões revelou que seria perdido se apenas
   o interior do triângulo fosse medido?
8. Compare os cinco pontos repetidos com os originais. Há evidência de deriva
   temporal ou polarização?
9. Se todos os potenciais de fronteira fossem multiplicados por dois, mantendo
   a geometria e a condutividade aproximadamente constante, como mudariam
   \(V(x,y)\), as equipotenciais e \(\vec E\)?
10. Se os três cilindros fossem afastados mantendo 0 V, 5 V e 10 V, o que você
    esperaria para o espaçamento das equipotenciais e o módulo típico do campo?
11. A fotografia da montagem mostra valores momentâneos nos displays. Por que a
    medida direta em relação a \(E_0\) é a evidência relevante, e não o número
    exibido isoladamente por cada fonte?
12. Em que sentido este experimento é análogo a um problema eletrostático, e
    em que sentido ele é apenas um modelo condutivo estacionário?

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

## Conclusão

Retome a questão investigativa e a hipótese. Declare se a matriz completa
permitiu construir equipotenciais coerentes, se os vetores obtidos por
\(\vec E=-\nabla V\) apresentaram sentido e perpendicularidade esperados e se
o teste do valor médio sustentou aproximadamente \(\nabla^2V=0\) nas regiões
afastadas das fronteiras. Apoie a conclusão em números: faixa das tensões
medidas, deriva dos eletrodos, repetibilidade, faixa de \(|\vec E|\),
\(r_{\mathrm{RMS}}\) e cobertura efetiva da malha.

Diferencie claramente três níveis de afirmação:

1. o que foi diretamente medido;
2. o que foi calculado a partir das medidas;
3. o que é interpretação física dependente do modelo.

Uma boa conclusão não afirma apenas que “a teoria foi comprovada”. Ela indica
quais propriedades foram sustentadas dentro das incertezas, onde surgiram
desvios e quais mudanças de montagem ou protocolo produziriam evidência mais
forte em uma repetição.

________________________________________________________________________________

________________________________________________________________________________

## Checklist de entrega

- [ ] identificação completa da bancada e dos instrumentos;
- [ ] fotografia ou desenho fiel da montagem final;
- [ ] previsão original preservada;
- [ ] coordenadas dos três centros e as três separações;
- [ ] comprovação de \(d_{ij}\geq7\Delta\) para cada par;
- [ ] limites do quadrado e margem mínima de duas divisões;
- [ ] auditoria de \((N+1)^2\) cruzamentos;
- [ ] matriz completa \(V(x,y)\) anexada;
- [ ] tensões dos eletrodos no início e no fim;
- [ ] cinco pontos repetidos;
- [ ] mapa de cores e equipotenciais de 1 V a 9 V;
- [ ] oito ou mais vetores de campo calculados;
- [ ] teste de Laplace em dez pontos e \(r_{\mathrm{RMS}}\);
- [ ] análise de incerteza e deriva;
- [ ] discussão respondida com referência aos dados;
- [ ] conclusão compatível com a qualidade da evidência.
