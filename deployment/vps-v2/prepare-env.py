#!/usr/bin/env python3
"""Generate new isolated secrets; carry only optional integration settings."""
import json
import os
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parent
target = root / '.env.v2'
if target.exists():
    raise SystemExit('Environment already exists; it was not changed.')
old = json.loads(subprocess.check_output(['docker', 'inspect', 'iamet_app_staging']))[0]
settings = dict(item.split('=', 1) for item in old['Config']['Env'] if '=' in item)
allowed = ['RESEND_API_KEY', 'EMAIL_FROM', 'LLM_API_URL', 'LLM_API_KEY', 'LLM_MODEL',
           'R2_ENDPOINT', 'R2_REGION', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL']
values = {key: settings.get(key, '') for key in allowed}
values.update(POSTGRES_PASSWORD=secrets.token_hex(32), REDIS_PASSWORD=secrets.token_hex(32),
              JWT_SECRET=secrets.token_hex(48), VITE_APP_URL='https://staging.iamet.mx')
# Single quotes prevent Compose interpolation of literal $ characters in tokens.
if any('\n' in value or '\r' in value or "'" in value for value in values.values()):
    raise SystemExit('An optional integration value requires manual quoting; no file created.')
with os.fdopen(os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as file:
    file.write(''.join(f"{key}='{value}'\n" for key, value in values.items()))
print('Private .env.v2 created. No old database, JWT or Redis credentials copied.')
print('AI provider configured:', bool(values['LLM_API_KEY']))
print('Email provider configured:', bool(values['RESEND_API_KEY']))
