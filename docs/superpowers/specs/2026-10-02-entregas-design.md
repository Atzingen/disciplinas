# Design — entregas de arquivos por disciplina

Data: 2026-10-02

## Objetivo

Permitir que o professor crie atividades por disciplina (um experimento, um relatório, uma lista) e que somente os alunos matriculados, autenticados com a conta Google institucional, enviem arquivos para elas. O professor acompanha quem entregou, quem está em atraso e baixa os arquivos.

O portal continua publicado no GitHub Pages. Como o Pages só serve arquivos estáticos e o repositório é público, tudo o que é privado (lista de alunos, arquivos entregues, banco de dados) fica fora do repositório, em um serviço próprio no VPS pessoal `gustavo-01`.

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Hospedagem do serviço | `gustavo-01` (Hostinger, Debian 13, Docker, nginx e certbot já instalados; nenhum app em 2026-10-02) |
| Endereço | `https://entregas.iatzingen.com.br` |
| Autoria da entrega | definida por atividade: individual ou em grupo |
| Envio depois do prazo | aceito e marcado como atrasado |
| Lista de permitidos | extraída do SUAP uma vez por semestre e importada pelo professor |
| Integração no repositório | branch `feat/entregas` e PR para `main` |

## Arquitetura

```
navegador ── páginas estáticas ──> atzingen.github.io/disciplinas/            (GitHub Pages)
    │
    └── chamadas em segundo plano ─> entregas.iatzingen.com.br                (gustavo-01)
                                     nginx + TLS ─> FastAPI ─> SQLite + arquivos em disco
```

- **O aluno nunca sai do portal.** A entrega acontece dentro da página da disciplina. O endereço do serviço só é usado pelo JavaScript da página, em segundo plano; o aluno não o vê, não o recebe e não é redirecionado. A única janela externa é a do próprio Google, na hora de escolher a conta.
- **Páginas** em HTML e módulos JavaScript sem etapa de build, como o restante do site, reutilizando `assets/base.css` e a navegação principal.
- **Serviço** em `entregas/`, na raiz do repositório e fora de `site/`, portanto não publicado pelo Pages: FastAPI, `sqlite3` da biblioteca padrão (funções simples, sem ORM) e arquivos em disco, em um contêiner Docker.
- **Sem cookies entre domínios.** As páginas e o serviço ficam em domínios diferentes, e cookies de terceiros são bloqueados por vários navegadores. A página guarda o token de identidade do Google em `sessionStorage` e o envia em `Authorization: Bearer` a cada chamada.

Foram descartadas duas alternativas: Firebase (o Storage exige o plano pago Blaze desde 03/02/2026 e as regras ficam em linguagem própria do fornecedor) e ferramentas prontas como Forms, Classroom e Moodle (não integram ao portal nem restringem por turma).

## Identidade e permissões

O login usa o botão "Entrar com Google" (Google Identity Services). O serviço valida cada token com a biblioteca `google-auth`: assinatura, `aud` igual ao client ID do serviço, emissor, validade, `email_verified` e o campo `hd`. O campo `hd` é o teste indicado pela documentação do Google para restringir a um domínio hospedado; o sufixo do e-mail sozinho não é suficiente.

O token do Google vale uma hora. Quando expira, a página pede novo login; não há sessão própria no servidor.

| Papel | Condição |
|---|---|
| Professor | e-mail presente em `PROFESSORES`, na configuração do servidor |
| Aluno | `hd` em `aluno.ifsp.edu.br` ou `ifsp.edu.br` **e** e-mail presente na lista de uma turma |

O domínio `ifsp.edu.br` é aceito no papel de aluno para que o professor possa incluir a própria conta em uma turma de teste e percorrer o fluxo do aluno com um login real. A barreira efetiva é sempre a lista da turma.

Todo professor listado administra todas as turmas. Não há permissão por turma.

## Modelo de dados

- **turma**: disciplina (código oficial, por exemplo `PRCLFBE`), semestre (por exemplo `2026-2`). Uma turma por disciplina e semestre.
- **matricula**: turma, e-mail, nome.
- **atividade**: turma, título, descrição, prazo, `em_grupo`, extensões aceitas, tamanho máximo por arquivo, número máximo de arquivos, caminho opcional do material no portal (por exemplo `experimentos/08-ressonancia-rlc/`), `aberta`.
- **entrega**: atividade, quem enviou, data e hora do envio, `atrasada`, `substituida`.
- **entrega_membro**: entrega, e-mail. Em atividade individual há um único membro, quem enviou.
- **arquivo**: entrega, nome original, nome em disco, tamanho.

Datas são gravadas em UTC e exibidas em `America/Sao_Paulo`.

### Regras de entrega

1. Só envia quem está matriculado na turma da atividade, e só enquanto a atividade está aberta.
2. `atrasada` é verdadeiro quando o envio chega depois do prazo. O envio é aceito do mesmo jeito.
3. Um novo envio do mesmo aluno (ou de qualquer membro do mesmo grupo) cria uma nova versão e marca a anterior como substituída. As versões anteriores e seus arquivos são mantidos e ficam visíveis ao professor, de modo que uma versão dentro do prazo não se perde por causa de um reenvio atrasado.
4. Em atividade em grupo, quem envia escolhe os colegas na lista da turma. Um aluno só pode estar em uma entrega vigente por atividade: se um colega escolhido já estiver na entrega vigente de outro grupo, o envio é recusado com a indicação de quem já o incluiu.
5. Cada aluno ou grupo pode enviar até 10 versões por atividade.
6. O arquivo é recusado quando a extensão não está na lista da atividade, quando excede o tamanho máximo ou quando o número de arquivos passa do limite. O padrão é um arquivo `pdf` de até 20 MB; o teto do tamanho é 100 MB, limite já configurado no nginx do servidor.
7. Alunos veem e baixam apenas as entregas de que são membros. Professores veem todas.

### Lista de permitidos

O professor cola na página o texto extraído do diário do SUAP, um aluno por linha. O importador reconhece o e-mail em cada linha e usa o restante como nome, o que evita depender do formato exato das colunas do SUAP. A importação substitui a lista da turma e informa quantos alunos entraram, saíram e permaneceram. Alunos removidos perdem o acesso; as entregas já feitas são mantidas.

## Interface do serviço

| Rota | Quem | Função |
|---|---|---|
| `GET /saude` | público | verificação de funcionamento |
| `GET /disciplinas/{codigo}/atividades` | público | atividades da turma vigente (as fechadas aparecem como encerradas): título, descrição, prazo, autoria, arquivos aceitos e material |
| `GET /eu` | autenticado | papel, nome e turmas do usuário |
| `GET /disciplinas/{codigo}/minhas-entregas` | aluno | situação da própria entrega em cada atividade |
| `GET /turmas/{id}/atividades` | professor | todas as atividades da turma, inclusive as fechadas |
| `GET /turmas/{id}/colegas` | aluno, professor | nomes da turma, para montar o grupo |
| `POST /atividades/{id}/entregas` | aluno | envio de arquivos e, em grupo, dos membros |
| `GET /arquivos/{id}` | membro, professor | download, sempre como anexo |
| `GET /turmas`, `POST /turmas`, `DELETE /turmas/{id}` | professor | listar e criar turmas; apagar turma com matrículas, entregas e arquivos |
| `GET /turmas/{id}/matriculas`, `PUT /turmas/{id}/matriculas` | professor | ver e importar a lista de permitidos |
| `POST /turmas/{id}/atividades`, `PATCH /atividades/{id}`, `DELETE /atividades/{id}` | professor | criar, editar, abrir, fechar e apagar atividade |
| `GET /atividades/{id}/entregas` | professor | quem entregou, quem falta, atrasos e versões |
| `GET /atividades/{id}/entregas.zip` | professor | todas as entregas vigentes em um arquivo |

O CORS aceita somente `https://atzingen.github.io` e, em desenvolvimento, `http://localhost:8000`.

## Páginas

- **Seção "Entregas" dentro de cada página de disciplina** (`site/disciplinas/<codigo>/index.html`, âncora `#entregas`), logo depois dos materiais. Não existe página separada para o aluno.
  - Sem login, a seção já lista as atividades da turma vigente, com título, prazo e o link para o material do portal a que a atividade se refere. As atividades fechadas continuam na lista como encerradas, sem botão de envio, para que o aluno ainda veja a própria entrega. Título e prazo de atividade não são dados pessoais, e assim o aluno vê o que há para entregar antes de entrar.
  - O botão "Enviar" de cada atividade abre um diálogo (`<dialog>`) na mesma página. Se o aluno ainda não entrou, o diálogo mostra o botão "Entrar com Google"; depois do login, mostra a escolha dos arquivos e, em atividade em grupo, a escolha dos colegas.
  - Depois do login, cada atividade passa a mostrar a situação da entrega do aluno: enviada, atrasada, membros e arquivos.
  - Sem turma vigente ou sem atividades abertas, a seção diz que não há entregas abertas.
- `site/entregas/professor/index.html` — só o professor usa. Turmas, importação da lista, criação e edição de atividades, tabela de entregas e download em lote.
- `site/entregas/config.js` — endereço do serviço e client ID do Google. São valores públicos.
- `site/componentes/entregas.js` — componente da seção, carregado pelas três páginas de disciplina.

A turma vigente de uma disciplina é a de semestre mais recente.

## Armazenamento e segurança dos arquivos

- Os arquivos ficam em `/var/local/apps/disciplinas-dados/arquivos/<turma>/<atividade>/<entrega>/`, com nome gerado pelo serviço. O nome original é só metadado, o que elimina travessia de diretório por nome de arquivo.
- O download sai com `Content-Disposition: attachment` e `X-Content-Type-Options: nosniff`. Nenhum arquivo enviado é exibido ou executado no domínio do serviço.
- Sem cookies não há CSRF; toda rota, exceto `/saude`, exige o token.
- Apagar a turma remove do servidor as matrículas, as entregas e os arquivos. É o caminho para encerrar o semestre depois de baixar as entregas.

## Implantação

- Clone do repositório em `/var/local/apps/disciplinas/` (público, sem chave para o `git pull`) e `docker compose` em `entregas/`, com a porta publicada só em `127.0.0.1:8100`. O nginx do servidor faz o proxy de `entregas.iatzingen.com.br` com certificado do certbot.
- Dados e banco em `/var/local/apps/disciplinas-dados/`, fora do clone, montados como volume.
- Configuração em `.env` no servidor: `GOOGLE_CLIENT_ID`, `PROFESSORES`, `ORIGENS_PERMITIDAS`. Nenhum desses valores entra no repositório.
- Workflow `entregas-deploy.yml`: a cada push em `main` que altere `entregas/**`, entra por SSH no `gustavo-01`, atualiza o clone e reconstrói o contêiner. Assim o merge do PR publica páginas e serviço juntos. A chave SSH do deploy é exclusiva desse workflow, fica nos secrets do repositório e só executa `entregas/deploy.sh` (comando forçado no `authorized_keys` do servidor), porque o repositório é público e o usuário `deployer` tem privilégios amplos.
- Backup: um único arquivo no próprio servidor, `/var/local/apps/disciplinas-backup/entregas-backup.tar.gz`, refeito toda noite pelo cron do `deployer` com `entregas/backup.sh` (cópia consistente do banco via `.backup` do SQLite, mais os arquivos). Os dados e o backup nunca são copiados para as máquinas pessoais do professor. O arquivo fica no mesmo disco do serviço, então cobre erro de operação e corrupção do banco, não a perda do servidor; enviar esse arquivo ao Google Drive é a extensão prevista, ainda não configurada.

### Passos que dependem de contas do Gustavo

1. Registro DNS `A` de `entregas.iatzingen.com.br` para `187.77.250.81`, no GoDaddy.
2. Client ID OAuth do tipo aplicativo web no Google Cloud Console, com as origens `https://atzingen.github.io` e `http://localhost:8000`.

## Testes

Cada teste abaixo corresponde a uma falha concreta que ele impede.

| Teste do serviço (pytest) | Falha que pega |
|---|---|
| token com `hd` de outro domínio ou sem `hd` é recusado | conta Gmail comum com e-mail parecido entra |
| e-mail fora da lista da turma é recusado | aluno de outra turma envia arquivos ou lê entregas |
| a lista pública de atividades não traz nomes, e-mails nem entregas | dado de aluno exposto sem login |
| aluno não baixa arquivo de entrega alheia | vazamento de trabalho entre alunos |
| envio depois do prazo entra como atrasado | atraso passa despercebido ou envio é perdido |
| reenvio mantém a versão anterior | versão no prazo some após reenvio atrasado |
| colega já incluído em outro grupo recusa o envio | aluno aparece em dois grupos |
| extensão, tamanho e quantidade fora do limite são recusados | disco recebe arquivo indevido |
| nome de arquivo com `../` não escapa da pasta | gravação fora da área de dados |
| importação reconhece e-mails em linhas de formatos variados | lista do SUAP importada pela metade |
| rota de professor recusa aluno | aluno cria atividade ou lê a lista da turma |

A verificação do token é substituída nos testes pelo mecanismo de dependências do FastAPI; a verificação real é exercitada no login de produção.

No site, o teste de estrutura passa a exigir a seção "Entregas" nas três páginas de disciplina e a presença da página do professor.

Critérios de pronto: `pytest` e `npm test` sem falhas; contêiner `healthy`; `curl https://entregas.iatzingen.com.br/saude` com 200; no navegador, o professor entra, cria turma, importa a lista, cria uma atividade individual e uma em grupo, envia como aluno de teste e baixa o zip. O login de uma conta `@aluno.ifsp.edu.br` real só pode ser confirmado pelo primeiro aluno.

## Fora do escopo

Nota e devolutiva pelo sistema, notificações por e-mail, botão de entrega dentro da página de cada experimento, permissão de professor por turma, sincronização automática com o SUAP e detecção de plágio.
