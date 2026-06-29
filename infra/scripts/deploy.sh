#!/usr/bin/env bash
# Migrate-then-roll deploy for one environment (INF-42/43/48).
# Usage: deploy.sh <env> <api_image> <web_image>
# Reads deploy metadata from SSM (/contracthubs/<env>/deploy/*), runs the
# Prisma migration RunTask, aborts on failure, then rolls the api + web services.
set -euo pipefail

ENV="${1:?env required}"
API_IMAGE="${2:?api image required}"
WEB_IMAGE="${3:?web image required}"
PROJECT="contracthubs"

param() { aws ssm get-parameter --name "$1" --query 'Parameter.Value' --output text; }

CLUSTER=$(param "/$PROJECT/$ENV/deploy/cluster")
SUBNETS=$(param "/$PROJECT/$ENV/deploy/private_subnets")
SG=$(param "/$PROJECT/$ENV/deploy/ecs_security_group")
MIGRATE_FAMILY=$(param "/$PROJECT/$ENV/deploy/migrate_task_family")
API_SVC=$(param "/$PROJECT/$ENV/deploy/api_service")
WEB_SVC=$(param "/$PROJECT/$ENV/deploy/web_service")

# Register a new revision of <family> with <image>; echoes the new task-def ARN.
register_with_image() {
  local family="$1" image="$2"
  aws ecs describe-task-definition --task-definition "$family" --query 'taskDefinition' --output json \
    | jq --arg IMG "$image" '.containerDefinitions[0].image=$IMG
        | {family,taskRoleArn,executionRoleArn,networkMode,containerDefinitions,requiresCompatibilities,cpu,memory,runtimePlatform}' \
    > /tmp/td-"$family".json
  aws ecs register-task-definition --cli-input-json "file:///tmp/td-$family.json" \
    --query 'taskDefinition.taskDefinitionArn' --output text
}

echo "::group::migrate ($ENV)"
MIGRATE_TD=$(register_with_image "$MIGRATE_FAMILY" "$API_IMAGE")
TASK=$(aws ecs run-task --cluster "$CLUSTER" --task-definition "$MIGRATE_TD" --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --query 'tasks[0].taskArn' --output text)
echo "migration task: $TASK"
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK"
CODE=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK" \
  --query 'tasks[0].containers[0].exitCode' --output text)
echo "migration exit code: $CODE"
[ "$CODE" = "0" ] || { echo "migration failed — aborting deploy (INF-43)"; exit 1; }
echo "::endgroup::"

echo "::group::roll services ($ENV)"
API_TD=$(register_with_image "$API_SVC" "$API_IMAGE")
WEB_TD=$(register_with_image "$WEB_SVC" "$WEB_IMAGE")
aws ecs update-service --cluster "$CLUSTER" --service "$API_SVC" --task-definition "$API_TD" >/dev/null
aws ecs update-service --cluster "$CLUSTER" --service "$WEB_SVC" --task-definition "$WEB_TD" >/dev/null
echo "waiting for services to stabilize (circuit breaker rolls back on failure)…"
aws ecs wait services-stable --cluster "$CLUSTER" --services "$API_SVC" "$WEB_SVC"
echo "::endgroup::"
echo "deploy to $ENV complete."
