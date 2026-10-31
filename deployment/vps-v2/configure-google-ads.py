#!/usr/bin/env python3
"""Install OAuth settings privately; never print credentials. Run on the VPS."""
import json
import os
import re
import secrets
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
env = root / 'deployment/vps-v2/.env.v2'
source = Path('/opt/apps/iamet/secrets/google-ads-client.json')
callback = 'https://staging.iamet.mx/api/google-ads/oauth/callback'
try:
    credentials = json.loads(source.read_text())['web']
    assert callback in credentials['redirect_uris'], 'La URI de retorno no coincide.'
    client = credentials['client_id']
    secret = credentials['client_secret']
    assert re.fullmatch(r'[A-Za-z0-9._-]+', client) and re.fullmatch(r'[A-Za-z0-9_-]+', secret), 'Credenciales inválidas.'
    original = env.read_text()
    values = {'GOOGLE_ADS_CLIENT_ID': client, 'GOOGLE_ADS_CLIENT_SECRET': secret, 'GOOGLE_ADS_CUSTOMER_ID': '3771755064'}
    # Preserve the encryption key: rotating it would make an existing connection unreadable.
    previous = re.search(r'^GOOGLE_ADS_ENCRYPTION_KEY=([a-fA-F0-9]{64})$', original, re.M)
    if 'GOOGLE_ADS_ENCRYPTION_KEY=' in original and not previous:
        raise ValueError('La clave de cifrado existente requiere revisión; no se reemplazó.')
    values['GOOGLE_ADS_ENCRYPTION_KEY'] = previous.group(1) if previous else secrets.token_hex(32)
    lines = [line for line in original.splitlines() if not any(line.startswith(key+'=') for key in values)]
    content = '\n'.join(lines + [f'{key}={value}' for key, value in values.items()])+'\n'
    fd, temporary = tempfile.mkstemp(dir=env.parent, prefix='.google-ads-env-')
    try:
        with os.fdopen(fd, 'w') as output:
            output.write(content)
        os.chmod(temporary, 0o600)
        os.replace(temporary, env)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)
    print('Google Ads configurado. Credenciales ocultas. Cuenta: 377-175-5064.')
except Exception as error:
    # No exception representation: JSON/parser errors could contain private values.
    print('No se modificó la configuración. Revise el JSON web, su URI de retorno y el archivo .env.v2.')
    raise SystemExit(1)
