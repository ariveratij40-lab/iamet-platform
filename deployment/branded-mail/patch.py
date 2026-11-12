from pathlib import Path
import sys
source=Path(sys.argv[1]).read_text()
if 'BRANDED_LEAD_CONFIRMATION_V1' in source:
    raise SystemExit('DETENIDO: el diseño ya está instalado; revisar antes de repetir.')
if 'MAIN_SITE_FORM_MAIL_V1' not in source:
    import importlib.util
    spec=importlib.util.spec_from_file_location('prior',Path(__file__).with_name('patch-worker.py'))
    prior=importlib.util.module_from_spec(spec);spec.loader.exec_module(prior)
    source=prior.patch(source,9)
anchor='function messages(lead) {'
if source.count(anchor)!=1:
    raise SystemExit('DETENIDO: plantilla de avisos inesperada.')
source=source.replace(anchor,'function originalMessages(lead) {',1)
source+='\n'+Path(__file__).with_name('template.js').read_text()
# Declarations are hoisted, but all values are initialized inside functions.
Path(sys.argv[2]).write_text(source)
