#!/usr/bin/env python3
"""Non-destructive deployment preflight; run before docker compose up."""

from pathlib import Path
import os
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
required_source = [
    'api/main.py',
    'oscb-ui/oscb-node/package.json',
    'oscb-ui/oscb-node/deploy.sh',
    'oscb-ui/oscb-node/deploy_companion.sh',
    'oscb-ui/oscb-react/package.json',
    'oscb-ui/oscb-mysql/oscb_schema_latest.sql',
]
required = [
    'redis_password','rabbitmq_password','mysql_password','jupyter_token',
    'mongo_express_password','jwt_token_secret','directus_password',
    'flower_basicauth_password','directus_key','directus_secret',
]
optional = [
    'github_token','email_password','openai_api_key','gemini_api_key',
    'googledrive_key','googledrive_secret','dropbox_key','dropbox_secret',
    'onedrive_key','onedrive_secret',
]
issues=[]
for rel in required_source:
    if not (ROOT/rel).is_file():
        issues.append(f'Missing full project file: {rel}')
for name in required + optional:
    file=ROOT/'secrets'/f'{name}.txt'
    if not file.is_file():
        issues.append(f'Missing Docker secret: {file.relative_to(ROOT)}')
    elif name in required and not file.read_bytes().strip():
        issues.append(f'Empty required Docker secret: {file.relative_to(ROOT)}')
if not (ROOT/'.env').is_file():
    issues.append('Missing .env')
else:
    d={}
    for line in (ROOT/'.env').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.strip().startswith('#'):
            key,value=line.split('=',1);d[key.strip()]=value.strip()
    if 'KEY' in d or 'SECRET' in d:
        issues.append('Directus KEY/SECRET still in .env: migrate to secret files')
    if d.get('OSCB_APP_DATA_DIR') != d.get('OSCB_WORKER_DATA_DIR'):
        print('WARN: API and worker storage roots differ; confirm they share actual files.')
    if d.get('CORS_ORIGIN')=='true':
        print('WARN: CORS_ORIGIN=true is broad; restrict before public deployment.')
if issues:
    print('PREFLIGHT FAILED:')
    for issue in issues: print(' -',issue)
    sys.exit(1)
print('Preflight passed: required files and secrets exist.')
