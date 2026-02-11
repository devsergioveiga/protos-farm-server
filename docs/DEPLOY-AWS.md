# Deploy do Server na AWS

Este guia descreve como configurar e fazer deploy da API (Express + PostgreSQL) na AWS usando **ECR** (registry de imagens), **ECS Fargate** (containers) e **RDS** (PostgreSQL gerenciado).

## Visão geral

- **ECR**: repositório onde a imagem Docker do server é armocenada.
- **ECS Fargate**: executa o container da API (sem gerir EC2).
- **RDS PostgreSQL**: banco de dados gerenciado (recomendado para produção).
- **ALB** (opcional): Application Load Balancer para HTTPS e domínio.

---

## 1. Pré-requisitos na AWS

- Conta AWS com permissões para ECR, ECS, RDS, IAM.
- AWS CLI configurado (`aws configure`) ou uso de secrets no GitHub Actions.

### 1.1 Como obter permissões (ECR, ECS, RDS, IAM)

Use um **usuário IAM** (recomendado) em vez da conta root. Passos:

1. **Acesse o console AWS** → **IAM** → **Users** → **Create user**.
2. Nome sugerido: `protos-farm-deploy` (ou outro). Marque **Provide user access to the AWS Management Console** se for usar o console; para só CI/CD, pode ser "Programmatic access".
3. **Attach policies** (anexar políticas):
   - **ECR**: use a política gerenciada **`AmazonEC2ContainerRegistryPowerUser`** (push/pull de imagens)  
     ou, para mínimo necessário só para o CI fazer push: use a política customizada em `server/docs/iam-policy-deploy.json` (já inclui ECR + ECS + IAM PassRole).
   - **ECS**: para o GitHub Actions atualizar o serviço, anexe a política em `server/docs/iam-policy-deploy.json` (contém as ações ECS necessárias).
   - **RDS**: criar/gerir RDS é feito normalmente pelo console (usuário admin ou com **AmazonRDSFullAccess**). Para o deploy, não é obrigatório que o usuário do CI tenha acesso RDS; o ECS só precisa da connection string (que você configura na task definition). Se quiser que o mesmo usuário crie bancos via CLI/automation, anexe **AmazonRDSFullAccess** (ou uma política customizada mais restrita).
   - **IAM**: o deploy precisa de **PassRole** para o ECS usar a role de execução da task. A política `iam-policy-deploy.json` já inclui `iam:PassRole` para a role `ecsTaskExecutionRole`.

4. **Criar Access Key** (para GitHub Actions ou CLI): IAM → Users → seu usuário → **Security credentials** → **Create access key** → uso "Command Line Interface (CLI)". Guarde o **Access key ID** e **Secret access key** (use como secrets `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` no GitHub).

**Como usar a política customizada:** em IAM → **Policies** → **Create policy** → aba **JSON** → cole o conteúdo de `server/docs/iam-policy-deploy.json` (troque `SEU_ACCOUNT_ID` pelo ID da sua conta AWS, ex.: `123456789012`) → **Next** → nomeie (ex.: `ProtosFarmDeploy`) → **Create policy**. Depois, no usuário, **Add permissions** → **Attach policies directly** → selecione essa política.

**Resumo:** essa política cobre ECR (push de imagem), ECS (update/describe service e task definition) e IAM (PassRole). Para RDS, crie o banco pelo console com um usuário que tenha permissão RDS; o aplicativo no ECS acessa o RDS pela rede (security groups), não pela conta IAM do deploy.

---

## 2. Criar repositório no ECR

```bash
aws ecr create-repository \
  --repository-name protos-farm-server \
  --region sa-east-1
```

Anote o **URI** do repositório (ex.: `123456789.dkr.ecr.sa-east-1.amazonaws.com/protos-farm-server`).  
O nome do repositório (ex.: `protos-farm-server`) será usado no GitHub como secret **ECS_ECR_REPOSITORY_NAME**.

---

## 3. Criar banco RDS (PostgreSQL)

**Importante:** O RDS e o cluster ECS precisam estar na **mesma região** (ex.: `sa-east-1`). Se o RDS estiver em outra região (ex.: `us-east-1`), as tasks ECS não conseguirão conectar e o `/health` retornará `database: "error"`.

1. No console: **RDS** → **Create database**.
2. **Engine**: PostgreSQL 16 (recomendado: versão 16.11-R1 ou a mais recente 16.x).
3. **Templates**: use **Free tier** para dev/teste (sem custo); use **Production** se for produção com alta disponibilidade.
4. **Availability and durability**: para dev ou custo baixo, escolha **Single-AZ DB instance deployment (1 instance)**; para produção com redundância, **Multi-AZ DB instance deployment (2 instances)** ou **Multi-AZ DB cluster (3 instances)**.
5. **Settings**:
   - **DB instance identifier**: ex. `protos-farm`.
   - **Master username**: ex. `protosfarm_admin`.
   - **Credentials management**: use **Self managed**; marque **Auto generate password**. Após criar o banco, pegue a senha em **View credential details** no banner de criação (ou em RDS → sua instância → **Modify** não mostra a senha; guarde no momento da criação).
   - **Additional credentials settings**: deixe **Password authentication**.
6. **Instance configuration** (Free tier): escolha **Burstable classes (includes t classes)** e selecione uma classe elegível ao free tier (ex. **db.t3.micro** ou **db.t4g.micro**). Com template Free tier, a classe já vem sugerida.
7. **Storage**: deixe **General Purpose SSD (gp2)**; **Allocated storage** 20 GiB (mínimo) está ok para dev. Pode deixar "Additional storage configuration" fechado.
8. **Connectivity**:
   - **Compute resource**: **Don't connect to an EC2 compute resource** (o ECS se conecta ao RDS pela VPC).
   - **Network type**: **IPv4**.
   - **Virtual private cloud (VPC)**: **Default VPC** (ou a mesma VPC em que o cluster ECS vai rodar).
   - **DB subnet group**: deixe **default** (usa as subnets da VPC escolhida).
   - **Public access**: **No** (recomendado). Só **Yes** se for acessar o banco de fora da AWS; com **No**, as tasks ECS na mesma VPC acessam normalmente.
   - **VPC security group (firewall)**: **Choose existing** e selecione o **default** (ou um security group que você vá usar). Depois de criar o banco, edite esse security group e adicione uma regra **Inbound**: porta **5432**, origem = security group das tasks ECS (ou o CIDR da VPC), para o ECS conseguir conectar.
   - **Availability Zone**: **No preference** (a AWS escolhe).
9. **RDS Proxy**: deixe **desmarcado** ("Create an RDS Proxy"). Não é necessário para começar; o ECS conecta direto no RDS. RDS Proxy é útil para muitas conexões ou failover avançado (tem custo extra).
10. **Certificate authority (optional)**: deixe o padrão **rds-ca-rsa2048-g1 (default)**. Usado para validar a conexão TLS com o banco.
11. **Additional configuration**: pode deixar fechado; os defaults estão ok. Se abrir: **Database options** já tem o DB name; **Backup** e **Maintenance** podem ficar como estão.
12. **Tags (optional)**: opcional. Ex.: `Project` = `protos-farm`, `Environment` = `dev` (ajuda a organizar na conta).
13. **Monitoring**:
   - **Database Insights**: **Standard** (7 dias). Advanced tem custo.
   - **Enable Performance Insights**: **desmarque** em dev/free tier (evita custo).
   - **AWS KMS key**: **(default) aws/rds** (não dá para mudar depois).
   - **Additional monitoring settings** (Enhanced Monitoring, Log exports, DevOps Guru):
     - **Enable Enhanced monitoring**: **desmarque** (tem custo).
     - **Log exports** (CloudWatch Logs): **todos desmarcados** para não pagar por logs. Se quiser ver erros do PostgreSQL no CloudWatch, marque só **PostgreSQL log** (custo por volume de log).
     - **Turn on DevOps Guru**: **desmarque** (serviço pago).
14. **Liberar acesso ao RDS (firewall)**  
    O RDS está atrás de um *security group* (firewall). É preciso permitir entrada na **porta 5432** (PostgreSQL) para o tráfego que vem do ECS (ou de toda a VPC).  
    **Passo a passo:**
    1. **EC2** → **Security Groups** → selecione o security group do RDS (ex.: **default** `sg-0e2de7b6bbff84989`). Ou na página do RDS **protos-farm**, aba **Connectivity & security**, clique no ID do security group.
    2. Aba **Inbound rules** → **Edit inbound rules** → **Add rule**.
    3. **Type:** **Custom TCP**. **Port range:** **5432** (não use 5431; PostgreSQL usa 5432).
    4. **Source (origem do tráfego) — o que escolher:**
       - **Se o ECS vai usar o mesmo security group (ex.: default):** em Source abra o dropdown, em **Security groups** escolha **default \| sg-0e2de7b6bbff84989**. Assim qualquer recurso nesse SG (incluindo as tasks ECS) pode conectar no RDS.
       - **Se quiser liberar toda a VPC:** em Source escolha **Custom** e digite o CIDR da sua VPC (ex.: `10.0.0.0/16` para Default VPC). O CIDR está em **VPC** → **Your VPCs** → sua VPC → **CIDR blocks**. Não use `0.0.0.0/0` (abre para a internet).
       - **Depois de criar o ECS com outro SG:** em Source → **Security groups** → selecione o security group das tasks do serviço ECS.
    5. **Description (opcional):** ex. `PostgreSQL from ECS/VPC`. **Save rules**.
    Assim o RDS aceita conexões na porta **5432** da origem configurada.

Monte a **connection string**:

```text
postgresql://USUARIO:SENHA@SEU_ENDPOINT_RDS:5432/protos_farm
```

Guarde essa URL para configurar no ECS (variável `DATABASE_URL` ou Secrets Manager).

---

## 4. Cluster e serviço ECS (Fargate)

**Onde configurar (console):**
- **Task definition** (o “modelo” do container: imagem, CPU, memória, variáveis): menu lateral **ECS** → **Task definitions** → **Create new task definition**. Ou use o JSON em `server/docs/ecs-task-definition.json` e registre via CLI.
- **Serviço** (mantém as tasks rodando no cluster): **ECS** → **Clusters** → **protos-farm-cluster** → aba **Services** → **Create service**. O serviço usa uma task definition; sem serviço, o cluster fica com “No tasks”.
- **Rodar uma task avulsa** (teste, sem serviço): no cluster → aba **Tasks** → **Run new task** (escolhe a task definition e roda uma vez).

Ordem: (1) criar **task definition**, (2) criar **serviço** no cluster usando essa task definition. Assim as tasks aparecem em **Tasks** e ficam rodando.

### 4.1 Criar cluster

```bash
aws ecs create-cluster \
  --cluster-name protos-farm-cluster \
  --region sa-east-1
```

### 4.2 Criar task definition

**No console:** menu lateral **ECS** → **Task definitions** → **Create new task definition**.

Ou use o arquivo `server/docs/ecs-task-definition.json` (ajuste `executionRoleArn`, `taskRoleArn`, conta, subnets e security groups) e registre com `aws ecs register-task-definition --cli-input-json file://server/docs/ecs-task-definition.json --region sa-east-1`.

Pelo console:

1. **Task definition family**: ex. `protos-farm-server`.
2. **Compute**: Fargate; CPU/Memory (ex.: 0.25 vCPU, 512 MB).
2. **Compute**: Fargate; CPU/Memory (ex.: 0.25 vCPU, 512 MB).
3. **Container**:
   - **Image**: URI do ECR (ex.: `123456789.dkr.ecr.sa-east-1.amazonaws.com/protos-farm-server:latest`).
   - **Port**: 3001.
   - **Environment** (ou Secrets): `DATABASE_URL` = connection string do RDS; `PORT` = 3001. Para produção, prefira guardar `DATABASE_URL` no **Secrets Manager** e referenciar na task definition (veja `server/docs/ecs-task-definition.json`).
4. **Storage**: nenhum volume persistente necessário para a API.
5. Crie a task definition.

### 4.3 Criar serviço ECS (para as tasks rodarem no cluster)

**Se aparecer "Unable to assume the service linked role":** crie a service-linked role do ECS (uma vez por conta): `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`. Depois tente criar o serviço de novo.

**No console:** **ECS** → **Clusters** → **protos-farm-cluster** → aba **Services** → botão **Create service** (não use “Run new task” na aba Tasks para produção; o serviço mantém as tasks sempre ativas).

1. **Compute**: Fargate.
2. **Compute**: Fargate.
3. **Task definition**: a que você criou (ex.: `protos-farm-server`).
4. **Service name**: `protos-farm-server-service`.
5. **Desired tasks**: 1 (ou mais para alta disponibilidade).
6. **Networking**: subnets (públicas se quiser IP público; privadas com NAT se usar só ALB).
7. **Load balancing** (opcional): adicione um **Application Load Balancer**, target group na porta 3001, health check em `/health`.

Anote:
- Nome do **cluster** (ex.: `protos-farm-cluster`).
- Nome do **service** (ex.: `protos-farm-server-service`).

---

## 5. Secrets no GitHub

No repositório: **Settings** → **Secrets and variables** → **Actions**, crie:

| Secret | Descrição |
|--------|-----------|
| `AWS_ACCESS_KEY_ID` | Access key de um usuário IAM com permissão para ECR e ECS |
| `AWS_SECRET_ACCESS_KEY` | Secret key do mesmo usuário |
| `ECS_ECR_REPOSITORY_NAME` | Nome do repositório ECR (ex.: `protos-farm-server`) |
| `ECS_CLUSTER_NAME` | Nome do cluster ECS (ex.: `protos-farm-cluster`) |
| `ECS_SERVICE_NAME` | Nome do serviço ECS (ex.: `protos-farm-server-service`) |

O usuário IAM precisa de políticas para:
- ECR: `GetAuthorizationToken`, `BatchCheckLayerAvailability`, `PutImage`, `InitiateLayerUpload`, `UploadLayerPart`, `CompleteLayerUpload`.
- ECS: `ecs:UpdateService`, `ecs:DescribeServices`, `ecs:DescribeTaskDefinition`, `ecs:RegisterTaskDefinition` (se atualizar task def pelo CI).

---

## 6. Deploy automático (GitHub Actions)

O workflow `.github/workflows/deploy-server.yml`:

- Dispara em push para `main` ou `production` quando há alterações em `server/`, ou manualmente.
- Faz build da imagem Docker em `server/` com `--platform linux/amd64` (compatível com Fargate).
- Faz login no ECR e envia a imagem com tag `git SHA` e `latest`.
- Chama `aws ecs update-service --force-new-deployment` para o cluster/serviço configurados nos secrets.

Após configurar os secrets e o serviço ECS, um push em `server/` na branch configurada já fará o deploy.

---

## 7. URLs e saúde da API

- **Sem ALB**: use o IP público da task (se em subnet pública) e porta 3001 (menos indicado para produção).
- **Com ALB**: use o DNS do ALB (ou um domínio apontando para ele). Ex.: `https://api.protosfarm.com.br`.
- Health check: `GET /health` retorna `{ "status": "healthy", "database": "ok" }`. Use esse path no target group do ALB.

---

## 8. Build local (deploy manual)

Se fizer build local (ex.: Mac M1/M2) para enviar ao ECR, use `--platform linux/amd64` para evitar "exec format error" no Fargate:

```bash
docker build --platform linux/amd64 -t 607374883165.dkr.ecr.sa-east-1.amazonaws.com/protos-farm-server:latest server/
```

---

## 9. Rotação de senha do RDS (segurança)

Se a senha do banco foi exposta (ex.: em chat, logs, commit), rotacione-a:

1. **RDS** → sua instância → **Modify** → **Master password** → definir nova senha → **Apply immediately**.
2. **Secrets Manager** → secret `protos-farm-database-url` → **Retrieve secret value** → **Edit** → atualizar a connection string com a nova senha (`postgresql://usuario:NOVA_SENHA@host:5432/postgres?sslmode=require`).
3. Forçar novo deploy do ECS para as tasks carregarem o secret atualizado:
   ```bash
   aws ecs update-service --cluster protos-farm-cluster --service protos-farm-server-service-jv7j5zu0 --force-new-deployment --region sa-east-1
   ```

---

## 10. Resumo rápido

1. Criar repositório ECR e anotar o nome.
2. Criar RDS PostgreSQL e anotar a connection string.
3. Criar cluster ECS, task definition (imagem ECR + `DATABASE_URL`) e serviço Fargate.
4. (Opcional) Criar ALB e target group com health check em `/health`.
5. Configurar os 5 secrets no GitHub.
6. Fazer push em `server/` na branch `main` ou `production` para disparar o deploy.

Há um exemplo de task definition em **`server/docs/ecs-task-definition.json`**. Substitua `SEU_ACCOUNT_ID` e o ARN do secret (ou use variáveis de ambiente em vez de `secrets` se preferir). Crie o log group no CloudWatch: `/ecs/protos-farm-server`.
