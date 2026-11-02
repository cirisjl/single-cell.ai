#!/usr/bin/env python3
"""Offline invariant checks. Not a substitute for `helm lint` / `helm template`."""
import json
from pathlib import Path
try:
    import yaml
except ImportError:
    raise SystemExit('Install PyYAML: python3 -m pip install pyyaml')

root = Path(__file__).resolve().parents[1]
chart = root / 'charts/single-cell-ai'
values = yaml.safe_load((chart / 'values.yaml').read_text())
inv = json.loads((root / 'SOURCE_INVENTORY.json').read_text())
assert set(values['workloads']) == set(inv['services']), 'Workload inventory changed'
assert len(inv['secrets']) == 19 and len(set(inv['secrets'])) == 19
assert sum(bool(w['enabled']) for w in values['workloads'].values()) == 10
assert {k for k, w in values['workloads'].items() if w['kind'] == 'StatefulSet'} == {
    'oscbdb', 'oscb-redis', 'oscb-rabbitmq', 'oscb-mysql'
}
for svc, original in inv['originalImages'].items():
    assert values['workloads'][svc]['image'] == original, (svc, original)
for k, original in [('celery-api','stormgod/oscb-api:1.0'),('worker-web','stormgod/oscb-api:1.0'),
                    ('worker-cpu','stormgod/oscb-api:1.0'),('worker-gpu','stormgod/oscb-api:1.0'),
                    ('dashboard','stormgod/oscb-api:1.0'),('oscb-react','stormgod/oscb-react:1.0')]:
    assert values['workloads'][k]['image'] == original
mounted=set()
for w in values['workloads'].values():
    for volume in w.get('volumes', []):
        if volume['type']=='secret':
            mounted.update(volume['keys'])
    for env in w.get('env', []):
        if 'secretKey' in env:
            mounted.add(env['secretKey'])
assert mounted <= set(inv['secrets'])
assert values['workloads']['worker-gpu']['resources']['limits']['nvidia.com/gpu']==1
assert values['storage']['shared']['accessModes']==['ReadWriteMany']
assert set(values['workloads'][k]['kind'] for k in values['workloads']) <= {'Deployment','StatefulSet'}
assert values['config']['data']['DB_HOST']=='oscb-mysql'
assert values['config']['data']['MONGO_URL']=='mongodb://oscbdb:65530'
assert values['config']['data']['CELERY_BROKER_HOST']=='oscb-rabbitmq'
assert values['config']['data']['CELERY_RESULT_BACKEND_HOST']=='oscb-redis'
for f in (chart/'templates').glob('*.yaml'):
    assert '{{' in f.read_text(), f'Not Helm templated: {f.name}'
for f in (root/'examples').glob('*.yaml'):
    assert isinstance(yaml.safe_load(f.read_text()), dict)
json.loads((chart/'values.schema.json').read_text())
print(f"OK: {len(values['workloads'])} workloads, 4 StatefulSets, 19 Secret keys, images unchanged; YAML/JSON parsed")
