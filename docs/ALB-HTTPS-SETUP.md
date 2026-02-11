# Configurar ALB + HTTPS para API

Este guia descreve como adicionar um **Application Load Balancer** com HTTPS ao serviço ECS, permitindo URL fixa e certificado SSL.

## Visão geral

```
Internet → ALB (HTTPS:443) → Target Group (porta 3001) → ECS Tasks
```

- **ALB**: recebe tráfego na porta 443 (HTTPS)
- **Target Group**: encaminha para as tasks ECS na porta 3001
- **ACM**: certificado SSL para o domínio

---

## Pré-requisitos

1. **Domínio** (ex.: `api.protosfarm.com.br`) apontando para o ALB (ou use o DNS do ALB temporariamente)
2. **Certificado ACM** para o domínio na região `sa-east-1`
3. **VPC** e **subnets** do ECS (anote os IDs)

---

## 1. Obter IDs da VPC e subnets

```bash
# Subnets do cluster (use as mesmas do serviço ECS)
aws ecs describe-services \
  --cluster protos-farm-cluster \
  --services protos-farm-server-service-jv7j5zu0 \
  --region sa-east-1 \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.{subnets:subnets,securityGroups:securityGroups}' \
  --output json
```

Anote: `subnets` (lista) e `securityGroups` (lista). A VPC é inferida das subnets.

---

## 2. Criar Security Group para o ALB

O ALB precisa receber tráfego HTTPS (443) da internet.

```bash
# Obter VPC ID (das subnets)
VPC_ID=$(aws ec2 describe-subnets --subnet-ids subnet-XXX subnet-YYY --region sa-east-1 --query 'Subnets[0].VpcId' --output text)

# Criar SG para o ALB
aws ec2 create-security-group \
  --group-name protos-farm-alb-sg \
  --description "ALB for protos-farm API" \
  --vpc-id $VPC_ID \
  --region sa-east-1

# Liberar HTTPS (443) da internet
aws ec2 authorize-security-group-ingress \
  --group-id sg-ALB_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region sa-east-1
```

Também libere HTTP (80) se quiser redirecionar para HTTPS:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-ALB_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region sa-east-1
```

**Security group do ECS:** adicione regra inbound permitindo tráfego na porta 3001 **do security group do ALB** (não mais 0.0.0.0/0 para produção).

---

## 3. Criar Target Group

```bash
aws elbv2 create-target-group \
  --name protos-farm-api-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region sa-east-1
```

Anote o **TargetGroupArn** da saída.

---

## 4. Criar Application Load Balancer

```bash
# Usar subnets públicas (as mesmas do ECS ou subnets públicas da VPC)
aws elbv2 create-load-balancer \
  --name protos-farm-alb \
  --subnets subnet-XXX subnet-YYY \
  --security-groups sg-ALB_ID \
  --scheme internet-facing \
  --type application \
  --region sa-east-1
```

Anote o **LoadBalancerArn**.

---

## 5. Criar Listener HTTPS (porta 443)

Você precisa do **ARN do certificado ACM** para o domínio (ex.: `api.protosfarm.com.br`).

```bash
# Obter ARN do certificado
aws acm list-certificates --region sa-east-1 --query 'CertificateSummaryList[*].{Domain:DomainName,Arn:CertificateArn}' --output table

# Criar listener HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:sa-east-1:607374883165:loadbalancer/app/protos-farm-alb/XXX \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:sa-east-1:607374883165:certificate/XXX \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:sa-east-1:607374883165:targetgroup/protos-farm-api-tg/XXX \
  --region sa-east-1
```

### Redirecionar HTTP → HTTPS (opcional)

```bash
ALB_ARN=$(aws elbv2 describe-load-balancers --names protos-farm-alb --region sa-east-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
  --region sa-east-1
```

---

## 6. Atualizar o serviço ECS para usar o ALB

O serviço precisa ser atualizado para registrar as tasks no target group.

```bash
aws ecs update-service \
  --cluster protos-farm-cluster \
  --service protos-farm-server-service-jv7j5zu0 \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:sa-east-1:607374883165:targetgroup/protos-farm-api-tg/XXX,containerName=server,containerPort=3001" \
  --force-new-deployment \
  --region sa-east-1
```

**Importante:** Se o serviço foi criado **sem** load balancer, a atualização pode falhar. Nesse caso, é necessário **recriar o serviço** com a configuração do load balancer — o que pode gerar um novo nome (ex.: `protos-farm-server-service-xyz`). Atualize o secret `ECS_SERVICE_NAME` no GitHub se isso acontecer.

---

## 7. DNS do ALB

Obtenha o DNS do ALB:

```bash
aws elbv2 describe-load-balancers \
  --names protos-farm-alb \
  --region sa-east-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

Exemplo: `protos-farm-alb-1234567890.sa-east-1.elb.amazonaws.com`

- **Teste imediato:** `https://protos-farm-alb-xxx.sa-east-1.elb.amazonaws.com/health` (será aviso de certificado se o cert for para outro domínio)
- **Com domínio:** Crie um registro CNAME (ou A com alias) apontando `api.protosfarm.com.br` para o DNS do ALB.

---

## 8. Solicitar certificado ACM (se ainda não tiver)

1. **ACM** → **Request certificate**
2. **Domain names:** `api.protosfarm.com.br` (ou `*.protosfarm.com.br` para wildcard)
3. **Validation:** DNS (crie o registro CNAME na zona Route 53 ou no provedor de DNS)
4. Aguarde validação (alguns minutos)

---

## Resumo de comandos (variáveis preenchidas)

```bash
REGION="sa-east-1"
VPC_ID="vpc-xxxxx"
SUBNET_1="subnet-xxxxx"
SUBNET_2="subnet-yyyyy"
ECS_SG="sg-0ff88a37669528eda"  # Security group do ECS
CERT_ARN="arn:aws:acm:sa-east-1:607374883165:certificate/xxxxx"

# 1. Criar SG do ALB
ALB_SG=$(aws ec2 create-security-group --group-name protos-farm-alb-sg --description "ALB" --vpc-id $VPC_ID --region $REGION --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION

# 2. Target Group
TG_ARN=$(aws elbv2 create-target-group --name protos-farm-api-tg --protocol HTTP --port 3001 --vpc-id $VPC_ID --target-type ip --health-check-path /health --region $REGION --query 'TargetGroups[0].TargetGroupArn' --output text)

# 3. ALB
ALB_ARN=$(aws elbv2 create-load-balancer --name protos-farm-alb --subnets $SUBNET_1 $SUBNET_2 --security-groups $ALB_SG --scheme internet-facing --type application --region $REGION --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# 4. Listener HTTPS
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTPS --port 443 --certificates CertificateArn=$CERT_ARN --default-actions Type=forward,TargetGroupArn=$TG_ARN --region $REGION

# 5. Atualizar ECS
aws ecs update-service --cluster protos-farm-cluster --service protos-farm-server-service-jv7j5zu0 --load-balancers targetGroupArn=$TG_ARN,containerName=server,containerPort=3001 --force-new-deployment --region $REGION
```

---

## Segurança do ECS

Após o ALB funcionar, restrinja o security group do ECS:

- **Remova** regra que permite `0.0.0.0/0` na porta 3001
- **Adicione** regra permitindo porta 3001 apenas do security group do ALB (`$ALB_SG`)

Assim a API só aceita tráfego via ALB, não diretamente por IP.
