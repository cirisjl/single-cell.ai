#!/usr/bin/env python3
"""Offline structure, inventory, reference and syntax checks (PyYAML required).

No cluster-side Kubernetes admission/schema validation is performed.
"""
from pathlib import Path
import json
import re
import yaml

root = Path(__file__).resolve().parents[1]
manifest_files = sorted((root / 'kubernetes').rglob('*.yaml'))
objects = []
for path in manifest_files:
    for obj in yaml.safe_load_all(path.read_text()):
        if obj:
            objects.append((path.relative_to(root).as_posix(), obj))

inventory = json.loads((root / 'INVENTORY.json').read_text())
workloads = {}
services = {}
for path, obj in objects:
    kind = obj.get('kind')
    if kind == 'Service':
        name = obj['metadata']['name']
        assert name not in services, f'Duplicate Service {name}'
        services[name] = obj
    if kind in ('Deployment', 'StatefulSet'):
        name = obj['metadata']['name']
        assert name not in workloads, f'Duplicate workload {name}'
        workloads[name] = obj
        pod = obj['spec']['template']['spec']
        containers = pod['containers']
        assert len(containers) == 1
        container = containers[0]
        assert container.get('image'), f'Missing image {name}'
        volumes = {v['name'] for v in pod.get('volumes', [])}
        if kind == 'StatefulSet':
            volumes |= {v['metadata']['name'] for v in obj['spec']['volumeClaimTemplates']}
        for mount in container.get('volumeMounts', []):
            assert mount['name'] in volumes, f'{name}: undeclared volume {mount}'
        if kind == 'Deployment':
            assert obj['spec']['selector']['matchLabels']['app'] == name
        assert container['imagePullPolicy'] == 'IfNotPresent'

assert set(workloads) == set(inventory['services']), (set(workloads), set(inventory['services']))
assert len(workloads) == 13
assert len(services) == 14

for service_name, original_image in inventory['originalImages'].items():
    actual = workloads[service_name]['spec']['template']['spec']['containers'][0]['image']
    assert actual == original_image, f'{service_name}: {actual} != {original_image}'
for workload in ['celery-api', 'worker-web', 'worker-cpu', 'worker-gpu', 'dashboard']:
    assert workloads[workload]['spec']['template']['spec']['containers'][0]['image'] == 'stormgod/oscb-api:1.0'
assert workloads['oscb-react']['spec']['template']['spec']['containers'][0]['image'] == 'stormgod/oscb-react:1.0'

secret_keys = set()
for workload in workloads.values():
    pod = workload['spec']['template']['spec']
    for volume in pod.get('volumes', []):
        config = volume.get('secret', {})
        if config.get('secretName') == 'oscb-secrets':
            secret_keys |= {item['key'] for item in config.get('items', [])}
assert secret_keys == set(inventory['secrets']), (secret_keys ^ set(inventory['secrets']))

# All generated environment names must be valid K8s env names.
env = root / 'kubernetes/base/app.env'
env_names = []
for line in env.read_text().splitlines():
    if not line.strip() or line.lstrip().startswith('#'):
        continue
    name,sep,value = line.partition('=')
    assert sep, f'Malformed line: {line!r}'
    assert re.fullmatch(r'[A-Za-z_][A-Za-z_0-9]*',name), f'Bad env key {name}'
    assert not re.search(r'(?i)(password|secret|token|api_key)(?!_FILE$)',name), f'Potential secret value in ConfigMap: {name}'
    env_names.append(name)
assert len(env_names)==len(set(env_names)), 'Duplicate ConfigMap env keys'

for overlay in ('admin','gpu','all'):
    k = yaml.safe_load((root/f'kubernetes/overlays/{overlay}/kustomization.yaml').read_text())
    assert '../../base' in k['resources']
    for ref in k['resources']:
        assert (root/f'kubernetes/overlays/{overlay}/{ref}').exists(), f'Missing overlay path: {overlay}/{ref}'

print(f'PASS: {len(manifest_files)} YAML files, {len(workloads)} workloads, '
      f'{len(services)} Services, {len(secret_keys)} secret keys, '
      f'{len(env_names)} non-secret env variables')
print('NOTE: No kubectl/Kubernetes API validation or live Pod runtime validation was performed.')
