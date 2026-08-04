# Resolução - equilíbrio eletrostático de três partículas

## Enunciado

Duas partículas estão fixas sobre o eixo $x$:

- partícula 1: $q_1=+1{,}0\,\mu\text{C}$, na origem $(0,0)$;
- partícula 2: $q_2=-3{,}0\,\mu\text{C}$, no ponto $(L,0)$;
- separação: $L=10{,}0\,\text{cm}$.

Devemos determinar as coordenadas $(x,y)$ de uma terceira partícula, de carga não nula $q_3$, para que a força elétrica total exercida sobre ela pelas partículas 1 e 2 seja nula.

## Resposta final

$$
\boxed{(x,y)=(-13{,}66\,\text{cm},\,0)}
$$

Com o arredondamento compatível com os dados do enunciado:

$$
\boxed{x\approx -13{,}7\,\text{cm}}
\qquad\text{e}\qquad
\boxed{y=0}
$$

O sinal negativo indica que a partícula 3 deve ficar à esquerda da partícula 1.

---

## Resolução passo a passo

### 1. Condição para a força total ser nula

A força sobre a partícula 3 pode ser escrita em função do campo elétrico produzido pelas partículas 1 e 2:

$$
\vec F_{3,\text{total}}
=q_3\left(\vec E_1+\vec E_2\right).
$$

Como $q_3\neq 0$, a condição $\vec F_{3,\text{total}}=\vec 0$ equivale a

$$
\vec E_1+\vec E_2=\vec 0.
$$

Portanto, os dois campos devem ter:

1. a mesma intensidade;
2. sentidos opostos.

O valor e o sinal de $q_3$ não alteram a posição de equilíbrio.

### 2. Determinação da coordenada $y$ - pergunta B

Considere a partícula 3 em um ponto genérico $P=(x,y)$. Os vetores que ligam as cargas fixas a esse ponto são

$$
\vec r_1=(x,y)
\qquad\text{e}\qquad
\vec r_2=(x-L,y).
$$

Para que apenas dois campos se cancelem, eles precisam estar sobre a mesma reta. Assim, $\vec r_1$ e $\vec r_2$ precisam ser paralelos. O determinante desses vetores é

$$
\begin{vmatrix}
x & y\\
x-L & y
\end{vmatrix}
=xy-y(x-L)=Ly.
$$

Como $L\neq 0$, a condição de paralelismo exige

$$
Ly=0
\quad\Longrightarrow\quad
\boxed{y=0}.
$$

Logo, o ponto procurado obrigatoriamente pertence ao eixo $x$.

### 3. Em qual região do eixo $x$ pode haver equilíbrio?

Existem três regiões a analisar:

#### Entre as cargas: $0<x<L$

O campo de $q_1>0$ aponta para a direita, afastando-se de $q_1$. O campo de $q_2<0$ também aponta para a direita, em direção a $q_2$. Como os dois campos têm o mesmo sentido, eles não podem se cancelar.

#### À direita de $q_2$: $x>L$

Os campos têm sentidos opostos, mas $q_2$ possui maior módulo e está mais perto do ponto do que $q_1$. Consequentemente,

$$
|\vec E_2|>|\vec E_1|,
$$

e não pode haver cancelamento.

#### À esquerda de $q_1$: $x<0$

O campo de $q_1$ aponta para a esquerda e o campo de $q_2$ aponta para a direita. Nessa região, os campos têm sentidos opostos e podem apresentar a mesma intensidade.

Portanto, a solução deve satisfazer

$$
x<0.
$$

### 4. Determinação da coordenada $x$ - pergunta A

Defina $d$ como a distância entre a partícula 3 e a partícula 1. Como a partícula 3 está à esquerda da origem,

$$
d=-x>0.
$$

As distâncias da partícula 3 às duas cargas são

$$
r_1=d
\qquad\text{e}\qquad
r_2=L+d.
$$

Pela lei de Coulomb, a intensidade do campo produzido por uma carga puntiforme é

$$
E=k\frac{|q|}{r^2}.
$$

Igualando as intensidades dos campos de $q_1$ e $q_2$:

$$
k\frac{|q_1|}{d^2}
=k\frac{|q_2|}{(L+d)^2}.
$$

Substituindo $|q_1|=1{,}0\,\mu\text{C}$ e $|q_2|=3{,}0\,\mu\text{C}$ e cancelando os fatores comuns:

$$
\frac{1}{d^2}=\frac{3}{(L+d)^2}.
$$

Como todas as distâncias são positivas, podemos extrair a raiz quadrada:

$$
\frac{L+d}{d}=\sqrt{3}.
$$

Assim,

$$
L+d=\sqrt{3}\,d,
$$

$$
L=(\sqrt{3}-1)d,
$$

$$
d=\frac{L}{\sqrt{3}-1}.
$$

Racionalizando o denominador:

$$
d
=\frac{L}{\sqrt{3}-1}
\frac{\sqrt{3}+1}{\sqrt{3}+1}
=\frac{L(\sqrt{3}+1)}{2}.
$$

Para $L=10{,}0\,\text{cm}$:

$$
d
=\frac{10{,}0(\sqrt{3}+1)}{2}\,\text{cm}
\approx 13{,}66\,\text{cm}.
$$

Como $x=-d$,

$$
\boxed{x\approx -13{,}66\,\text{cm}}.
$$

### 5. Verificação do resultado

No ponto encontrado,

$$
r_1=d
\qquad\text{e}\qquad
r_2=L+d=\sqrt{3}\,d.
$$

A razão entre as intensidades dos campos é

$$
\frac{E_2}{E_1}
=\frac{|q_2|}{|q_1|}\frac{r_1^2}{r_2^2}
=3\frac{d^2}{(\sqrt{3}d)^2}
=3\frac{d^2}{3d^2}
=1.
$$

Os campos possuem a mesma intensidade e sentidos opostos. Portanto,

$$
\vec E_1+\vec E_2=\vec 0
\quad\Longrightarrow\quad
\vec F_{3,\text{total}}=\vec 0.
$$

## Posição das partículas no eixo

```text
                   13,66 cm                         10,0 cm
q3 ● <--------------------------------> q1 ● -------------------- ● q2
x = -13,66 cm                         x = 0                       x = L

       campo de q1:  ←        →  :campo de q2
```

## Observação sobre $q_3$

A solução acima pressupõe que $q_3$ seja diferente de zero, como é usual no enunciado. Se fosse permitido $q_3=0$, a força sobre a partícula seria trivialmente nula em qualquer posição, e o problema não teria uma coordenada única.

---

## Simulação interativa no Processing

O sketch representa as cargas fixas $q_1$ e $q_2$, permite mover $q_3$ pelo plano e desenha continuamente:

- $\vec F_{13}$, em ciano: força de $q_1$ sobre $q_3$;
- $\vec F_{23}$, em laranja: força de $q_2$ sobre $q_3$;
- $\vec F_R$, em magenta: soma vetorial das duas forças.

As três setas usam a mesma escala linear em cada quadro. Assim, seus comprimentos mantêm as proporções necessárias para visualizar corretamente a soma vetorial.

### Como executar pelo terminal - recomendado

Esta opção usa Python 3 e `py5`, sem passar pela interface do Processing. O
adaptador executa o próprio arquivo `.pyde`; portanto, não existe uma segunda
cópia da animação para manter.

Na raiz desta pasta, execute:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe simulacao_forcas\run_py5.py --check
.\.venv\Scripts\python.exe simulacao_forcas\run_py5.py
```

O comando `--check` valida o sketch sem abrir a janela. O último comando abre a
simulação interativa. O `py5` exige Java 17 ou superior; neste computador, o
adaptador encontra automaticamente o Java incluído na instalação padrão do
Processing.

### Como executar no Processing - opção para os alunos

1. Abra o Processing.
2. Espere o editor terminar de carregar.
3. Selecione **Python Mode** no seletor de modo da interface.
4. Somente depois, use **Arquivo > Abrir** e escolha
   `simulacao_forcas/simulacao_forcas.pyde`.
5. Pressione o botão **Run** do Processing.

Não é necessário portar o código: o arquivo aberto pelos alunos é o mesmo que o
adaptador py5 valida pelo terminal. O arquivo `physics_core.py` precisa
permanecer na mesma pasta do `.pyde`, pois ele contém os cálculos da lei de
Coulomb.

### Controles

- **Mouse:** clique e arraste a partícula $q_3$.
- **Seta para cima:** aumenta $|q_3|$ em $0{,}5\,\mu\text{C}$.
- **Seta para baixo:** diminui $|q_3|$ em $0{,}5\,\mu\text{C}$.
- **`S`:** inverte o sinal de $q_3$.
- **`R`:** restaura $q_3=+1{,}0\,\mu\text{C}$ no ponto teórico de equilíbrio.

O módulo ajustável de $q_3$ permanece entre $0{,}5$ e $5{,}0\,\mu\text{C}$. Se $q_3$ for colocado exatamente sobre uma das cargas fixas, a interface informa a singularidade da idealização de cargas puntiformes em vez de exibir uma força artificialmente limitada.

### Testes automatizados

Na raiz desta pasta, execute:

```powershell
$env:PYTHONPATH = "$PWD\simulacao_forcas"
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```
