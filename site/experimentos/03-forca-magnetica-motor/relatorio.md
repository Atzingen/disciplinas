# Relatório — Experimento 03: força magnética e motor elementar

## Identificação

- Estudante(s):
- Turma / curso:
- Data:
- Bancada / grupo:
- Professor(a):
- Referencial adotado para os sentidos:

## Objetivos e previsões

Resuma, com suas palavras, os objetivos das duas partes:



Antes de energizar, registre as previsões originais. Não apague uma previsão que
depois se mostre incompatível com a observação.

- Campo com o polo N vermelho para cima:
- Força para corrente do borne vermelho para o preto:
- Efeito previsto ao inverter somente a corrente:
- Efeito previsto ao inverter somente o ímã:
- Efeito previsto ao inverter corrente e campo:
- Sentido previsto para a partida do rotor:
- Orientações previstas para torque máximo e torque nulo:

## Segurança

Confirme as condições adotadas durante a prática:

- [ ] Montagem feita com chave desligada e dial no mínimo.
- [ ] Pulsos de energização de 5–10 s intercalados com 5–10 s desligado.
- [ ] Dial mantido no máximo até metade do curso.
- [ ] Placa manuseada pelas bordas.
- [ ] Dedos, cabelos, roupas e cabos mantidos longe do rotor.
- [ ] Ímã em U invertido ou afastado com a chave desligada e sem risco de prender os dedos.

Descreva qualquer desvio, aquecimento, contato mecânico ou incidente:



## Dados

### Parte I — balanço e força magnética

| Sentido de I | Polos / sentido de B | Previsão de F | Deslocamento observado | Concordância |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

Notas sobre posição de repouso, primeiro deslocamento, oscilação e repetibilidade:



### Parte II — motor elementar

| Configuração | Sentido de partida | Estabilidade | Corrente opcional | Período / rotação opcional |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |
|  |  |  |  |  |

Notas sobre posição morta, impulso inicial, contato, atrito, ruído e efeito de
reduzir a corrente ou afastar o ímã:



### Instrumentação opcional

Amperímetro, régua e cronômetro são extensões opcionais e não estão incluídos no
kit deste roteiro. Preencha somente se foram realmente usados.

- Instrumento / identificação:
- Resolução:
- Faixa:
- Procedimento de leitura:
- Calibração conhecida do balanço, se houver:

## Diagramas vetoriais

Anexe ou desenhe:

1. As quatro combinações de I e B da Parte I, sempre com F e o referencial.
2. Os dois ramos longos do rotor com I, B e F.
3. A normal da espira, o momento μ, o campo B e o eixo do torque.

Espaço para diagramas e legendas:





## Análise

### 1. Da carga ao fio

Explique cada passagem, incluindo a orientação vetorial e as hipóteses de campo
uniforme e trecho retilíneo:

- F = qv × B
- dF = I dℓ × B
- F = BIL sin θ



### 2. Teste das inversões

Compare os dados com:

- F(−I, B) = −F(I, B)
- F(I, −B) = −F(I, B)
- F(−I, −B) = F(I, B)

Quais relações foram confirmadas, refutadas ou ficaram inconclusivas? Use os
dados, não apenas a regra da mão direita.



### 3. Torque, trabalho e estabilidade

Partindo do par de forças, interprete:

- μ = NIA
- τ = μ × B
- U = −μ·B

Explique como a espira pode ter força resultante nula e torque não nulo. Indique
os equilíbrios estável e instável e relacione o trabalho eletromagnético à
variação da energia potencial.



### 4. Comutação e dinâmica do rotor

Use a equação

Jθ¨ + bθ˙ = τ_em(θ) − τ_carga

para discutir a partida, as posições de torque nulo, o atrito e o regime
observado. Explique por que a corrente precisa ser invertida ou interrompida na
metade desfavorável do giro para evitar torque de frenagem após meia volta.



### 5. Análise dimensional

Verifique e explique:

- [qvB] e [BIL] em newtons;
- [μ] em A·m²;
- [μB] em N·m, dimensão comum a torque e energia;
- [Jθ¨], [bθ˙] e [τ] em N·m.



### 6. Comparação quantitativa opcional

Se B, I, L e θ foram medidos independentemente, calcule F_mod = BIL sin θ e
compare com uma força experimental somente se houver calibração conhecida do
balanço. Para n voltas em Δt, use T = Δt/n e ω = 2πn/Δt. Caso contrário,
declare por que a comparação deve permanecer qualitativa.

- Cálculos:


- Comparação:


## Incerteza

Separe incerteza de leitura, dispersão entre tentativas e limitações do modelo.
Considere resolução opcional, oscilação, retorno ao zero, folga, atrito,
alinhamento, posição do ímã, não uniformidade de B, aquecimento e contato
elétrico.

- Fontes dominantes de incerteza:
- Método de estimativa:
- Resultado com unidade e algarismos significativos, se quantitativo:
- Impacto sobre a conclusão de sinal:

Se as grandezas forem independentes, discuta a aplicabilidade de

u(F_mod)/F_mod = √[(u(B)/B)² + (u(I)/I)² + (u(L)/L)² + (cot θ · u(θ))²].

Para T = Δt/n, com n contado sem ambiguidade, compare u(T)/T com u(Δt)/Δt.

## Perguntas

1. Por que a força magnética sobre uma carga não realiza trabalho diretamente, mas o motor pode entregar trabalho mecânico?
2. Qual inversão muda o sinal da força? Qual dupla inversão o preserva?
3. Como forças opostas nos ramos da espira formam um binário?
4. Quais orientações minimizam e maximizam U = −μ·B?
5. O que aconteceria após meia volta sem comutação nem interrupção da corrente?
6. Por que um pequeno impulso pode ser necessário sem ser a causa da rotação sustentada?
7. Que evidência distingue posição morta, torque insuficiente, mau contato e atrito excessivo?
8. Qual conclusão permanece válida se nenhum instrumento quantitativo opcional foi usado?

Respostas:



## Conclusão

Retome separadamente os objetivos das Partes I e II. Diga quais previsões foram
sustentadas pelos dados, quais limites impedem uma afirmação quantitativa e como
força, torque, energia, comutação e dinâmica explicam o conjunto das
observações.



## Checklist de entrega

- [ ] Identificação e referencial de sinais completos.
- [ ] Segurança e eventuais desvios documentados.
- [ ] Tabelas das duas partes preenchidas.
- [ ] Previsões preservadas e separadas das observações.
- [ ] Diagramas vetoriais com I, B, F, μ e τ identificados.
- [ ] Derivação da força no fio e análise do par de forças.
- [ ] Energia, estabilidade, trabalho e comutação discutidos.
- [ ] Incerteza e limites do modelo declarados.
- [ ] Perguntas respondidas e conclusão sustentada pelos dados.
