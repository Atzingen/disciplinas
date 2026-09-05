# Soluções de eletromagnetismo

Foram redigidas 27 soluções para todas as questões atualmente classificadas
com o tópico `eletromagnetismo`: dez de 2024, quatorze da aplicação regular
de 2025 e três da reaplicação. Isso inclui as questões de ensino que usam
eletricidade, magnetismo ou consumo elétrico como contexto.

Os arquivos HTML são fragmentos carregados por **Ver solução**, dentro da
página da questão. **Ver gabarito** é um controle independente: a alternativa
oficial só é inserida no documento quando esse controle é aberto. Não há
comparação automática, indicação de concordância ou aprovação implícita.

## Processo de redação

Antes da redação, os enunciados e seus textos-base foram separados dos
campos `answer` e `solution`. Os recortes das figuras foram consultados
diretamente. As conclusões foram desenvolvidas a partir dos enunciados,
dos conceitos e das contas; as referências consultadas tratam dos conceitos,
não de resoluções dessas provas.

Não foi feita comparação com os gabaritos nesta etapa. Eles, entretanto,
já haviam sido processados na montagem anterior do catálogo, na mesma
conversa. Portanto, este processo não deve ser descrito como uma avaliação
sem qualquer exposição prévia ao gabarito.

`manifesto.json` registra as alternativas propostas e o estado de publicação.
Ele não armazena o gabarito oficial. A publicação dos 27 itens foi autorizada
pelo professor em 05/09/2026, após a validação da prévia. Isso não registra
uma comparação com as respostas oficiais: `comparedWithOfficialKey` continua
como `false`, e as conclusões são identificadas como alternativas propostas.

## Conteúdo e manutenção

Cada fragmento contém a interpretação do problema, raciocínio em parágrafos conectados,
equações quando pertinentes, conclusão proposta e referências. As hipóteses
e limitações relevantes ficam ao lado da explicação. Entre elas estão o
tempo de operação da bomba em 2024/35, a definição de descarga em 2024/37,
as faixas de 5G em 2024/51, os limites da analogia em 2025 regular/45, a
atuação de proteções em 2025 regular/59 e o gráfico em 2025 reaplicação/49.

A renderização reutiliza `site/componentes/matematica.js`, com os mesmos
delimitadores LaTeX dos outros exercícios: `\(...\)` e `\[...\]`.
Os blocos de cálculo seguem o padrão `math-block math-display`. A solução
aberta entra na impressão; uma solução ou gabarito recolhido fica de fora.

Para editar uma resolução, altere seu HTML diretamente. Os metadados em
`classificacao.json` precisam permanecer sincronizados com `catalogo.json`:

```json
"solution": {
  "url": "solucoes/2024-q35.html",
  "status": "publicada",
  "format": "html-fragment"
}
```

O comando de extração preserva esses metadados ao regenerar o catálogo.
O campo `data-proposed-answer` e a conclusão do fragmento devem representar
a mesma proposta registrada em `manifesto.json`. Alterações de conclusão
devem ser justificadas na explicação; a resposta não é copiada do gabarito.

Os testes verificam completude, integridade dos vínculos, filtros e contas
independentes com os dados dos enunciados. Não verificam concordância entre
propostas e gabaritos. A revisão de fórmulas e controles no navegador também
deve preservar essa separação; o controle de gabarito pode ser testado com
um valor sintético.

## Exploração visual — revisão de 05/09/2026

As 27 resoluções passaram a usar texto contínuo, sem numeração de passos ou
separadores entre cada conta. As equações e alternativas propostas anteriores
foram preservadas. O [plano de melhoria](../../../docs/superpowers/plans/2026-09-05-enade-exploracao.md)
registra o escopo e a validação.

| Questão | Exploração | Ideia a observar |
| --- | --- | --- |
| 2024/36 | Lâmpadas e resistência interna | Uma carga adicional altera a tensão terminal da pilha real. |
| 2024/37 | Redes de cinco resistores | A conectividade determina a resistência equivalente. |
| 2024/42 | Ímã arrastável e bobina | Fluxo constante não sustenta tensão induzida; rapidez e sentido importam. |
| 2024/62 | Metal, comprimento de onda e intensidade | A função trabalho muda o limiar; intensidade não muda a energia por fóton. |
| 2025 regular/32 | Onda estacionária | Nós permanecem fixos e ventres consecutivos distam meio comprimento de onda. |
| 2025 regular/44 | Raios clássico e relativístico | A discrepância aumenta com o fator de Lorentz. |
| 2025 regular/55 | Consumo dos equipamentos | Potência, quantidade e tempo contribuem para a energia total. |
| 2025 regular/78 | Consumo e tarifa | Preço da energia e energia consumida são grandezas distintas. |

Há também quatro esquemas estáticos: conversões de energia em 2024/33,
limites da analogia em 2025 regular/45, retorno ao problema nos momentos
pedagógicos em 2025 regular/54 e equivalência energética em 2025 reaplicação/74.
Os esquemas estão no próprio HTML e funcionam sem módulos de interação.

Os modelos puros ficam em `site/nucleo/enade-exploradores.js`; controles e SVG
ficam em `site/componentes/enade-exploradores/`. Um fragmento solicita um
modelo com `data-enade-explorer`. O carregamento ocorre ao abrir a solução.
As animações começam somente por ação do leitor e são pausadas ao fechar,
navegar, ocultar a aba ou imprimir. Movimento reduzido oferece avanço discreto.
Impressão mantém figuras e resultados, ocultando controles. Restaurar valores
não modifica o enunciado nem a conclusão da resolução.

As aproximações são explicitadas junto aos modelos. Lâmpadas usam resistência
constante fora do ponto nominal; a indução usa fluxo relativo e não inclui
autoindução; fotoemissão usa interação de um fóton; ondas e órbitas são modelos
idealizados, não réplicas completas dos aparelhos. Superfícies metálicas não
são apresentadas como átomos isolados.

As funções trabalho típicas de sódio, alumínio, zinco e cobre seguem a
[tabela 6.1 do OpenStax](https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect).
Os valores podem variar com a superfície. h, c e e seguem as
[constantes definidoras do SI (NIST)](https://www.nist.gov/pml/special-publication-330/sp-330-section-2);
a massa do elétron foi arredondada para 9,1093837 × 10⁻³¹ kg.

Validação desta revisão: 219 testes Node aprovados; as 27 páginas carregaram
sem erros de JavaScript ou LaTeX; 42 verificações de interação no navegador,
incluindo teclado, arraste, restauração, impressão e movimento reduzido.
Os 12 itens com novos recursos visuais foram conferidos em largura de 390 px,
sem transbordamento da página ou textos cortados nos SVG. Tema escuro conferido
com o controle real do site. Nenhum gabarito oficial foi aberto nessa revisão;
o teste do controle independente usou uma alternativa sintética.
