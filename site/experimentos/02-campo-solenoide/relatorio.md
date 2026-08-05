# Relatório — Experimento 2: campo magnético de um solenoide

**Grupo:** ________________________________________________

**Integrantes:** ___________________________________________

**Turma:** ____________________  **Data:** ____________________

**Bancada:** _________________  **Professor:** _______________

## Segurança

- [ ] Iniciamos com a chave desligada e o dial no mínimo.
- [ ] Usamos ciclos de 5–10 s energizado e 5–10 s desligado.
- [ ] Mantivemos o dial, no máximo, até a metade do curso e seguramos a placa pelas bordas.
- [ ] Não sopramos a limalha e a mantivemos longe de olhos, conexões, eletrônicos e ímãs.
- [ ] Recolhemos a limalha e limpamos a bancada somente com a fonte desligada.

Ocorrências ou desvios do protocolo:

________________________________________________________________________

## Previsão

Desenhe as linhas esperadas no interior, nas extremidades e no exterior. Indique
onde espera maior concentração aparente e descreva a resposta prevista da ponta
norte da bússola em cada extremidade.

________________________________________________________________________

________________________________________________________________________

## Dados

### Observações qualitativas

Defina as extremidades A e B no esquema. Registre a ponta norte da bússola como
referência e não converta densidade de limalha em módulo de campo.

| Posição | Orientação da bússola | Polo inferido | Padrão, curvatura e densidade aparente |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

Identificação da fotografia ou do esboço anexado: _______________________

### Extensão quantitativa opcional

Preencha somente se o laboratório forneceu sensor Hall, régua e amperímetro;
esses instrumentos não fazem parte do kit AZEHEB usado no roteiro.

| Ponto | z (m) | σ_z (m) | I (A) | σ_I (A) | B(z) (T) | σ_B (T) |
|---|---:|---:|---:|---:|---:|---:|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

Campo de fundo e zero do sensor: _______________________________________

Raio a e comprimento ativo ℓ, com unidades e incertezas: ______________

## Análise

### Linhas e polaridade

Explique como a limalha indica a direção local e a topologia, e como a bússola
fornece o sentido. Justifique os polos inferidos pela atração ou repulsão da
ponta norte.

________________________________________________________________________

________________________________________________________________________

### Modelo ideal

Parta da lei de Ampère, identifique a corrente envolvida pela curva escolhida e
derive:

`B_ideal = μ₀(N/ℓ)I = μ₀nI`

Hipóteses utilizadas:

________________________________________________________________________

### Modelo finito

Use o modelo axial

`B(z) = (μ₀nI/2)[(z+ℓ/2)/√(a²+(z+ℓ/2)²) − (z−ℓ/2)/√(a²+(z−ℓ/2)²)]`

e mostre seu limite no centro para ℓ ≫ a. Compare interior, extremidades e
exterior com o padrão observado. Se houve dados Hall, apresente o gráfico, o
ajuste ponderado e os resíduos; se não houve, mantenha a comparação qualitativa.

________________________________________________________________________

________________________________________________________________________

### Perguntas

1. Por que a limalha não mede o módulo de B nem fornece o sentido das linhas?
2. Como a regra da mão direita relaciona corrente, campo interno e polo norte?
3. Qual hipótese do solenoide ideal falha de modo mais visível nas extremidades?
4. Que desvio sistemático o campo terrestre pode causar na leitura da bússola?
5. Que padrão de resíduos indicaria que o modelo escolhido ainda não descreve os dados?

## Incerteza

No roteiro qualitativo, discuta distribuição dos grãos, atrito, batidas,
repetibilidade, paralaxe e orientação inicial da bússola. Não atribua σ numérico
sem uma resolução ou repetição que o sustente.

Na extensão Hall, documente σ_z, σ_I e σ_B. Para incertezas independentes, use:

`σ_ef,i² = σ_B,i² + (∂B/∂z · σ_z,i)² + (∂B/∂I · σ_I,i)²`

Inclua as contribuições de a e ℓ quando relevantes e trate zero, calibração e
alinhamento como efeitos sistemáticos. Informe as incertezas dos parâmetros do
ajuste e χ²_red, sem inventar valores ausentes.

Principal fonte de incerteza e melhoria proposta:

________________________________________________________________________

________________________________________________________________________

## Conclusão

Responda aos objetivos com base nos dados obtidos. Separe observação de
inferência, declare se a comparação foi qualitativa ou quantitativa e explique
em que medida os efeitos de borda sustentam o modelo finito.

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

## Checklist de entrega

- [ ] Identificação e segurança preenchidas.
- [ ] Previsão registrada antes da observação.
- [ ] Esquema com eixo, linhas fechadas, setas e polos.
- [ ] Fotografia ou desenho e tabela de dados brutos anexados.
- [ ] Derivação ideal e limite central do modelo finito apresentados.
- [ ] Incerteza coerente com os instrumentos realmente usados.
- [ ] Perguntas respondidas e conclusão sem resultados fabricados.
