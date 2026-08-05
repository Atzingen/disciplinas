# Relatório — Experimento 1: campo magnético gerado por corrente

**Curso/turma:** ________________________________________________

**Data:** ____/____/________

**Grupo:** ____________________

**Integrantes:** ________________________________________________

> Preencha somente com observações e medições realizadas pelo grupo. Não substitua
> lacunas por resultados simulados ou valores esperados pela teoria.

## Objetivo

Escreva, com suas palavras, o que foi investigado na experiência de Oersted e
quais efeitos seriam testados ao inverter a corrente e ao mover a bússola de um
lado para o outro do fio.

________________________________________________________________________________

________________________________________________________________________________

## Segurança operacional

Confirme antes e durante a atividade:

- [ ] dial no mínimo e chave desligada antes de conectar a fonte de 6 V/1 A;
- [ ] energização limitada a **5–10 s**;
- [ ] intervalo desligado de **5–10 s** entre observações;
- [ ] dial aumentado gradualmente e mantido, no máximo, até a metade do curso;
- [ ] placa manuseada somente pelas bordas;
- [ ] fonte desligada antes de mover a bússola ou inverter a chave.

Registre qualquer aquecimento, atuação da proteção ou interrupção do procedimento:

________________________________________________________________________________

## Previsão e montagem

Antes de energizar, desenhe a montagem e identifique:

- o sentido convencional da corrente para cada posição da chave;
- a direção inicial do norte da bússola e do campo terrestre horizontal;
- a posição da bússola acima ou abaixo do condutor;
- o sentido previsto de B_fio pela regra da mão direita;
- o sinal adotado para o ângulo φ.

**Previsão original do grupo:**

| Sentido de I | Posição da bússola | Sentido previsto de B_fio | Sinal previsto de φ |
|---|---|---|---|
|  | abaixo |  |  |
|  | acima |  |  |
|  | abaixo |  |  |
|  | acima |  |  |

**Diagrama com fio, corrente, campos e bússola:**





## Dados

Amperímetro e régua são extensões opcionais e **não estão incluídos no kit**.
Deixe I, r, φ ou B_fio em branco quando a grandeza não tiver sido medida. Se a
extensão quantitativa for realizada, informe a resolução de cada instrumento e
meça r do eixo do fio ao centro da bússola.

| Sentido da corrente | Posição acima/abaixo | r (m) | I (A) | Ângulo φ (°) | B_fio (T) | Observações |
|---|---|---:|---:|---:|---:|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

**Zero da bússola com a corrente desligada, antes da série:** ____________________

**Zero da bússola com a corrente desligada, depois da série:** ___________________

**Componente horizontal local do campo terrestre B_T,h, se conhecida:** __________

## Análise

### 1. Sentidos e regra da mão direita

Para cada configuração, confronte a previsão com a observação. Explique por que
inverter I muda o sentido de B_fio e por que atravessar o plano do fio, de abaixo
para acima, também muda esse sentido.

________________________________________________________________________________

________________________________________________________________________________

### 2. Modelo do fio retilíneo longo

Apresente a sequência de raciocínio e defina os símbolos:

`dB = (μ₀/4π) I(dℓ × r̂)/r²`

Por simetria, o campo de um fio ideal infinito é tangente a circunferências
concêntricas e tem módulo constante em cada circunferência. Para o caminho
amperiano de raio r:

`∮B·dℓ = μ₀I`

`B(r)2πr = μ₀I`

`B(r) = μ₀I/(2πr)`

Mostre também a consistência dimensional, usando `[μ₀] = T·m/A`:

________________________________________________________________________________

Explique por que o fator 1/r² da contribuição elementar de Biot–Savart não é a
dependência final do campo do fio completo. Para o fio retilíneo longo, B varia
como **1/r**, pois a integração ao longo do condutor altera a potência radial.

________________________________________________________________________________

### 3. Lei da tangente

Quando B_fio e B_T,h são horizontais e perpendiculares:

`tan φ = B_fio/B_T,h`

Se B_T,h tiver sido obtido de uma fonte confiável, calcule B_fio para cada
medição. Registre fórmula, substituição com unidades e resultado; caso contrário,
mantenha a análise qualitativa.

________________________________________________________________________________

### 4. Comparação com 1/r

Se houver medidas em três ou mais distâncias, construa um gráfico de B_fio em
função de 1/r, informe barras de incerteza e avalie se uma relação linear com
intercepto compatível com zero descreve os dados. Não afirme que a lei radial foi
confirmada a partir de um único ponto.

**Gráfico/anexo:** ______________________________________________________________

**Interpretação:**

________________________________________________________________________________

## Incerteza

Para B = μ₀I/(2πr), e supondo incertezas pequenas e independentes em I e r, use
opcionalmente:

`σ_B/B = √[(σ_I/I)² + (σ_r/r)²]`

| Grandeza | Valor | Incerteza | Origem da incerteza |
|---|---:|---:|---|
| I |  |  |  |
| r |  |  |  |
| φ |  |  |  |
| B_T,h |  |  |  |
| B_fio |  |  |  |

Discuta separadamente os efeitos que essa expressão não representa:
desalinhamento entre o fio e o campo terrestre, campo magnético local, fio e
terminais finitos, posição efetiva do centro da bússola, atrito do pivô e
aquecimento da fonte.

________________________________________________________________________________

## Perguntas conceituais

1. Por que as linhas de campo de um fio retilíneo ideal são circunferências?
2. Que simetrias permitem retirar B da integral de linha da lei de Ampère?
3. Inverter a corrente e mover a bússola de abaixo para acima produzem quais mudanças de sinal?
4. Por que 1/r² aparece em Biot–Savart, mas o campo do fio longo varia como 1/r?
5. Em quais condições a relação `tan φ = B_fio/B_T,h` deixa de ser válida?
6. Que conjunto de medidas permite distinguir experimentalmente 1/r de 1/r²?

## Conclusão

Retome o objetivo e conclua somente o que as evidências sustentam. Separe:

- existência e sentido do campo gerado pela corrente;
- acordo ou desacordo com a regra da mão direita;
- comparação quantitativa com 1/r, apenas se houver dados suficientes;
- principais limitações e uma melhoria concreta do procedimento.

________________________________________________________________________________

________________________________________________________________________________

## Checklist de entrega

- [ ] identificação e objetivo preenchidos;
- [ ] previsão original preservada;
- [ ] diagrama com corrente, campos, posição e sinais;
- [ ] fotografia ou desenho fiel da montagem;
- [ ] tabela com unidades e somente dados obtidos;
- [ ] derivação e análise dimensional;
- [ ] cálculos e gráfico B_fio versus 1/r, quando aplicáveis;
- [ ] incertezas e limitações discutidas;
- [ ] perguntas respondidas;
- [ ] conclusão compatível com os dados.
