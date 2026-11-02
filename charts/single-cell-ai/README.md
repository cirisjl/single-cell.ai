# single-cell-ai Helm chart

This Helm 3 chart deploys the 13 OSCB workloads originally converted from Docker Compose. The default release deploys 10 core workloads; use separate values files to enable the admin and GPU components.

Run from the parent package root:

```bash
helm lint ./charts/single-cell-ai
helm template oscb ./charts/single-cell-ai -n oscb
helm upgrade --install oscb ./charts/single-cell-ai -n oscb --create-namespace -f my-values.yaml
```

**Required prerequisites:** cluster-accessible custom images, 19-key existing Kubernetes Secret named `oscb-secrets` (or change `secrets.existingSecret`), and appropriate PVC storage classes. One release per namespace because the service names match the source manifests. Read `../../DEPLOYMENT_TUTORIAL.md` for complete instructions.
