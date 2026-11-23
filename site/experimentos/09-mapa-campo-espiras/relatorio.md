# Relatório — Experimento 9: mapeamento 3D do campo de espiras

> Este documento orienta a redação do relatório. Os valores de campo citados são
> previsões do modelo, não dados experimentais. Substitua os campos em branco por
> medições e argumentos do grupo e anexe os arquivos CSV originais das duas
> passadas de cada bobina, sem editar nem apagar linhas.

## Identificação

**Curso/turma:** ____________________

**Data, grupo e integrantes:** ____________________

**Impressora, sensor e placa de leitura utilizados:** ____________________

**Fonte de corrente e multímetro (modelo e escala):** ____________________

**Bobinas: geometria, dimensão medida, número de voltas contado e diâmetro do fio:** ____________________

## Resumo

Redija depois da análise um parágrafo que apresente a pergunta investigada, a
montagem com a impressora e o magnetômetro, o método das duas passadas e os
resultados principais. Informe, para cada bobina, o fator k com incerteza, a
posição ajustada do centro e o resíduo RMS do ajuste. Diga em uma frase se o
mapa medido sustenta a lei de Biot-Savart e em que região ele mais se afasta do
modelo. Cite números; não use apenas expressões como “o resultado foi bom”.

## Questão investigativa e previsão

O campo de uma espira plana, medido em centenas de pontos do espaço, é descrito
pela lei de Biot-Savart com o valor de referência de μ0? A previsão é que o
campo da bobina, separado do campo da Terra e do fundo, coincida com a soma das
contribuições de segmentos retos, a menos de um fator k próximo de 1 e de um
pequeno deslocamento do centro.

Antes da coleta, calcule pelas fórmulas do eixo o campo das duas bobinas a 2,
10 e 18 cm de altura, com 20 voltas e 1 A, e preencha a tabela. Diga também em
que altura o quadrado passa a ter campo maior que o círculo.

| z (cm) | círculo de 15 cm, previsto (μT) | quadrado de 15 cm, previsto (μT) | ΔBz medido no eixo, círculo (μT) | ΔBz medido no eixo, quadrado (μT) |
| --- | --- | --- | --- | --- |
| 2 | ______ | ______ | ______ | ______ |
| 10 | ______ | ______ | ______ | ______ |
| 18 | ______ | ______ | ______ | ______ |

Compare a ordem de grandeza com o ruído do sensor, de cerca de 0,45 μT por
leitura, e com o campo da Terra, de algumas dezenas de microtesla. Explique por
que a medida diferencial é indispensável nas maiores alturas.

## Referencial teórico

Parta da lei de Biot-Savart para um elemento de corrente e mostre que, para um
segmento reto, a integral tem forma fechada. Sejam \(\vec a\) e \(\vec b\) os
vetores que vão do ponto de observação P até o início e o fim do segmento:

\[
\begin{aligned}
d\vec B&=\frac{\mu_0}{4\pi}\frac{I\,d\vec\ell\times\hat r}{r^2},\\
\vec B_{\mathrm{seg}}&=\frac{\mu_0 I}{4\pi}\,
\frac{(\vec a\times\vec b)\left(|\vec a|+|\vec b|\right)}
     {|\vec a|\,|\vec b|\left(|\vec a|\,|\vec b|+\vec a\cdot\vec b\right)}.
\end{aligned}
\]

Explique como o quadrado e o U se decompõem em segmentos e por que o círculo
pode ser tratado como um polígono de muitos lados. Estime o erro relativo de um
polígono de 360 lados no centro do círculo. Discuta a aproximação de tratar as
N voltas como coincidentes, comparando a espessura do enrolamento com as
distâncias medidas.

Deduza ou justifique as expressões no eixo, para o círculo de raio R e para o
quadrado de lado a:

\[
\begin{aligned}
B_{\circ}(z)&=\frac{\mu_0 N I R^2}{2\left(R^2+z^2\right)^{3/2}},\\
B_{\square}(z)&=\frac{\mu_0 N I a^2}{2\pi\left(z^2+\frac{a^2}{4}\right)\sqrt{z^2+\frac{a^2}{2}}}.
\end{aligned}
\]

Mostre que as duas expressões tendem ao campo de um dipolo magnético para
\(z\) muito maior que a dimensão da bobina e identifique o momento de dipolo de
cada uma. Use esse limite para interpretar a comparação entre círculo e
quadrado nas maiores alturas.

Descreva a medida diferencial. Na passada desligada o sensor registra o campo
da Terra, o campo do aço da impressora, o desvio de zero do sensor e a deriva
lenta; na ligada, tudo isso mais o campo da bobina. Com as leituras do ponto de
referência interpoladas no tempo, \(\vec r(t)\), a diferença corrigida é

\[
\Delta\vec B(P)=\left[\vec B_{\mathrm{lig}}(P)-\vec r_{\mathrm{lig}}(t)\right]
-\left[\vec B_{\mathrm{desl}}(P)-\vec r_{\mathrm{desl}}(t')\right]
+\vec B_{\mathrm{bob}}(P_{\mathrm{ref}}).
\]

Explique o papel de cada termo, em especial o último, e as hipóteses que a
correção exige: deriva aditiva e igual em todas as posições, e nada movido
entre as passadas.

## Materiais e métodos

Descreva a montagem realmente utilizada e inclua uma fotografia ou um esquema
com a mesa, o suporte, a bobina, o braço do sensor e os fios de ligação.
Informe a altura do plano da bobina sobre a mesa, a posição do sensor em
relação ao bico e como a origem dos dados foi escolhida. Registre as
coordenadas da impressora no ponto de origem e o ponto de referência usado.

Relate a sequência de comandos: home com a mesa vazia antes de colocar o
suporte, `M18 S0` para manter os motores ligados, `M400`
antes de cada medida, tempo de espera e número de leituras por ponto. Descreva
a grade (valores de x, y e z), a ordem da varredura, a frequência das visitas
ao ponto de referência e a duração de cada passada. Informe como a corrente foi
conferida durante a passada ligada.

Se algo mudou durante a coleta (passada interrompida, ponto refeito, objeto
movido perto da mesa), descreva a ocorrência e diga como ela foi tratada. Não
omita eventos que possam explicar um padrão no resíduo.

## Dados brutos

Anexe os arquivos no formato mapa-campo v1, com os metadados preenchidos. Para
cada bobina, registre o resumo mostrado pelo visualizador:

| Bobina | Arquivos | Pontos por passada | Pares completos | Pares faltando | Grade (x, y, z) | Ruído por leitura (μT) |
| --- | --- | --- | --- | --- | --- | --- |
| círculo | ______ | ______ | ______ | ______ | ______ | ______ |
| quadrado | ______ | ______ | ______ | ______ | ______ | ______ |

Registre também a deriva observada no ponto de referência (última menos
primeira visita, por componente) em cada passada e o salto entre passadas
descontado pela correção. Não substitua leituras por valores do modelo e não
remova pontos sem declarar o critério.

## Tratamento e análise

Use a aba Visualização da página do experimento ou um programa próprio que
siga o mesmo formato. Para cada bobina:

1. Calcule ΔB = ligada − desligada em todos os pontos pareados, com e sem a
   correção de deriva, e compare as duas versões no ponto de referência e nas
   maiores alturas.
2. Apresente pelo menos três cortes 2D: XY numa altura baixa, XY numa altura
   alta e XZ passando pelo centro da bobina. Identifique a componente mostrada
   e a escala de cor de cada figura.
3. Faça o perfil de ΔBz no eixo (x = y = 0) em função de z, com barras de
   incerteza, sobreposto à fórmula fechada. Repita em escala logarítmica e
   comente a inclinação nas maiores alturas.
4. Ajuste o modelo de Biot-Savart e registre os resultados:

| Bobina | k | u(k) | x0 (mm) | y0 (mm) | z0 (mm) | resíduo RMS (μT) | χ²/ν |
| --- | --- | --- | --- | --- | --- | --- | --- |
| círculo | ______ | ______ | ______ | ______ | ______ | ______ | ______ |
| quadrado | ______ | ______ | ______ | ______ | ______ | ______ | ______ |

O ajuste minimiza

\[
\chi^2=\sum_{i}\sum_{\alpha=x,y,z}\left(\frac{\Delta B_{\alpha,i}-k\,N I\,f_\alpha(P_i-\vec c)}{u_{\alpha,i}}\right)^2 ,
\]

em que \(\vec f\) é o campo por ampère-volta da geometria nominal e
\(\vec c=(x_0,y_0,z_0)\) é o centro da bobina. Explique por que k mede μ0 em
unidades do valor de referência e calcule \(\mu_0^{\mathrm{medido}}=k\,\mu_0\).

5. Mostre o mapa de resíduo (medido − modelo) num corte baixo e descreva se ele
   parece ruído ou tem estrutura.

## Incertezas e adequação do modelo

A incerteza de cada componente vem do desvio padrão s das n leituras:

\[
\begin{aligned}
u_{\Delta B_x}&=\sqrt{\frac{s_{x,\mathrm{lig}}^2}{n_{\mathrm{lig}}}+\frac{s_{x,\mathrm{desl}}^2}{n_{\mathrm{desl}}}},\\
\frac{u_{\mu_0}}{\mu_0}&=\sqrt{\left(\frac{u_k}{k}\right)^2+\left(\frac{u_I}{I}\right)^2+\left(\frac{u_N}{N}\right)^2+\left(\frac{u_{\mathrm{escala}}}{\mathrm{escala}}\right)^2}.
\end{aligned}
\]

A incerteza de k fornecida pelo ajuste é apenas estatística. Com a correção de
deriva, pontos da mesma linha da grade compartilham as mesmas leituras da
referência; os erros ficam correlacionados e essa incerteza fica subestimada.
Some a ela a incerteza da corrente (leitura do multímetro), da contagem de
voltas e da escala do sensor, que costumam dominar.

Estime quanto um erro de 1 mm na altura muda o campo a 2 cm acima do fio e
compare com a incerteza estatística. Discuta se o \(\chi^2/\nu\) obtido indica
que o modelo descreve os dados dentro das incertezas ou se há efeitos
sistemáticos: espessura do enrolamento, fios de ligação, inclinação da bobina,
eixos do sensor desalinhados com os da impressora, ímã ou aço perto da mesa.

## Discussão

Compare k com 1 levando em conta todas as incertezas. Compare o centro ajustado
com a marcação feita na origem e com o que se sabe da construção da bobina; em
particular, interprete z0 em termos da espessura do enrolamento e da altura do
sensor. Discuta onde o modelo funciona melhor e onde falha, usando os mapas de
resíduo. Explique as diferenças entre o círculo e o quadrado nas alturas baixas,
perto dos cantos e lados, e nas alturas altas, à luz do limite de dipolo.

Avalie o método: a correção de deriva mudou o resultado? O salto entre passadas
era maior que o ruído? Que mudança no procedimento reduziria a maior fonte de
erro identificada? Proponha, com números, uma grade mais eficiente para medir
μ0 com a mesma duração total.

## Conclusão

Responda à pergunta investigativa com os números do grupo: valor de μ0 medido
com incerteza para cada bobina, compatibilidade com o valor de referência e a
principal limitação encontrada. Não afirme mais do que os dados sustentam.

## Referências

- HALLIDAY, D.; RESNICK, R.; WALKER, J. *Fundamentos de Física*, v. 3:
  Eletromagnetismo. Rio de Janeiro: LTC. Capítulo sobre campos magnéticos
  produzidos por correntes.
- GRIFFITHS, D. J. *Eletrodinâmica*. São Paulo: Pearson. Capítulo de
  magnetostática, lei de Biot-Savart.
- Folha de dados do sensor MLX90393 (Melexis): faixas, resolução e ruído.
- Documentação do firmware Marlin: comandos G28, M18 e M400.

## Checklist de entrega

- [ ] identificação, pergunta, previsões no eixo feitas antes da coleta;
- [ ] esquema ou fotografia da montagem com origem, referência e alturas;
- [ ] arquivos CSV originais das duas passadas de cada bobina;
- [ ] tabela de resumo dos dados e da deriva;
- [ ] cortes 2D, perfil no eixo (linear e logarítmico) e mapa de resíduo;
- [ ] tabela do ajuste com k, centro, resíduo RMS e χ²/ν;
- [ ] μ0 medido com incerteza completa e comparação com o valor de referência;
- [ ] discussão das limitações e conclusão compatível com as evidências.
