# Avaliação GitHub Actions com IA

**Repositório:** 2bim-Avalia1  
**Branch de trabalho:** avaliacao-actions

## Tarefa 1 — CI a cada commit

O workflow `ci.yml` verifica possíveis segredos versionados, aplica as migrações SQL em um banco SQLite local e realiza uma validação básica dos arquivos HTML.

**Evidências:**
- Execução verde:https://github.com/Laert0/2bim-Avalia1/actions/runs/38574484085
- Execução vermelha: https://github.com/Laert0/2bim-Avalia1/actions/runs/38576639220
- Log do erro proposital: https://github.com/Laert0/2bim-Avalia1/actions/runs/38576639220

O teste local com SQLite permite identificar erros de sintaxe nas migrações antes de aplicá-las ao banco remoto D1.

## Tarefa 2 — Proteção da main

A proteção da branch principal deve exigir um pull request e a aprovação do status check `verificar` antes da mesclagem.

**Evidências:**
- Pull request bloqueado: https://github.com/Laert0/2bim-Avalia1/pull/1
- Pull request liberado: https://github.com/Laert0/2bim-Avalia1/pull/1
- Tentativa de push direto recusada: [INSERIR EVIDÊNCIA]

## Tarefa 3 — Revisão de pull request por IA

O workflow `revisao-ia.yml` utiliza o Copilot CLI para analisar alterações e, em pull requests, publicar o resultado como comentário.

O workflow foi executado manualmente na branch `main` com sucesso. Nessa execução, a IA informou que não havia alterações entre `origin/main` e `HEAD`. Esse teste confirma a execução do workflow, mas não comprova sozinho a revisão automática de um pull request.

**Evidências:**
- Execução bem-sucedida: https://github.com/Laert0/2bim-Avalia1/actions/runs/38585723536
- Pull request com comentários da IA: https://github.com/Laert0/2bim-Avalia1/pull/1
- Teste de permissão: [INSERIR LINK]

**Avaliação crítica da IA:A IA apontou um possível risco no uso de `workflow_dispatch` no processo de migração D1. Essa observação é relevante, porém não significa que qualquer usuário possa executar migrações, pois o GitHub controla as permissões de execução. Portanto, a recomendação precisa ser analisada considerando as permissões e as regras de proteção do repositório.

## Tarefa 4 — Migrações D1

O workflow `migrar.yml` aplica as migrações no banco D1 remoto quando há alterações na pasta `migrations/` na branch `main`.

**Evidências:**
- Execução da migração: [INSERIR LINK]
- Confirmação da coluna `data_criacao`: [INSERIR EVIDÊNCIA]
- Merge sem alterações em `migrations/`: [INSERIR EVIDÊNCIA]

## Perguntas

### 1. Por que o CI roda duas vezes?

O workflow pode ser acionado pelos eventos `push` e `pull_request`, pois ambos estão configurados. O status check exigido pela proteção da `main` deve corresponder à verificação associada ao commit do pull request.

### 2. Por que um pull request de fork não recebe `COPILOT_PAT`?

O GitHub não disponibiliza automaticamente os secrets do repositório de destino para workflows de pull requests originados de forks. Isso ajuda a impedir que código malicioso de terceiros roube tokens e outros segredos.

### 3. Por que declarar `permissions` explicitamente?

A declaração de permissões segue o princípio do menor privilégio, concedendo ao workflow somente os acessos necessários. Isso reduz o risco de alterações não autorizadas caso uma etapa seja comprometida.

### 4. A revisão por IA pode substituir o status check?

Não. A IA pode produzir conclusões incorretas e não substitui verificações automatizadas obrigatórias. O status check do CI deve continuar sendo exigido pela proteção da branch, enquanto a revisão por IA funciona como uma análise complementar.

## Conclusão

Os workflows de CI, migração e revisão por IA foram configurados no repositório. As evidências pendentes devem ser preenchidas com os links e resultados reais dos testes antes da entrega final.
