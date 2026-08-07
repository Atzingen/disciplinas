# Relatório — Experimento 02: campo magnético de um solenoide

## Identificação

**Curso e turma:** ________________________________________________

**Estudantes:** ___________________________________________________

**Data:** ____________________ **Bancada:** ________________________

**Professor(a):** _________________________________________________

## Questão investigativa, objetivos e hipótese

Este experimento investiga como a distribuição espacial do campo magnético de
um solenoide real se relaciona com a corrente elétrica, com a geometria da
bobina e com as aproximações usadas no modelo de solenoide ideal. A observação
com limalha de ferro fornece uma representação da direção local e da topologia
das linhas de campo; a bússola acrescenta informação sobre o sentido do vetor.
Essas duas técnicas devem ser interpretadas de forma complementar: nenhuma
delas, isoladamente, mede com precisão o módulo de $\vec B$.

Formule antes da montagem uma hipótese sobre três regiões: o centro do
solenoide, suas extremidades e o espaço exterior. Indique onde o campo deverá
ser aproximadamente uniforme, onde os efeitos de borda serão mais importantes
e como a ponta norte da bússola deverá se orientar. Registre também como a
inversão da corrente deve alterar o padrão observado. A hipótese precisa ser
escrita antes da coleta, pois seu valor científico está justamente em permitir
uma comparação honesta com o resultado.

**Hipótese e justificativa física:**

________________________________________________________________________

________________________________________________________________________

**Previsão para a inversão da corrente:**

________________________________________________________________________

## Segurança, materiais e rastreabilidade

O conjunto básico é formado pela placa para ensaios de eletromagnetismo, fonte
de $6\ \mathrm{V}/1\ \mathrm{A}$, solenoide, limalha de ferro, placa
transparente e bússola. Régua, amperímetro e sensor Hall aparecem neste roteiro
apenas como extensão quantitativa opcional; se não estiverem disponíveis, não
se deve inventar valores para corrente, posição ou campo.

Monte o circuito com a fonte desligada e o controle no mínimo. Energize por
intervalos de $5$ a $10\ \mathrm{s}$ e mantenha o circuito desligado por tempo
semelhante entre observações, evitando aquecimento da bobina. Não ultrapasse
metade do curso do controle sem autorização do professor. A limalha não deve ser
soprada nem aproximada dos olhos, de equipamentos eletrônicos ou diretamente
dos terminais. Segure a placa pelas bordas e faça qualquer reposicionamento
somente com a corrente interrompida.

Registre identificação, faixa, resolução e eventual calibração de todo
instrumento adicional. Se um aplicativo de celular for usado apenas para
fotografia, informe isso; um magnetômetro de telefone não deve ser tratado como
sensor calibrado sem caracterização independente.

**Ocorrências, desvios do protocolo ou alterações na montagem:**

________________________________________________________________________

## Preparação conceitual e convenções

Defina o eixo $z$ ao longo do solenoide, com origem no centro geométrico e
sentido positivo apontando da extremidade A para a extremidade B. Registre o
sentido convencional da corrente nas espiras e desenhe a orientação prevista de
$\vec B$ pela regra da mão direita. O esquema deve identificar o ponto de vista
do observador para que expressões como horário e anti-horário não fiquem
ambíguas.

Para um solenoide com $N$ espiras distribuídas em um comprimento ativo $\ell$,
a densidade linear de espiras é

$$
n=\frac{N}{\ell}.
$$

Na aproximação ideal, longa e densamente enrolada, a lei de Ampère conduz a

$$
\begin{aligned}
\oint_C \vec B\cdot d\vec\ell
  &=\mu_0 I_{\mathrm{enc}},\\
B_{\mathrm{ideal}}\,\ell_C
  &=\mu_0(n\ell_C)I,\\
B_{\mathrm{ideal}}
  &=\mu_0\frac{N}{\ell}I
   =\mu_0 nI.
\end{aligned}
$$

Essa expressão prevê um campo interno aproximadamente uniforme e um campo
externo desprezível apenas quando $\ell\gg a$, em que $a$ é o raio da bobina.
O solenoide da bancada é finito; portanto, o modelo ideal deve ser entendido
como limite, não como descrição exata de todos os pontos.

## Procedimento experimental

1. Com a chave desligada e o controle no mínimo, fixe o solenoide e confira as
   conexões. Identifique as extremidades A e B e desenhe o sentido da corrente
   convencional previsto para cada uma.
2. Posicione a placa transparente sobre o solenoide. Distribua uma camada fina
   e aproximadamente uniforme de limalha, sem formar montes que dificultem a
   rotação dos grãos.
3. Registre uma fotografia ou um esboço antes da energização. Essa imagem serve
   como controle para distinguir um padrão induzido de uma distribuição inicial
   acidental.
4. Energize durante $5$ a $10\ \mathrm{s}$. Durante o pulso, dê batidas leves e
   comparáveis na borda da placa, apenas o suficiente para vencer o atrito
   estático dos grãos. Desligue e aguarde o resfriamento antes de fotografar.
5. Descreva o padrão no centro, nas extremidades e no exterior. Não use a
   concentração visual de limalha como medida numérica de $B$: espessura da
   camada, atrito, aglomeração e intensidade das batidas também alteram essa
   concentração.
6. Retire ou afaste a limalha conforme orientação do laboratório. Com a corrente
   ligada apenas durante o intervalo seguro, percorra posições selecionadas com
   a bússola e registre a orientação de sua ponta norte.
7. Inverta a corrente com a chave desligada. Repita as leituras da bússola nas
   mesmas posições. Verifique se o sentido se inverte sem que a topologia geral
   das linhas seja modificada.
8. Se houver sensor Hall calibrado, faça o zero longe da bobina, defina uma
   sequência de posições $z_i$ e meça $B(z_i)$ mantendo a corrente constante.
   Repita ao menos três vezes cada posição ou justifique outro plano amostral.
9. Ao final, desligue a fonte, retorne o controle ao mínimo, recolha a limalha e
   documente qualquer alteração de geometria, temperatura ou contato elétrico.

## Dados brutos

Dados brutos são registros próximos da observação: não devem conter valores
recalculados, suavizados ou escolhidos para concordar com o modelo. Preserve
fotografias originais, previsões divergentes e leituras repetidas. Se uma
observação for ambígua, escreva “inconclusiva” e explique o motivo.

### Registro qualitativo obrigatório

| Posição | Estado da corrente | Orientação da ponta norte | Direção local inferida | Observações sobre o padrão |
|---|---|---|---|---|
| Centro | Direta |  |  |  |
| Extremidade A | Direta |  |  |  |
| Extremidade B | Direta |  |  |  |
| Exterior lateral | Direta |  |  |  |
| Centro | Invertida |  |  |  |
| Extremidade A | Invertida |  |  |  |
| Extremidade B | Invertida |  |  |  |

**Identificação das fotografias ou dos desenhos anexados:**

________________________________________________________________________

**Condições da camada de limalha e do procedimento de batidas:**

________________________________________________________________________

### Extensão quantitativa opcional com sensor Hall

Preencha apenas se os instrumentos estiverem presentes. $B_{\mathrm{raw}}$ é a
leitura original; correções de zero pertencem à etapa de tratamento.

| Ponto | $z$ (m) | $u(z)$ (m) | $I$ (A) | $u(I)$ (A) | $B_{\mathrm{raw}}$ (T) | $u(B)$ (T) | repetição |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |

**Leitura de zero e campo de fundo:** _________________________________

**Valores medidos de $a$, $\ell$ e $N$, com incertezas e método:** ______

## Tratamento e análise

### 1. Topologia, direção e sentido

Redesenhe o padrão observado usando curvas contínuas. Linhas de campo magnético
não começam nem terminam em polos isolados: elas formam laços fechados. No
exterior de uma bobina, a convenção visual vai do polo norte magnético para o
sul; no interior, o fechamento ocorre do sul para o norte. Explique quais
características da limalha sustentam a direção tangente local e quais não podem
ser inferidas dela. Em seguida, use a orientação da bússola para acrescentar
setas e identificar as extremidades.

A limalha se magnetiza e sofre torque, alinhando seu eixo com o campo local.
Como uma pequena agulha ou um grão alongado não distingue espontaneamente
$+\vec B$ de $-\vec B$ apenas pela linha sobre a qual se alinha, a imagem revela
direção, mas não sentido. A ponta norte identificada da bússola resolve essa
ambiguidade. Compare também o padrão antes e depois de inverter a corrente:
espera-se a mesma geometria aproximada com setas opostas.

### 2. Dedução do modelo ideal

Escolha uma curva amperiana retangular com um trecho interno paralelo ao eixo e
um trecho externo distante. Explique por que, na idealização, as contribuições
transversais são nulas e o trecho externo é desprezado. O número de espiras
atravessadas em um comprimento $\ell_C$ é $n\ell_C$, de modo que a corrente
envolvida vale $I_{\mathrm{enc}}=n\ell_C I$. Reproduza a dedução, identifique as
hipóteses e verifique dimensionalmente:

$$
[B]=[\mu_0][n][I]
=\frac{\mathrm{T\,m}}{\mathrm{A}}\,
 \frac{1}{\mathrm{m}}\,\mathrm{A}
=\mathrm{T}.
$$

Discuta por que o resultado não depende explicitamente do raio no limite ideal
e por que isso deixa de ser uma aproximação adequada quando o comprimento e o
raio têm a mesma ordem de grandeza.

### 3. Campo axial de um solenoide finito

Para comparar o centro, as bordas e o exterior ao longo do eixo, use

$$
\begin{aligned}
B(z)
&=\frac{\mu_0 nI}{2}
\left[
\frac{z+\ell/2}
{\sqrt{a^2+\left(z+\ell/2\right)^2}}
-
\frac{z-\ell/2}
{\sqrt{a^2+\left(z-\ell/2\right)^2}}
\right].
\end{aligned}
$$

No centro, $z=0$, os dois termos se combinam:

$$
\begin{aligned}
B(0)
&=\frac{\mu_0 nI}{2}
\left[
\frac{\ell/2}{\sqrt{a^2+(\ell/2)^2}}
-
\frac{-\ell/2}{\sqrt{a^2+(\ell/2)^2}}
\right]\\
&=\mu_0 nI
\frac{\ell/2}{\sqrt{a^2+(\ell/2)^2}}.
\end{aligned}
$$

Quando $\ell/a\rightarrow\infty$, a fração geométrica tende a $1$ e recupera-se
$B(0)\rightarrow\mu_0 nI$. Mostre essa passagem e explique por que o campo cai
continuamente nas extremidades, em vez de sofrer a descontinuidade implícita no
modelo ideal.

Se houver medidas Hall, corrija o zero de forma explícita e construa o gráfico
$B(z)$ com barras de incerteza. Compare três descrições: campo constante ideal,
modelo finito com parâmetros geométricos medidos e, se justificado, ajuste no
qual apenas um fator de escala seja livre. Não deixe todos os parâmetros livres
sem dados suficientes, pois isso produz correlações e um ajuste pouco
identificável.

Uma forma útil de comparar perfis, mesmo quando a calibração absoluta é
incerta, é normalizar:

$$
b(z)=\frac{B(z)-B_{\mathrm{fundo}}}
{B(0)-B_{\mathrm{fundo}}}.
$$

Apresente resíduos $r_i=B_i-B(z_i)$ e procure estrutura: resíduos aleatórios em
torno de zero são compatíveis com o modelo dentro da precisão; uma curvatura
sistemática pode indicar geometria mal medida, desalinhamento do sensor,
campo de fundo não removido ou inadequação do modelo.

### 4. Incertezas

Para uma leitura uniforme com menor divisão $\delta x$, pode-se adotar, quando
justificado, $u(x)=\delta x/\sqrt{12}$. Para repetições independentes, apresente
média, desvio-padrão e incerteza-padrão da média sem confundir dispersão com
resolução. Em uma análise Hall, a variância efetiva do resíduo pode incorporar
incertezas nas duas coordenadas:

$$
u_{\mathrm{ef},i}^2
=u(B_i)^2
+\left[
\frac{\partial B}{\partial z}\bigg|_{z_i}u(z_i)
\right]^2
+\left[
\frac{\partial B}{\partial I}\bigg|_{I_i}u(I_i)
\right]^2.
$$

Quando as incertezas de $a$ e $\ell$ forem relevantes, inclua suas derivadas
parciais ou faça uma simulação de Monte Carlo documentada. Além das componentes
aleatórias, discuta efeitos sistemáticos: zero do sensor, campo terrestre,
orientação do eixo sensível, distância entre sensor e eixo, aquecimento da
bobina e variação da corrente. Uma incerteza pequena de repetição não elimina um
erro sistemático comum a todas as leituras.

**Cálculos, gráficos, ajustes e resíduos:**

________________________________________________________________________

________________________________________________________________________

## Discussão

Construa a discussão como um argumento baseado em evidências. Comece dizendo
quais observações respondem à hipótese inicial. Separe claramente observação
direta — orientação da bússola, desenho da limalha, leitura do sensor — de
inferência teórica — polos, uniformidade, validade do modelo ideal. Uma figura
visualmente semelhante à representação de um ímã de barra é evidência
qualitativa da topologia dipolar, mas não prova por si só a lei
$B=\mu_0 nI$.

Compare centro e extremidades. Se as linhas parecerem aproximadamente paralelas
na região central e se abrirem nas bordas, explique isso como efeito de
comprimento finito. Se o resultado diferir, examine primeiro espessura da
limalha, número e intensidade das batidas, posição da placa e assimetria da
bobina. Não ajuste retrospectivamente a hipótese sem registrar a divergência.

Discuta a regra da mão direita usando o sentido convencional da corrente e a
ponta norte da bússola. Mostre se a inversão da corrente trocou os polos
inferidos e avalie a repetibilidade. Considere a contribuição do campo
terrestre: quando o campo do solenoide é fraco, a bússola se alinha com a soma
vetorial $\vec B_{\mathrm{sol}}+\vec B_{\mathrm{Terra}}$, e não apenas com o
solenoide. Essa superposição pode explicar uma rotação incompleta ou uma
orientação oblíqua.

Se a extensão Hall foi executada, compare parâmetros e resíduos, não apenas a
aparência do gráfico. Informe se o modelo ideal é aceitável somente no centro,
se o modelo finito melhora a descrição e se as diferenças excedem as
incertezas. Se não houve sensor, declare explicitamente que a análise permanece
qualitativa; isso é cientificamente mais sólido do que atribuir números à
densidade visual dos grãos.

Responda no texto, sem formato de questionário isolado: por que a limalha não
fornece o sentido; como a bússola o determina; qual hipótese ideal falha nas
extremidades; como a corrente determina os polos; quais limitações impedem uma
medida absoluta; e que modificação experimental permitiria testar a
proporcionalidade entre $B$ e $I$.

## Conclusão

A conclusão deve responder à questão investigativa em um ou dois parágrafos,
sem recontar todo o procedimento. Declare se a hipótese foi sustentada,
parcialmente sustentada ou refutada e cite as evidências específicas. Indique
se foi possível distinguir região central, efeitos de borda e campo exterior,
e se a inversão da corrente produziu a mudança de sentido prevista.

Quando houver análise quantitativa, apresente o principal resultado com unidade,
incerteza e comparação ao modelo. Quando não houver, preserve o caráter
qualitativo da conclusão e não use expressões como “comprovamos exatamente”.
Finalize identificando a limitação dominante e propondo uma melhoria concreta,
por exemplo mapear $B(z)$ com sensor Hall calibrado, controlar a corrente com
amperímetro ou ampliar a razão $\ell/a$.

**Síntese final:**

________________________________________________________________________

________________________________________________________________________

## Referências e anexos

Inclua o manual do conjunto AZEHEB, a bibliografia teórica adotada na disciplina
e qualquer fonte externa efetivamente consultada. Numere fotografias, diagramas
e gráficos; dê título, legenda, unidade e referência no texto. Anexe dados
originais e códigos de análise quando usados, preservando a possibilidade de
reprodução do tratamento.

## Checklist de entrega

- [ ] Hipótese e previsões registradas antes da coleta.
- [ ] Convenção de eixo, corrente e polos declarada.
- [ ] Dados brutos qualitativos e fotografias identificados.
- [ ] Instrumentos opcionais e respectivas resoluções documentados.
- [ ] Dedução do modelo ideal e limite do modelo finito apresentados.
- [ ] Gráficos, resíduos e incertezas incluídos quando houve dados Hall.
- [ ] Observação e inferência separadas na discussão.
- [ ] Conclusão responde aos objetivos sem valores fabricados.
- [ ] Figuras, referências e anexos permitem rastrear a análise.
