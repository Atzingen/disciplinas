# Relatório — Experimento 5: varal de resistores, a escada infinita

> Preencha somente com observações e medições feitas pelo grupo. Não substitua
> lacunas por valores teóricos, simulados ou inventados. A previsão registrada
> antes das medidas é parte da avaliação e não deve ser corrigida depois.

## Identificação

**Curso/turma:** ________________________________________________

**Data:** ____/____/________

**Grupo:** ____________________

**Integrantes:** ________________________________________________

**Bancada e instrumento (modelo e número de série do multímetro):**

________________________________________________________________________________

## Questão investigativa, hipótese e previsão

A rede estudada é a escada — ou varal — de resistores: dois fios horizontais
partem dos bornes A (fio de cima) e B (fio de baixo), e cada degrau acrescenta
três resistores nominalmente iguais, um em cada fio e um terceiro na vertical,
ligando os dois. A questão investigativa é dupla. Primeiro: a resistência
equivalente medida entre A e B acompanha, degrau a degrau, a sequência prevista
pela recorrência da rede? Segundo: a partir de quantos degraus a escada real,
montada com componentes de tolerância finita, torna-se experimentalmente
indistinguível da escada infinita idealizada?

A hipótese central é que a convergência é geométrica e muito rápida, de modo
que **três degraus — nove resistores — bastam** para realizar o circuito
infinito dentro da precisão dos componentes. A teoria (seção de preparação)
prevê que o desvio em relação ao limite cai por um fator de aproximadamente
\((2-\sqrt{3})^2 \approx 0{,}072\) a cada degrau acrescentado, enquanto a
tolerância de 5% dos resistores impõe um piso de incerteza muito maior que o
erro de truncamento já no terceiro degrau.

Antes de qualquer medida da escada, registre a previsão numérica calculada com
a média \(\bar{R}\) dos seus nove resistores (Tabela 1):

\(\bar{R}\) usado na previsão: ____________ kΩ

| Degraus | Fração teórica | Previsão de R_AB (kΩ) |
| --- | --- | --- |
| 1 | \(3\bar{R}\) | |
| 2 | \(11\bar{R}/4\) | |
| 3 | \(41\bar{R}/15\) | |

Limite previsto: \(R_\infty = \left(1+\sqrt{3}\right)\bar{R}\) = ____________ kΩ

## Segurança e integridade da montagem

Confirme antes de iniciar e registre qualquer desvio:

- [ ] toda medição de resistência feita com o circuito completamente desenergizado;
- [ ] na extensão com fonte, polaridade conferida antes de ligar e energização por períodos curtos (5–10 s por leitura);
- [ ] pontas do multímetro sem contato com os dedos durante as leituras — a resistência do corpo em paralelo altera medidas na faixa de dezenas de kΩ;
- [ ] resistores assentados firmemente na protoboard, sem contato intermitente;
- [ ] terminais sem curto acidental entre trilhas vizinhas da protoboard.

## Preparação pré-laboratório: teoria da escada

A análise parte de uma única ideia estrutural. Vista dos bornes, a escada com
N degraus é: dois resistores em série (um por fio) seguidos do resistor
vertical em paralelo com **todo o resto da rede**, que é a mesma escada com
N − 1 degraus. Isso define a recorrência

$$
R_N = 2R + \left(R \parallel R_{N-1}\right)
    = 2R + \frac{R\,R_{N-1}}{R + R_{N-1}},
$$

com a condição inicial de extremidade aberta, \(R_0 = \infty\). Aplicando a
recorrência três vezes obtêm-se as frações exatas usadas na previsão:

$$
R_1 = 3R, \qquad R_2 = \frac{11R}{4} = 2{,}75\,R, \qquad
R_3 = \frac{41R}{15} \approx 2{,}7333\,R.
$$

Para a escada infinita, o argumento de autossemelhança dispensa a iteração:
acrescentar um degrau a uma escada que já é infinita produz a mesma escada,
logo \(R_\infty\) satisfaz a própria recorrência. Multiplicando os dois lados
por \((R + R_\infty)\) e reorganizando:

$$
\begin{aligned}
R_\infty &= 2R + \frac{R\,R_\infty}{R + R_\infty}\\
R_\infty\,(R + R_\infty) &= 2R\,(R + R_\infty) + R\,R_\infty\\
R_\infty^2 + R\,R_\infty &= 2R^2 + 2R\,R_\infty + R\,R_\infty .
\end{aligned}
$$

O resultado é a equação quadrática

$$
R_\infty^2 - 2R\,R_\infty - 2R^2 = 0,
$$

cujas raízes são \(R_\infty = R\,(1 \pm \sqrt{3})\). A raiz negativa é
descartada porque uma rede passiva de resistores positivos não pode apresentar
resistência negativa entre seus terminais. Resta o limite

$$
R_\infty = \left(1+\sqrt{3}\right)R \approx 2{,}732\,R,
$$

que vale cerca de 27,32 kΩ para R = 10 kΩ. É notável que \(\sqrt{3}\) emerja
de uma rede montada só com resistores iguais: o número irracional não está em
nenhum componente, e sim na **estrutura** autossemelhante da associação.

Duas observações completam a preparação. Primeiro, \(R_{AB}\) é uma função
homogênea de grau 1 dos resistores: multiplicar todos por um fator k multiplica
o resultado por k. Por isso a média \(\bar{R}\) dos componentes medidos — e não
o valor nominal de 10 kΩ — é a melhor escala para a previsão simples, e as
frações \(3\bar{R}\), \(11\bar{R}/4\) e \(41\bar{R}/15\) já incorporam o desvio
sistemático do lote. Segundo, a previsão fina, resistor a resistor, resolve a
mesma recorrência da ponta aberta em direção aos bornes usando o valor medido
de cada posição:

$$
R_\text{visto} = R_\text{topo} + R_\text{base}
+ \left(R_\text{vert} \parallel R_\text{adiante}\right),
$$

onde \(R_\text{adiante}\) é a resistência do trecho já resolvido à direita.

## Procedimento executado e controles experimentais

Descreva o que foi de fato realizado, na ordem, incluindo qualquer troca de
resistor, reassentamento de contato ou repetição de leitura:

1. Numeração e medição individual dos nove resistores (Tabela 1), com o
   multímetro na escala de 200 kΩ e registro de todas as casas exibidas.
2. Cálculo de \(\bar{R}\), do desvio-padrão amostral e verificação da
   tolerância de 5% (faixa 9,5–10,5 kΩ).
3. Registro da previsão (seção anterior) **antes** da primeira medida da rede.
4. Montagem do degrau 1 (três resistores), medição de \(R_{AB}\) com a
   extremidade direita aberta; anotação da posição de cada resistor numerado.
5. Acréscimo do degrau 2 sem desmontar o primeiro; nova medição.
6. Acréscimo do degrau 3; medição final da série principal.
7. Extensão opcional: alimentação dos bornes com fonte de 6 V e medição da
   tensão sobre cada resistor vertical, com leituras de 5–10 s.

Controles adotados: mesma escala do instrumento em todas as leituras; mesmas
pontas e mesmos bornes; leituras repetidas até estabilizar; nenhum dedo em
contato com partes metálicas durante a medida.

________________________________________________________________________________

________________________________________________________________________________

## Dados brutos

### Tabela 1 — resistores individuais

| Resistor nº | Valor medido (kΩ) | Desvio do nominal (%) | Posição na escada |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |

Média \(\bar{R}\): ____________ kΩ  ·  Desvio-padrão s: ____________ kΩ  ·  s/\(\bar{R}\): ________ %

### Tabela 2 — a escada cresce

| Degraus | Previsão com \(\bar{R}\) (kΩ) | Previsão fina (kΩ) | R_AB medido (kΩ) | Diferença (%) |
| --- | --- | --- | --- | --- |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Escala e resolução do instrumento nas medidas da rede: ____________________

### Tabela 3 — extensão opcional: tensões no varal (fonte de ____ V)

| Degrau | Tensão no resistor vertical (V) | Razão para o degrau anterior |
| --- | --- | --- |
| 1 | | — |
| 2 | | |
| 3 | | |

Condições da fonte (tensão em vazio e sob carga, se medidas):

________________________________________________________________________________

## Tratamento e análise

Conduza a análise nesta ordem, apresentando as contas:

1. **Estatística dos componentes.** Com os nove valores da Tabela 1, calcule a
   média \(\bar{R}\), o desvio-padrão amostral s e a incerteza da média
   \(u(\bar{R}) = s/\sqrt{9}\). Verifique se algum resistor foge da tolerância
   declarada e discuta se o lote está deslocado para um dos lados do nominal.

2. **Monotonicidade.** Confirme que as três medidas de \(R_{AB}\) decrescem
   (\(R_1 > R_2 > R_3\)) e que todas ficam **acima** do limite
   \(\left(1+\sqrt{3}\right)\bar{R}\): a escada truncada em aberto sempre
   aproxima o limite por cima.

3. **Comparação com as previsões.** Para cada etapa, calcule a diferença
   percentual entre a medida e a previsão com \(\bar{R}\) e, se realizada,
   entre a medida e a previsão fina. Avalie se as diferenças são compatíveis
   com a dispersão dos componentes (item 1) somada à exatidão do instrumento.

4. **Razões de convergência.** Com \(R_\infty = (1+\sqrt{3})\,\bar{R}\),
   calcule as razões

   $$
   \begin{aligned}
   q_2 &= \frac{R_2 - R_\infty}{R_1 - R_\infty}, &
   q_3 &= \frac{R_3 - R_\infty}{R_2 - R_\infty},
   \end{aligned}
   $$

   e compare com o valor teórico \((2-\sqrt{3})^2 \approx 0{,}072\). Explique
   por que esse fator — o quadrado da atenuação por degrau — controla a
   velocidade de convergência da resistência de entrada.

5. **Truncamento versus tolerância.** Os desvios teóricos em relação ao limite
   são +9,81% (1 degrau), +0,66% (2 degraus) e +0,047% (3 degraus). Determine
   a partir de qual degrau o erro de truncamento fica menor que o efeito
   combinado da dispersão dos seus resistores e da exatidão do multímetro, e
   conclua quantos degraus "bastam" na sua bancada.

6. **Extensão das tensões.** Se a Tabela 3 foi preenchida, calcule as razões
   entre tensões vizinhas e compare com \(2-\sqrt{3} \approx 0{,}268\)
   (escada infinita) e com as razões exatas da escada truncada em três degraus
   (3/11 ≈ 0,273 e 1/3 ≈ 0,333). Explique por que o último degrau foge mais do
   padrão: a ponta aberta quebra a autossemelhança.

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

## Incertezas e qualidade da evidência

Trate as incertezas explicitamente, separando componente estatística e
sistemática:

- **Instrumento.** Resolução da escala usada (tipicamente 0,01 kΩ em 200 kΩ) e
  exatidão declarada no manual (por exemplo, ±0,8% da leitura + 3 dígitos).
  A exatidão é sistemática: afeta previsão e medida no mesmo sentido quando o
  mesmo instrumento mede componentes e rede.
- **Componentes.** Dispersão s do lote e incerteza da média \(u(\bar{R})\).
  Propague para a previsão: pela homogeneidade, a incerteza relativa da
  previsão com \(\bar{R}\) é a própria incerteza relativa de \(\bar{R}\).
- **Montagem.** Resistência de contato da protoboard (dezenas de mΩ por ponto,
  desprezível diante de 10 kΩ) e contatos mal assentados (não desprezíveis —
  relate qualquer leitura instável e o que foi feito).
- **Operador.** Contato dos dedos com as pontas, paralaxe nula em display
  digital, tempo de estabilização da leitura.

Avalie, ao final, se a qualidade da evidência sustenta distinguir \(R_3\) do
limite infinito — ou se, na sua bancada, três degraus e infinitos degraus são
experimentalmente a mesma coisa.

________________________________________________________________________________

________________________________________________________________________________

## Discussão

Responda de forma argumentada, citando seus números:

1. Por que a resistência **diminui** a cada degrau acrescentado, se estamos
   adicionando resistores à rede? Relacione com o caminho em paralelo que cada
   degrau novo oferece à corrente.
2. De onde vem o \(\sqrt{3}\) em uma rede feita só de resistores iguais? Em que
   sentido ele pertence à estrutura, e não aos componentes?
3. Se a escada fosse terminada com um resistor de 27 kΩ (valor comercial
   próximo de \(R_\infty\)) em vez de ficar aberta, o que aconteceria com
   \(R_{AB}\) já no primeiro degrau? Conecte com o conceito de casamento de
   impedância e com o papel da terminação em uma linha de transmissão.
4. A previsão fina aproximou a medida melhor que a previsão com \(\bar{R}\)?
   Em que condições as duas deveriam coincidir?
5. A analogia com o atenuador em escada: a queda geométrica das tensões no
   varal (fator \(2-\sqrt{3}\) por degrau) é o mesmo mecanismo que faz a
   resistência de entrada convergir. Discuta como uma rede finita pode
   "parecer infinita" vista dos terminais.

________________________________________________________________________________

________________________________________________________________________________

________________________________________________________________________________

## Conclusão

Retome a questão investigativa e a hipótese: as medidas confirmaram a sequência
\(3R \to 11R/4 \to 41R/15\) dentro das incertezas? Nove resistores bastaram
para realizar a escada infinita? Sustente a resposta com a comparação numérica
entre o erro de truncamento e a dispersão dos componentes, e aponte o que seria
necessário para distinguir \(R_3\) de \(R_\infty\).

________________________________________________________________________________

________________________________________________________________________________

## Referências e anexos

- HALLIDAY, D.; RESNICK, R.; WALKER, J. *Fundamentos de Física*, vol. 3 —
  circuitos de corrente contínua, associações em série e paralelo.
- FEYNMAN, R. *Lectures on Physics*, vol. II, cap. 22 — redes em escada e
  impedância característica.
- Manual do multímetro utilizado (exatidão por escala).
- Anexos: foto ou desenho da montagem com a numeração dos resistores em cada
  posição.

## Checklist de entrega

- [ ] identificação completa e objetivo com as próprias palavras;
- [ ] previsão original das três etapas preservada, com o \(\bar{R}\) usado;
- [ ] Tabela 1 completa, com média, desvio-padrão e verificação de tolerância;
- [ ] Tabela 2 com previsão, medida e diferença percentual das três etapas;
- [ ] derivação de \(R_\infty=\left(1+\sqrt{3}\right)R\) com o descarte da raiz negativa justificado;
- [ ] razões de convergência comparadas com \((2-\sqrt{3})^2\);
- [ ] análise truncamento × tolerância com conclusão explícita;
- [ ] incertezas de instrumento, componentes e montagem discutidas;
- [ ] extensão das tensões (se realizada) comparada com \(2-\sqrt{3}\);
- [ ] conclusão compatível com as evidências apresentadas.
