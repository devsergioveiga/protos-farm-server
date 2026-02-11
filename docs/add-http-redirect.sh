#!/bin/bash
# Adiciona listener HTTP (80) que redireciona para HTTPS (443) no ALB
set -e
REGION="sa-east-1"
ALB_ARN=$(aws elbv2 describe-load-balancers --names protos-farm-alb --region $REGION --query 'LoadBalancers[0].LoadBalancerArn' --output text)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
  --region $REGION
echo "✅ Listener HTTP→HTTPS configurado. http://api.protosfarm.com.br agora redireciona para https://"
