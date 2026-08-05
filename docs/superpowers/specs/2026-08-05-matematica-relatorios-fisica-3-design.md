# Matemática renderizada e relatórios de Física III - Design

**Data:** 05/08/2026<br>
**Projeto:** Eletromagnetismo-aulas<br>
**Escopo:** exercícios, simulações e quatro roteiros experimentais<br>
**Referência comparativa:** Tomaz Catunda, Euclydes Marega Jr. e colaboradores,
*Laboratório de Física III: Eletricidade e Magnetismo* (IFSC/USP, 2024),
Prática 5, seção III - Indução Eletromagnética.

## Objetivo

Elevar a apresentação matemática e os roteiros experimentais ao nível de uma
disciplina universitária de Física III para estudantes de Engenharia e Física.
A revisão deve preservar o conteúdo científico já aprovado, mas substituir a
notação textual rudimentar, a fragmentação em cartões e o modelo de relatório
escolar por uma exposição contínua, formal e orientada à investigação.

O resultado deve permitir que o estudante:

1. leia equações com a mesma hierarquia visual encontrada em livros de Física;
2. acompanhe deduções em etapas, identificando hipóteses e transformações;
3. execute a bancada em uma sequência inequívoca;
4. registre dados, trate incertezas e discuta resultados dentro de um único
   roteiro de relatório;
5. produza uma entrega acadêmica, e não apenas preencher cartões ou responder
   perguntas isoladas.

## Referência analisada e diagnóstico

Foi analisado somente um trecho da apostila indicada: a seção III, "Indução
Eletromagnética", da Prática 5. A amostra ocupa oito páginas, contém cerca de
1.050 palavras e organiza 16 etapas numeradas. A progressão observada é:

1. apresentação do fenômeno e do instrumento;
2. montagem inicial com bobina, ímã e galvanômetro;
3. observação livre antes da formalização;
4. controle de direção, velocidade e polaridade;
5. introdução da lei de Lenz;
6. previsão e registro do sentido dos campos;
7. repetição sistemática com novas configurações;
8. síntese solicitada explicitamente para o relatório.

A referência não será copiada. Ela será usada apenas para calibrar extensão,
ritmo e continuidade. Nossos roteiros conservarão o equipamento AZEHEB, as
imagens já creditadas e a fundamentação mais desenvolvida que já foi produzida.

O diagnóstico do experimento 4 atual mostra que a deficiência não está apenas
na contagem de palavras:

- a página contém 24 cartões;
- a aba Relatório apresenta aproximadamente 420 palavras;
- outras 398 palavras e a tabela principal estão isoladas na aba Dados;
- o arquivo `relatorio.md` é mais completo, mas não está integralmente
  representado na página;
- a sequência didática é interrompida por grades de dois cartões lado a lado.

Assim, o trabalho principal é recompor a continuidade entre previsão,
procedimento, registro, análise e discussão.

## Decisão sobre renderização matemática

Será usado **MathJax 4.1.2**, com entrada TeX/LaTeX e saída CommonHTML. A versão
será fixada na URL do CDN para impedir mudanças visuais inesperadas. A
configuração seguirá a documentação oficial do MathJax:

- `\(...\)` para matemática em linha;
- `\[...\]` para equações destacadas;
- ambientes como `aligned`, `gathered` e `cases` dentro dos delimitadores;
- quebra de linha e rolagem local como proteção para telas estreitas;
- recursos de exploração e acessibilidade mantidos ativos.

O carregamento será centralizado em `site/componentes/matematica.js`. Esse
componente deverá:

1. definir a configuração antes de carregar o MathJax;
2. carregar a versão fixada uma única vez;
3. expor uma função para renderizar novamente regiões atualizadas por
   JavaScript, necessária nos simuladores;
4. manter o LaTeX original legível caso o CDN esteja indisponível;
5. emitir um evento de prontidão usado pelos testes de navegador.

Os relatórios Markdown usarão `$...$` e `$$...$$`, sintaxe renderizada pelo
próprio GitHub com MathJax.

## Norma editorial para equações

### Matemática em linha

Símbolos, relações curtas e unidades que fazem parte da frase serão escritos em
modo matemático. Exemplos:

- o campo $\vec{B}$;
- a condição $q_1q_2<0$;
- a distância $r=10{,}0\,\mathrm{cm}$;
- a incerteza padrão $u(I)$.

Não serão usados itálicos HTML para simular variáveis, caracteres Unicode para
simular derivadas ou barras comuns para frações matemáticas.

### Equações destacadas

Resultados que estruturam o raciocínio ocuparão uma linha própria, com frações,
raízes, vetores, índices e unidades em LaTeX. Cada bloco poderá receber um
rótulo editorial curto, como "Lei de Coulomb", "Modelo", "Propagação" ou
"Resultado". Numeração será usada quando a equação for citada posteriormente.

### Deduções

Deduções serão escritas como uma cadeia vertical, e não como vários cartões
independentes. Cada transformação importante terá uma justificativa textual.
O padrão será:

$$
\begin{aligned}
\text{expressão inicial}
  &\quad &&\text{hipótese ou lei utilizada},\\
\text{transformação intermediária}
  &\quad &&\text{substituição ou simetria},\\
\text{resultado}
  &\quad &&\text{condição de validade}.
\end{aligned}
$$

As deduções deverão declarar:

- sistema de coordenadas e convenção de sinais;
- significado e unidade das variáveis;
- aproximações usadas;
- domínio de validade;
- interpretação física do resultado.

### Consistência de notação

- vetores: $\vec{E}$, $\vec{B}$, $\vec{F}$ e $\vec{\mu}$;
- módulos: $E$, $B$, $F$ e $\mu$, sem seta;
- diferenciais: $\mathrm{d}t$, $\mathrm{d}\vec{\ell}$ e $\mathrm{d}A$;
- unidades: `\mathrm{N}`, `\mathrm{T}`, `\mathrm{A}` e `\mathrm{m}`;
- subscritos descritivos: $B_{\mathrm{Terra}}$ e
  $\tau_{\mathrm{carga}}$;
- produto vetorial: `\times`; produto escalar: `\cdot`;
- decimais em português dentro da matemática: `10{,}0`.

## Nova arquitetura das páginas experimentais

As quatro abas atuais serão reduzidas a três:

1. **Montagem**;
2. **Fundamentação**;
3. **Roteiro e relatório**.

A aba Dados será removida. Suas tabelas, variáveis, orientações de aquisição,
gráficos e incertezas serão incorporados à sequência de Roteiro e relatório.

### Montagem

A montagem deixará de ser uma grade de cartões. Ela será um artigo contínuo com
largura de leitura controlada e a seguinte ordem:

1. questão investigativa e objetivos;
2. visão geral do arranjo;
3. materiais em uma lista lateral discreta;
4. segurança em uma faixa única de destaque;
5. fotografia principal em largura ampla;
6. convenções e preparação dos instrumentos;
7. procedimento numerado;
8. previsão obrigatória antes da energização.

Listas laterais serão usadas apenas para informação de consulta. O procedimento
permanecerá em uma coluna, pois sua ordem é parte do experimento.

### Fundamentação

A fundamentação será apresentada como um capítulo curto de livro. Os tópicos
numerados formarão uma linha vertical contínua, com números na margem esquerda,
em vez de cartões em duas colunas. A estrutura será:

1. definição do fenômeno;
2. construção do modelo;
3. dedução principal;
4. conexão com a montagem real;
5. análise dimensional;
6. hipóteses, limites e fontes de desvio.

Figuras, equações e observações ficarão inseridas no ponto do texto em que são
necessárias. Caixas serão reservadas para apenas três funções: segurança,
resultado central e advertência sobre validade do modelo.

### Roteiro e relatório

Esta aba reunirá a execução e a entrega acadêmica. Ela não será uma folha com
pequenos espaços em branco. Será um documento imprimível com seções
sequenciais e conteúdo específico para cada experimento:

1. **Identificação e questão investigativa** - turma, grupo, data e problema
   físico formulado em uma frase;
2. **Preparação pré-laboratório** - previsões, diagramas, deduções mínimas e
   convenções de sinais que devem estar prontas antes da bancada;
3. **Procedimento e controles** - sequência operacional, variáveis controladas,
   variáveis independentes e dependentes;
4. **Registro de dados brutos** - tabelas com cabeçalho, símbolo, unidade,
   resolução instrumental e observações;
5. **Tratamento dos dados** - cálculos, gráficos, ajustes, análise de resíduos e
   propagação de incerteza quando aplicável;
6. **Discussão** - confronto entre previsão, modelo e observação, incluindo
   limitações e explicações alternativas;
7. **Conclusão** - resposta direta à questão investigativa, com resultado e
   incerteza quando houver medida quantitativa;
8. **Referências e anexos** - fontes consultadas, fotografias autorizadas,
   cálculos auxiliares e código utilizado.

O texto deverá orientar a redação acadêmica: figuras e tabelas numeradas,
grandezas com unidade, algarismos significativos coerentes, equações definidas
antes do uso e ausência de valores inventados. As perguntas conceituais serão
incorporadas à discussão; não aparecerão como um questionário juvenil separado.

O conteúdo completo da aba e o `relatorio.md` correspondente deverão ser
equivalentes. A impressão deverá produzir um roteiro de aproximadamente seis a
dez páginas, dependendo das figuras e tabelas do experimento.

## Sequência específica dos quatro relatórios

### Experimento 1 - Campo de uma corrente

O relatório partirá da previsão de Oersted e seguirá inversões de corrente,
posição relativa fio-bússola e número de espiras. A análise deverá distinguir
resultado qualitativo da estimativa quantitativa pela lei da tangente. Se houver
medidas suficientes, o estudante estimará a componente horizontal do campo
terrestre e discutirá a validade da aproximação do fio retilíneo infinito.

### Experimento 2 - Campo de um solenoide

O roteiro começará pelo mapeamento qualitativo das linhas de campo e avançará
para a dependência com corrente, número de espiras e posição axial. Medidas com
sensor, quando disponível, serão comparadas aos modelos de solenoide ideal e
finito. A discussão deverá separar uniformidade, efeitos de borda e influência
de núcleo magnético.

### Experimento 3 - Força magnética e motor

As partes balanço e motor permanecerão articuladas. A primeira registrará as
inversões de $I$ e $\vec{B}$ e, se possível, a dependência de $F$ com $BIL$.
A segunda analisará torque, energia potencial, posições de equilíbrio,
comutação e perdas. O relatório exigirá uma síntese que conecte força local no
condutor ao torque macroscópico do rotor.

### Experimento 4 - Indução eletromagnética

Este será o roteiro piloto da nova estrutura. A sequência seguirá o padrão
identificado na referência: exploração inicial, controle de movimento,
velocidade e polaridade, convenção de sinais, lei de Lenz e síntese. Os dados
serão organizados em uma matriz de polo, sentido do movimento, rapidez, sinal e
pico. Quando houver medida de velocidade, será solicitado o gráfico do pico em
função de $v$ e a discussão da resposta RL e do galvanômetro.

## Direção visual

A identidade de caderno de laboratório será preservada, mas com menos bordas.
O novo layout terá:

- coluna principal entre 760 e 880 px para leitura;
- numeração vertical grande e discreta na margem;
- linhas horizontais para separar etapas, sem caixas ao redor de cada tópico;
- figuras em largura total ou alinhadas ao texto;
- tabelas com cabeçalhos técnicos e rolagem local no celular;
- equações em uma superfície clara, sem aparência de bloco de código;
- uma única cor de acento por experimento;
- impressão em preto e branco com hierarquia preservada.

A assinatura visual será a **linha de raciocínio**: uma linha vertical acompanha
os passos da fundamentação e do relatório, fazendo a página se comportar como
um registro experimental sequencial. Ela comunica ordem e dependência, não é
decoração.

## Acessibilidade e comportamento responsivo

- As abas continuarão operáveis por teclado.
- A matemática renderizada manterá os recursos de exploração do MathJax.
- O LaTeX cru será o fallback, sem ocultar conteúdo antes do carregamento.
- Equações extensas terão quebra ou rolagem local, nunca overflow da página.
- Tabelas permanecerão navegáveis horizontalmente no celular.
- A impressão ativará Roteiro e relatório e removerá navegação e controles.
- O modo de movimento reduzido continuará respeitado.

## Estratégia de testes

### Testes automatizados

1. todas as páginas com matemática carregam o componente compartilhado;
2. fórmulas editoriais usam delimitadores LaTeX;
3. blocos antigos de texto matemático deixam de existir;
4. as páginas experimentais possuem três abas e nenhuma aba Dados;
5. tabelas e orientações de aquisição aparecem em Roteiro e relatório;
6. cada `relatorio.md` usa matemática compatível com o GitHub;
7. atualizações dinâmicas do simulador solicitam nova renderização;
8. os contratos científicos já existentes continuam válidos.

### Validação no navegador

1. confirmar a presença de elementos `mjx-container` após o carregamento;
2. inspecionar exercícios, experimentos e simulador em desktop e 390 px;
3. alternar todas as abas por mouse e teclado;
4. verificar imagens, equações multilinha e tabelas sem overflow global;
5. imprimir o relatório piloto e conferir hierarquia, quebras e legibilidade;
6. repetir a inspeção no GitHub Pages após a publicação.

## Critérios de aceitação

- Nenhuma equação pedagógica relevante usa barra comum para representar fração.
- Todas as deduções centrais são apresentadas verticalmente e acompanhadas de
  hipóteses e interpretação.
- As quatro páginas experimentais têm apenas Montagem, Fundamentação e Roteiro
  e relatório.
- Não existe aba Dados independente.
- O conteúdo de dados, análise e incerteza está integrado ao relatório.
- A aba de relatório e o Markdown correspondente contêm a mesma sequência
  acadêmica.
- O experimento 4 demonstra o novo padrão comparável, em maturidade e extensão,
  à seção de indução analisada na referência.
- O layout usa continuidade e hierarquia, com caixas apenas quando possuem
  função semântica.
- Matemática, impressão, navegação e responsividade são verificadas antes da
  publicação.

## Referências técnicas

- [MathJax - Getting Started](https://docs.mathjax.org/en/stable/web/start.html)
- [MathJax - delimitadores TeX/LaTeX](https://docs.mathjax.org/en/latest/input/tex/delimiters.html)
- [MathJax - acessibilidade](https://docs.mathjax.org/en/latest/web/components/accessibility.html)
- [GitHub - expressões matemáticas em Markdown](https://docs.github.com/pt/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)
