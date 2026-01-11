#!/usr/bin/env bash


# echo "deleting ecr repository"

# aws ecr delete-repository --repository-name hello-world-app --force --profile personal

echo "running cdk destroy"
cdk destroy --profile personal --yes

