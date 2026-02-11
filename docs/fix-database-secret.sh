#!/bin/bash
# Corrige DATABASE_URL: cria/atualiza secret Plaintext e atualiza ECS
# Uso: ./fix-database-secret.sh "postgresql://usuario:senha@protos-farm.c9eyeiwi0jmr.sa-east-1.rds.amazonaws.com:5432/postgres"

set -e
REGION="sa-east-1"
CLUSTER="protos-farm-cluster"
SERVICE="protos-farm-server-service-jv7j5zu0"

if [ -z "$1" ]; then
  echo "Uso: $0 \"postgresql://usuario:senha@host:5432/postgres\""
  exit 1
fi

CONNECTION_STRING="$1"

echo "1. Criando/atualizando secret protos-farm-database-url..."
aws secretsmanager create-secret \
  --name protos-farm-database-url \
  --secret-string "$CONNECTION_STRING" \
  --region $REGION 2>/dev/null || \
aws secretsmanager put-secret-value \
  --secret-id protos-farm-database-url \
  --secret-string "$CONNECTION_STRING" \
  --region $REGION > /dev/null

ARN=$(aws secretsmanager describe-secret --secret-id protos-farm-database-url --region $REGION --query 'ARN' --output text)
echo "   ARN: $ARN"

echo ""
echo "2. Atualizando task definition..."
export SECRET_ARN="$ARN"
# Baixa task definition atual, remove campos inválidos, troca o secret
aws ecs describe-task-definition --task-definition protos-farm-server --region $REGION \
  --query 'taskDefinition' | \
  python3 -c "
import json, sys, os
d = json.load(sys.stdin)
for k in ['taskDefinitionArn','revision','status','requiresAttributes','compatibilities','registeredAt','registeredBy']:
    d.pop(k, None)
d['containerDefinitions'][0]['secrets'][0]['valueFrom'] = os.environ.get('SECRET_ARN')
print(json.dumps(d))
" > /tmp/task-def.json

aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json --region $REGION --query 'taskDefinition.revision' --output text

echo ""
echo "3. Forçando novo deploy..."
aws ecs update-service --cluster $CLUSTER --service $SERVICE --task-definition protos-farm-server --force-new-deployment --region $REGION --query 'service.deployments[0].status' --output text

echo ""
echo "Pronto. Aguarde 1-2 min e teste: curl http://IP:3001/health"
