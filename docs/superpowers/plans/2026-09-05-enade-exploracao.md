# Resoluções Enade: leitura fluida e exploração visual

> Plano autorizado para implementação nesta sessão; validação editorial posterior pelo professor.

**Objetivo:** melhorar as 27 resoluções de eletromagnetismo sem alterar suas conclusões, mantendo solução e gabarito independentes e o estado de rascunho.

**Arquitetura:** fragmentos HTML continuam responsáveis pela explicação e pelo LaTeX; modelos físicos puros alimentam módulos de exploração carregados apenas ao abrir a solução. SVG responsivo para diagramas. Sem dependências novas.

**Escopo e critérios pedagógicos**

- Trocar a sequência repetitiva de títulos “Passo” por parágrafos conectados. Preservar justificativas, equações, hipóteses, referências e conclusão.
- Usar interação quando uma variável controlada permite fazer uma previsão e conferir sua consequência. Questões pedagógicas continuam predominantemente textuais.
- Incluir 7 modelos em 8 questões: lâmpadas/pilha (2024/36), redes de resistores (2024/37), indução (2024/42), efeito fotoelétrico (2024/62), ondas estacionárias (2025 regular/32), raio relativístico (2025 regular/44), consumo e custo (2025 regular/55 e /78).
- Acrescentar esquemas estáticos de transformações de energia (2024/33), limites da analogia da lanterna (2025 regular/45), momentos pedagógicos (2025 regular/54) e energia para elevação de massa (2025 reaplicação/74).
- Cada exploração traz uma pergunta, controles rotulados, resultados com unidades, botão para restaurar valores e limites do modelo. Dados explorados nunca substituem a resolução original.

**Restrições globais**

- Não consultar nem comparar o gabarito oficial; não publicar, fazer commit ou push.
- Preservar as alterações já existentes no repositório.
- Sem animação automática. Pausar ao fechar a solução, sair da questão, ocultar a aba ou imprimir. Respeitar movimento reduzido e oferecer controles por teclado.
- Modelos simplificados devem ser nomeados: resistência constante das lâmpadas fora do ponto nominal; fluxo relativo na indução; fotoemissão de um fóton; onda unidimensional; campo magnético uniforme; potência constante no consumo.
- Material do efeito fotoelétrico usa funções trabalho típicas com fonte explícita. Não simular átomos isolados como se fossem superfícies metálicas.

## Implementação

- [x] **Texto:** revisar `site/enade/solucoes/*.html`, remover segmentação mecânica e conferir continuidade. Ajustar `site/assets/enade.css`.
- [x] **Modelos:** criar `site/nucleo/enade-exploradores.js` e testes de invariantes em `site/testes/enade-exploradores.test.js`: conservação de potência, equivalências, sinal e repouso da indução, limiar fotoelétrico, nós, limite clássico e conversões de energia.
- [x] **Interface:** criar módulos em `site/componentes/enade-exploradores/` e estilos em `site/assets/enade-exploradores.css`. Integrar carregamento e limpeza em `enade-solucao.js` e `enade.js`.
- [x] **Conteúdo visual:** inserir os 8 exploradores e 4 esquemas nas questões selecionadas. Atualizar documentação do acervo com fontes e limites.
- [x] **Verificação:** executar a suíte Node; conferir as 27 soluções no navegador, LaTeX, controles independentes, uso por teclado, reinicialização, pausa, impressão, celular e tema escuro. Conferir que as alternativas propostas e equações originais foram preservadas.
- [x] **Entrega:** abrir a prévia local com uma exploração representativa e fornecer links para revisão do professor.

## Contratos e verificação

`mountExplorers(root)` retorna um controlador com `pause()` e `destroy()`. Cada módulo recebe seu elemento raiz e devolve o mesmo contrato; eventos usam AbortController e animações canceláveis. A falha de um explorador não impede ler a solução.

Os testes conferem resultados a partir dos parâmetros dos enunciados e relações físicas, sem usar respostas oficiais. No navegador, o painel do gabarito permanece fechado; qualquer teste desse controle deve usar dados sintéticos.

Referência dos materiais: [OpenStax, University Physics 3, tabela 6.1](https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect). Constantes SI exatas: [NIST, SP 330](https://www.nist.gov/pml/special-publication-330/sp-330-section-2). Valores típicos de superfície não são constantes universais do elemento.

## Resultado da implementação

Concluído localmente em 05/09/2026: 27 textos revisados, oito explorações e quatro esquemas. 219 testes Node passaram; navegação pelas 27 soluções, 42 verificações de interação e inspeção móvel dos 12 itens visuais passaram. Pausa preservando a fase, retomada, ocultação da aba e restauração também foram verificadas após o ajuste final da animação. Equações originais e alternativas propostas preservadas; nenhuma comparação com resposta oficial. Prévia disponível na questão 2024/62, com solução e gabarito independentes. Publicação continua dependendo da validação do professor.

## Autorização posterior de publicação

Em 05/09/2026, depois de validar a prévia pelo Tailscale, o professor autorizou publicar esta versão no GitHub. As restrições de não fazer commit/push acima se referem à etapa de preparação e foram superadas por essa autorização. Os 27 itens passam a `publicada`; o registro de comparação com o gabarito permanece falso.
