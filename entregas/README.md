# Serviço de entregas

Recebe os arquivos que os alunos enviam pela seção "Entregas" das páginas de disciplina.
O portal é estático (GitHub Pages); este serviço roda no servidor `gustavo-01`, em
`https://entregas.iatzingen.com.br`, e guarda tudo o que é privado: lista de alunos,
banco e arquivos. O desenho completo está em
[docs/superpowers/specs/2026-10-02-entregas-design.md](../docs/superpowers/specs/2026-10-02-entregas-design.md).

## Uso no semestre

1. Abrir `https://atzingen.github.io/disciplinas/entregas/professor/` e entrar com a conta
   Google de professor.
2. Criar a turma (disciplina e semestre).
3. Colar a lista de alunos extraída do diário do SUAP, um aluno por linha, com o e-mail
   `@aluno.ifsp.edu.br`. No SUAP, a página de cada aluno não mostra o e-mail acadêmico; ele
   sai pela exportação "Relação Emails (Alunos)" do diário
   (`https://suap.ifsp.edu.br/edu/relacao_alunos_email_xls/<id do diário>/`), uma planilha
   com as colunas MATRICULA, ALUNO e EMAIL, já sem os alunos cancelados. Basta copiar as
   linhas da planilha e colar: o importador reconhece o e-mail e o nome em cada linha.
4. Criar as atividades. Elas aparecem na página da disciplina, e os alunos enviam por lá.
5. No fim do semestre, baixar os zips e apagar a turma, o que remove do servidor a lista
   de alunos e todos os arquivos.

## Desenvolvimento

```bash
cd entregas
uv venv --python 3.13 .venv
uv pip install --python .venv/bin/python -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

Para rodar com Docker, copie `.env.example` para `.env`, preencha e use
`docker compose up -d --build`. O serviço responde em `http://127.0.0.1:8100/saude`.
As páginas, servidas em `http://localhost:8000` (`npm run serve`), já apontam para essa porta.

## Servidor

- Clone em `/var/local/apps/disciplinas`; dados em `/var/local/apps/disciplinas-dados`
  (`entregas.sqlite3` e `arquivos/`), fora do clone.
- `.env` em `entregas/.env`, só no servidor.
- nginx faz o proxy de `entregas.iatzingen.com.br` para `127.0.0.1:8100`, com certificado
  do certbot.
- O workflow `entregas-deploy.yml` roda os testes e executa `deploy.sh` no servidor a cada
  push na `main` que altere `entregas/`.
- Backup: `backup.sh` refaz toda noite, pelo cron do `deployer`, um único arquivo em
  `/var/local/apps/disciplinas-backup/entregas-backup.tar.gz` (banco e arquivos) e envia o
  mesmo arquivo ao Google Drive do professor (remote `gdrive-entregas` do `rclone`, pasta
  `disciplinas-entregas`). Nada é copiado para as máquinas do professor. O `rclone.conf` com
  o token fica só no servidor; para refazer a autorização: `rclone config reconnect
  gdrive-entregas:` com um túnel `ssh -L 53682:127.0.0.1:53682`. Para restaurar, parar o contêiner,
  extrair o arquivo, pôr `entregas.backup.sqlite3` como `entregas.sqlite3` e a pasta
  `arquivos/` em `/var/local/apps/disciplinas-dados/`, e subir o contêiner de novo.
