# Design — Halliday 21: exercícios 18, 34 e 42

Data: 2026-08-05

## Objetivo

Adicionar ao catálogo três resoluções didáticas independentes do capítulo 21 do Halliday. Cada página deve permitir que o aluno compreenda a geometria antes de acompanhar a álgebra, com respostas verificadas e diagramas vetoriais limpos.

## Abordagens consideradas

1. **Páginas estáticas com SVGs autorais — escolhida.** Mantém a precisão geométrica, funciona sem dependências e acompanha o estilo do exercício 13.
2. **Publicar os recortes do livro.** Seria mais rápido, mas preservaria baixa resolução, ruído visual e texto protegido desnecessário.
3. **Criar três novas simulações completas.** Poderia ser útil em outra etapa, mas amplia o escopo além do pedido atual de resolução e imagem explicativa.

## Estrutura das páginas

Cada exercício terá uma rota própria:

- `exercicios/halliday-21-18/`
- `exercicios/halliday-21-34/`
- `exercicios/halliday-21-42/`

As três páginas usarão as abas:

1. **Enunciado:** síntese fiel dos dados e da pergunta, sem copiar integralmente o texto da fotografia.
2. **Resolução:** desenvolvimento numerado, unidades, hipóteses e resposta destacada.
3. **Diagrama:** figura SVG ampliada com forças, distâncias, ângulos e uma legenda que orienta a leitura.

Um módulo compartilhado ativará somente a navegação por abas. Não haverá nova biblioteca ou framework.

## Conteúdo físico

### Exercício 18 — razão entre cargas

- Configuração (a): `F_B + F_C = 2,014 × 10⁻²³ N`.
- Configuração (b): `F_C − F_B = 2,877 × 10⁻²⁴ N`.
- Solução do sistema:
  - `F_B = 8,6315 × 10⁻²⁴ N`;
  - `F_C = 1,15085 × 10⁻²³ N`.
- Como as distâncias são iguais, `q_C/q_B = F_C/F_B ≈ 1,33`.
- O SVG mostrará as duas configurações e os sentidos das forças sobre A.

### Exercício 34 — equilíbrio do elétron 2

- A força do elétron 1 aponta para `+x` e vale `ke²/R²`.
- Cada íon produz componente horizontal de módulo `keq cos³θ/R²`; as componentes verticais se cancelam.
- Equilíbrio: `e² = 2eq cos³θ`, portanto `q/e = 1/(2 cos³θ)`.
- Cargas iônicas fisicamente possíveis são múltiplos inteiros de `e`. Para `q = ne`, com `n = 1, …, 5`:
  - menor ângulo: `37,47°` para `q = e`;
  - segundo menor: `50,95°` para `q = 2e`;
  - terceiro menor: `56,61°` para `q = 3e`.
- O SVG mostrará a simetria dos íons, os ângulos e a decomposição das forças.

### Exercício 42 — pêndulos eletrostáticos

- Para uma esfera: `T cosθ = mg` e `T sinθ = F_e`.
- Logo, `tanθ = F_e/(mg) = kq²/(mgx²)`.
- Pela geometria e pelo pequeno ângulo, `sinθ = x/(2L)` e `tanθ ≈ sinθ`.
- Resulta `x³ = q²L/(2π ε₀mg)` e
  `x = (q²L/(2π ε₀mg))^(1/3)`.
- Com `L = 1,20 m`, `m = 0,010 kg` e `x = 0,050 m`:
  `|q| ≈ 2,38 × 10⁻⁸ C ≈ 24 nC`.
- O SVG combinará a geometria dos dois fios com o diagrama de corpo livre de uma esfera.

## Identidade visual e acessibilidade

- Reutilizar a estética de papel quadriculado e painel de laboratório.
- Cargas negativas em azul, forças elétricas em violeta/azul-petróleo, peso em vermelho e tensão em âmbar.
- Descrições `<title>` e `<desc>` em todos os SVGs.
- Rótulos textuais acompanham cor e sentido; a compreensão não depende somente de cor.
- Usar a classe existente `.vector-symbol`, sem o caractere combinante `U+20D7`.
- Manter leitura e navegação funcionais a partir de 320 px.

## Catálogo e testes

- Registrar os três materiais em `site/simuladores.json`, totalizando cinco cartões.
- Atualizar testes de busca e filtro para os novos exercícios.
- Adicionar testes de contrato para confirmar as três abas, os SVGs, os resultados numéricos e as fórmulas centrais.
- Executar a suíte JavaScript, a suíte Python/py5, validação sintática, testes de navegador em desktop/celular e verificação HTTP após o deploy.

## Fora do escopo

- Simulações dinâmicas específicas dos exercícios 18, 34 e 42.
- Reprodução das fotografias do livro no repositório.
- Alteração do simulador genérico ou do exercício 13.
