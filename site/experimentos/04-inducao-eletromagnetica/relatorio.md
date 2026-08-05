# Relatório — Experimento 4: indução eletromagnética por variação de fluxo

**Curso/turma:** ________________________________________________

**Data:** ____/____/________

**Grupo:** ____________________

**Integrantes:** ________________________________________________

> Preencha somente com observações e medições feitas pelo grupo. Não substitua
> lacunas por valores teóricos, simulados ou inventados.

## Objetivo

Explique, com suas palavras, como o movimento relativo entre ímã e bobina será
usado para investigar a lei de Faraday–Lenz e a resposta do circuito real.

________________________________________________________________________________

________________________________________________________________________________

## Segurança

Confirme antes de iniciar:

- [ ] fonte de 6 V/1 A desligada e desconectada da bobina durante o roteiro principal;
- [ ] cabos da bobina ligados somente ao galvanômetro e posições registradas;
- [ ] galvanômetro apoiado, sem impacto e sem risco de fim de escala;
- [ ] primeiros movimentos executados lentamente;
- [ ] ímã de neodímio afastado de eletrônicos, mídias magnéticas e pessoas com dispositivos médicos implantáveis;
- [ ] se algum setor energizado for usado em extensão separada, ciclo limitado a **5–10 s** ligado e igual intervalo desligado para resfriamento.

Registre qualquer incidente, impacto, contato intermitente, fim de escala ou
interrupção do procedimento:

________________________________________________________________________________

## Convenção de sinais e previsão

Antes de mover o ímã, desenhe e identifique:

- a normal positiva da bobina;
- o eixo z e o sentido positivo de v = dz/dt;
- o sentido positivo de circulação pela regra da mão direita;
- o polo voltado à bobina;
- os bornes e as cores dos cabos;
- a deflexão do ponteiro adotada como sinal positivo.

**Diagrama da convenção:**




**Previsão original:**

| Polo voltado à bobina | Estado | Sinal previsto | Pico relativo previsto | Justificativa |
|---|---|---|---|---|
| N | aproxima |  |  |  |
| N | parado |  |  |  |
| N | afasta |  |  |  |
| S | aproxima |  |  |  |
| S | parado |  |  |  |
| S | afasta |  |  |  |

Preveja também como o pico deve mudar entre movimentos lento, moderado e rápido
pela mesma trajetória:

________________________________________________________________________________

## Dados

Régua, cronômetro, sensor de posição e sistema de aquisição são extensões
opcionais e **não estão incluídos no kit**. Registre v somente quando tiver sido
medida; caso contrário, use categorias qualitativas consistentes. Informe pico
em µV apenas se a leitura da escala e sua calibração permitirem; em caso
contrário, use divisões e declare isso.

| Ensaio | Polo | Aproxima / parado / afasta | Rapidez qualitativa ou v (m/s) | Direção do ponteiro / sinal | Pico observado | Duração (s) | Observações |
|---|---|---|---|---|---|---:|---|
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

**Menor divisão da escala do galvanômetro:** _________________________________

**Regra de leitura e resolução adotada:** ____________________________________

**Posição de repouso antes da série:** _______________________________________

**Posição de repouso depois da série:** ______________________________________

**Trajetória e posições inicial/final:** ______________________________________

**Instrumentos opcionais usados, com resolução e taxa de amostragem:** ________

________________________________________________________________________________

## Análise

### 1. Fluxo e lei de Faraday–Lenz

Defina os símbolos e a orientação usada:

Φ_B = ∫ B·dA

ε = −N dΦ_B/dt

Explique o sinal de Lenz como oposição à mudança do fluxo, e não necessariamente
ao próprio fluxo:

________________________________________________________________________________

________________________________________________________________________________

### 2. Movimento e regra da cadeia

Com Φ_B = Φ_B(z) e v = dz/dt:

dΦ_B/dt = (dΦ_B/dz)(dz/dt) = v dΦ_B/dz

ε = −Nv dΦ_B/dz

Use essa derivação para explicar:

- a inversão de sinal ao trocar aproximação por afastamento;
- a inversão de sinal ao trocar o polo do ímã;
- a recuperação do sinal inicial quando polo e movimento são invertidos juntos;
- a tendência de aumento de |ε_pico| com a rapidez, sob a mesma trajetória.

________________________________________________________________________________

________________________________________________________________________________

### 3. Aproximação, repouso e afastamento

Compare os três estados para o mesmo polo e os mesmos cabos:

| Estado | Sinal observado | Interpretação de Φ_B | Interpretação de dΦ_B/dt |
|---|---|---|---|
| aproxima |  |  |  |
| parado |  |  |  |
| afasta |  |  |  |

Explique explicitamente por que um ímã parado pode produzir B e Φ_B não nulos,
enquanto dΦ_B/dt = 0 e, portanto, ε = 0:

________________________________________________________________________________

### 4. Resposta RL

Considere R como a resistência total da bobina, dos cabos e do galvanômetro, e L
como a autoindutância efetiva:

L di/dt + Ri = ε(t)

Discuta a constante de tempo τ_e = L/R e o limite quase-estacionário i≈ε/R.
Explique como a autoindutância, a inércia e o amortecimento do ponteiro podem
alterar o pico de um pulso rápido:

________________________________________________________________________________

________________________________________________________________________________

### 5. Análise dimensional

Complete e comente:

- [Φ_B] = T·m² = Wb;
- [dΦ_B/dt] = Wb/s = ________;
- [v dΦ_B/dz] = (m/s)(Wb/m) = ________;
- [L di/dt] = H·A/s = ________;
- [Ri] = Ω·A = ________.

### 6. Gráfico opcional

Se v foi medida para uma mesma trajetória, construa o gráfico **|ε_pico| versus
rapidez**, inclua barras de incerteza e identifique polo e sentido do movimento.
Avalie em que intervalo uma tendência aproximadamente linear é compatível com os
dados. Não faça esse gráfico quantitativo usando apenas rótulos qualitativos.

**Gráfico/anexo:** ______________________________________________________________

**Interpretação:**

________________________________________________________________________________

## Incerteza

Registre as contribuições sem atribuir precisão que os instrumentos não possuem.

| Fonte | Estimativa / resolução | Efeito provável | Como foi controlada |
|---|---:|---|---|
| menor divisão e leitura do galvanômetro |  |  |  |
| ajuste de zero e paralaxe |  |  |  |
| repetibilidade do pico |  |  |  |
| rapidez ou duração do movimento |  |  |  |
| posição inicial e profundidade final |  |  |  |
| alinhamento axial e deslocamento lateral |  |  |  |
| resposta mecânica do ponteiro |  |  |  |

Se o movimento foi repetido em condições equivalentes, apresente número de
repetições, medida de tendência central escolhida e dispersão:

________________________________________________________________________________

Se v≈Δz/Δt foi calculada, apresente as resoluções de régua e cronômetro/sensor e
a propagação usada:

________________________________________________________________________________

Discuta separadamente possíveis vieses: trajetórias diferentes entre ensaios,
contatos intermitentes, perda do pico por resposta lenta, mudança de alinhamento
e comparação de regiões distintas de dΦ_B/dz.

________________________________________________________________________________

## Perguntas

1. Por que aproximação e afastamento do mesmo polo geram sinais opostos?
2. Por que inverter o polo também inverte o sinal para o mesmo movimento?
3. Como podem existir B e Φ_B não nulos sem deflexão sustentada?
4. Por que a lei de Lenz se opõe à mudança do fluxo, e não a qualquer fluxo?
5. Em quais condições |ε_pico| deve ser aproximadamente proporcional à rapidez?
6. Como a constante L/R modifica o sinal de corrente em relação a ε(t)?
7. Como a dinâmica do galvanômetro pode mascarar um pico muito rápido?
8. Que controles distinguem efeito de rapidez de efeito de trajetória e alinhamento?

## Conclusão

Retome o objetivo e conclua somente o que os dados sustentam. Separe:

- os sinais para aproximação, repouso e afastamento;
- o efeito de inverter o polo e o movimento;
- o acordo ou desacordo com Faraday–Lenz;
- a relação entre pico e rapidez, apenas se medida;
- o papel do circuito RL e do instrumento;
- a principal limitação e uma melhoria concreta do procedimento.

________________________________________________________________________________

________________________________________________________________________________

## Checklist de entrega

- [ ] identificação e objetivo preenchidos;
- [ ] segurança confirmada e fonte desconectada da bobina;
- [ ] previsão original preservada;
- [ ] diagrama com normal, eixo, circulação, polo, cabos e sinal;
- [ ] estados aproxima–parado–afasta comparados;
- [ ] tabela com unidades e apenas dados obtidos;
- [ ] derivações de Faraday–Lenz e da regra da cadeia;
- [ ] análise dimensional completa;
- [ ] resposta RL e limite i≈ε/R discutidos;
- [ ] incerteza, resolução, repetibilidade, rapidez e alinhamento avaliados;
- [ ] gráfico incluído somente se houver velocidade medida;
- [ ] perguntas respondidas;
- [ ] conclusão compatível com as evidências.
