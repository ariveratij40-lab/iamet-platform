#!/usr/bin/env python3
"""Preserve the VPS's working TLS configuration; change only the IAMET upstream."""
from pathlib import Path
import re
import sys

source, destination = map(Path, sys.argv[1:])
text = source.read_text()
if not re.search(r'server_name\s+staging\.iamet\.mx\s*;', text):
    raise SystemExit('Source is not the staging.iamet.mx virtual host.')
text, replacements = re.subn(r'\biamet_app_staging(?=:3000\b)', 'iamet_v2_app_staging', text)
if not replacements:
    raise SystemExit('Expected old IAMET upstream was not found; no configuration written.')
# Preserve all existing certificate references and proxy/location options.
if 'X-Robots-Tag' not in text:
    text = re.sub(r'(^[ \t]*server_name[ \t]+staging\.iamet\.mx[ \t]*;[ \t]*$)', r'\1\n    add_header X-Robots-Tag "noindex, nofollow" always;', text, flags=re.M)
destination.write_text(text)
destination.chmod(0o600)
print('Working HTTPS configuration preserved; IAMET upstream updated.')
