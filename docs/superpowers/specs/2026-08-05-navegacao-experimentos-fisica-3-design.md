# Navegação por capítulos e experimentos de Física III — Design

**Data:** 05/08/2026  
**Projeto:** Eletromagnetismo-aulas  
**Fonte técnica principal:** AZEHEB, *Manual de Instruções e Guia de Experimentos — Conjunto de Eletromagnetismo (Basic)*, revisão 12, 20/11/2020.

## Objetivo

Transformar o catálogo atual em um acervo didático escalável, organizado por
áreas e capítulos, e publicar quatro roteiros de laboratório de Física III
baseados no equipamento recém-recebido pelo IFSP. Os roteiros devem conservar a
montagem real do manual, mas elevar o tratamento conceitual e matemático ao nível
de estudantes de Engenharia e Física.

## Decisões de organização

O site terá quatro destinos permanentes na navegação principal:

1. **Início:** visão geral e busca em todo o acervo;
2. **Exercícios:** escolha da referência e do capítulo;
3. **Experimentos:** roteiros de laboratório e relatórios;
4. **Simulações:** atividades interativas.

A separação não dependerá somente de filtros. Cada área terá uma URL própria e
compartilhável:

```text
site/
├── index.html
├── exercicios/
│   ├── index.html
│   ├── capitulo-21/index.html
│   └── halliday-21-*/index.html
├── experimentos/
│   ├── index.html
│   ├── 01-campo-corrente/index.html
│   ├── 02-campo-solenoide/index.html
│   ├── 03-forca-magnetica-motor/index.html
│   └── 04-inducao-eletromagnetica/index.html
└── simuladores/
    ├── index.html
    └── cargas-e-vetores/index.html
```

O arquivo de catálogo continuará sendo a fonte única de metadados. Cada item
receberá uma área (`exercicios`, `experimentos` ou `simulacoes`); exercícios
receberão também referência, capítulo e número. Isso permitirá acrescentar
capítulos sem alterar o componente de navegação.

## Navegação dos exercícios

A página `exercicios/index.html` mostrará os capítulos disponíveis. Inicialmente
haverá um cartão para **Halliday — Capítulo 21**, com quantidade de exercícios e
os temas abordados.

A página `exercicios/capitulo-21/index.html` reunirá os exercícios 13, 18, 34 e
42. Cada página individual ganhará uma faixa gerada pelos metadados do catálogo:

```text
Capítulo 21  [13] [18] [34] [42]
← exercício anterior                  próximo exercício →
```

A faixa indicará o exercício atual, funcionará por teclado e manterá um link
para a visão completa do capítulo. Assim, um novo exercício do capítulo passará
a aparecer automaticamente após ser registrado.

## Navegação das áreas

Um componente único montará a navegação principal em todas as páginas. Cada
página informará apenas o caminho relativo até a raiz e a área ativa. A marca
visual permanecerá a de um caderno de laboratório: papel quadriculado, linhas
técnicas, códigos de experimento e cores já usadas para vetores.

A mudança visual será evolutiva, não uma reformulação. A assinatura nova será um
**seletor de bancada**: três grandes placas rotuladas Exercícios, Experimentos e
Simulações, com contagem de materiais. A hierarquia visual representará a
organização real, sem ornamentos que não tenham função.

## Estrutura comum dos experimentos

Cada experimento será uma página independente com quatro abas:

### 1. Montagem

- objetivos de aprendizagem;
- material do kit realmente utilizado;
- alerta de segurança sobre aquecimento e ciclos de energização;
- fotografia extraída do manual;
- sequência operacional reescrita para a turma;
- previsões que o grupo deve registrar antes de ligar a fonte.

### 2. Fundamentos

- modelo físico e hipóteses;
- desenvolvimento matemático passo a passo;
- conexão entre o modelo ideal e a montagem real;
- análise dimensional;
- limites de validade e fontes de desvio.

### 3. Dados e análise

- tabelas em branco adequadas à grandeza observada;
- definição de variáveis e unidades;
- gráficos ou comparações exigidos;
- propagação de incertezas quando houver dados quantitativos;
- roteiro para confronto entre previsão e observação.

### 4. Relatório

- estrutura mínima da entrega;
- perguntas conceituais e quantitativas;
- equações que devem ser demonstradas;
- itens de discussão crítica;
- checklist de evidências: fotografia, tabela, gráfico, cálculo e conclusão.

As páginas serão imprimíveis. No celular, tabelas e fórmulas terão rolagem local,
sem produzir overflow na página.

## Conteúdo dos quatro roteiros

### Experimento 1 — Campo magnético gerado por corrente elétrica

**Base do manual:** páginas PDF 4 a 6 (manual do professor) e 18 a 20
(manual do aluno).

O roteiro manterá a bússola acima e abaixo do condutor e a inversão da corrente.
O aprofundamento incluirá:

- lei de Biot-Savart;
- dedução por simetria e lei de Ampère:
  `B(r) = μ₀I/(2πr)`;
- correção explícita da afirmação do manual de que o campo variaria com `1/r²`;
- superposição com a componente horizontal do campo terrestre;
- relação de deflexão `tan φ = B_fio/B_T`;
- extensão quantitativa opcional com amperímetro e régua.

### Experimento 2 — Campo magnético de um solenoide

**Base do manual:** páginas PDF 7 a 9 e 21 a 23.

O roteiro manterá limalha de ferro, bússola e identificação dos polos. O
aprofundamento incluirá:

- dedução do solenoide ideal `B = μ₀nI`;
- campo sobre o eixo de um solenoide finito;
- fator geométrico e efeitos de borda;
- interpretação das linhas de campo sem tratá-las como trajetórias materiais;
- comparação entre interior, extremidades e exterior;
- proposta opcional de mapeamento quantitativo com sensor Hall.

### Experimento 3 — Força magnética e motor elementar

**Base do manual:** páginas PDF 10 a 14 e 24 a 27. As duas partes permanecerão
na mesma página.

O aprofundamento incluirá:

- força de Lorentz e passagem para `dF = I dℓ × B`;
- resultado `F = BIL sin θ` para trecho retilíneo;
- análise de sinais ao inverter corrente e campo;
- momento de dipolo `μ = NIA`;
- torque `τ = μ × B` e energia `U = -μ·B`;
- equação dinâmica simplificada do rotor;
- papel da comutação na manutenção do torque.

### Experimento 4 — Corrente induzida por variação de fluxo

**Base do manual:** páginas PDF 15 a 16 e 28 a 29.

O roteiro manterá o galvanômetro e os movimentos de aproximação, repouso e
afastamento do ímã. O aprofundamento incluirá:

- fluxo `Φ_B = ∫ B·dA`;
- lei de Faraday-Lenz `ε = -N dΦ_B/dt`;
- ímã em movimento: `ε = -Nv dΦ_B/dz`;
- relação entre rapidez e pico de deflexão;
- inversão de polo e de movimento;
- modelo de circuito `L di/dt + Ri = ε(t)`;
- distinção entre fluxo magnético e campo magnético.

## Imagens e direitos

O próprio manual declara permitida a reprodução para instituições de ensino e
uso em laboratório, sem venda. Serão extraídas apenas as figuras de montagem
necessárias, sem publicar o PDF completo. Cada figura terá:

- texto alternativo próprio;
- legenda explicando o que observar;
- crédito “Fonte: manual AZEHEB, revisão 12 (2020), uso educacional”;
- nome de arquivo associado ao experimento e à ação mostrada.

As imagens escolhidas são:

- experimento 1: placa com condutor e bússola;
- experimento 2: placa com solenoides, padrão de limalha e montagem completa;
- experimento 3: balanço magnético e rotor do motor elementar;
- experimento 4: montagem geral, aproximação e afastamento do ímã.

## Segurança

Todos os roteiros repetirão os limites operacionais relevantes do fabricante:

- iniciar com chave desligada e controle no mínimo;
- aumentar a alimentação gradualmente;
- limitar a energização contínua a 5–10 s;
- intercalar 5–10 s de resfriamento;
- trabalhar preferencialmente até metade do curso do controle;
- manusear a placa pelas bordas;
- afastar limalha de ferro de conexões e limpar a bancada após o uso.

Os roteiros não pressuporão tensão de rede exposta; a alimentação será a fonte
de 6 VCC fornecida com o conjunto.

## Paralelização e propriedade de arquivos

Depois da infraestrutura comum estar pronta, quatro subagentes trabalharão em
paralelo. Cada um será proprietário de uma única pasta de experimento e não
editará catálogo, CSS compartilhado, componentes ou páginas dos colegas.

| Agente | Pasta exclusiva | Responsabilidade |
|---|---|---|
| 1 | `site/experimentos/01-campo-corrente/` | Oersted, Biot-Savart e Ampère |
| 2 | `site/experimentos/02-campo-solenoide/` | solenoide ideal e finito |
| 3 | `site/experimentos/03-forca-magnetica-motor/` | força, torque e motor |
| 4 | `site/experimentos/04-inducao-eletromagnetica/` | Faraday-Lenz e circuito induzido |

Cada agente criará `index.html` e `relatorio.md`, usará somente as imagens já
preparadas pelo agente principal e devolverá um resumo das derivações e das
decisões experimentais.

## Testes e critérios de aceite

- catálogo com nove materiais: uma simulação, quatro exercícios e quatro experimentos;
- filtros das três áreas funcionando com e sem acentos;
- página de Exercícios mostra Capítulo 21 e quatro exercícios;
- todas as páginas de exercício apresentam a navegação do capítulo;
- cada experimento possui quatro abas, ao menos uma imagem creditada, aviso de
  segurança, desenvolvimento matemático, tabela de dados e roteiro de relatório;
- nenhuma página contém U+20D7, links quebrados ou overflow horizontal global;
- navegação por teclado, títulos e descrições alternativas presentes;
- testes Node e testes Python/py5 existentes permanecem verdes;
- validação em navegador real no desktop e em largura de 390 px;
- GitHub Pages publica o mesmo SHA validado localmente e todas as novas rotas
  respondem HTTP 200.

## Fora de escopo nesta entrega

- transformar os roteiros em simulações numéricas novas;
- gerar PDFs finais dos relatórios;
- inventariar componentes que não aparecem no manual ou no conjunto entregue;
- substituir medições reais por valores simulados;
- reproduzir integralmente o manual da AZEHEB.
