"""Prepare a guarded additive worker patch, preserving existing landing templates."""
import argparse
from pathlib import Path


def patch(source: str, minimum_id: int) -> str:
    if minimum_id < 1:
        raise ValueError('El ID inicial debe ser positivo')
    if '// MAIN_SITE_FORM_MAIL_V1' in source:
        raise ValueError('La corrección ya existe; no sobrescribir')
    anchor = 'function messages(lead) {'
    start = '  const leads = await sql`'
    end = '    ORDER BY l.id LIMIT 50`;'
    if source.count(anchor) != 1 or source.count(start) != 1 or source.count(end) != 1:
        raise ValueError('El proceso de correo difiere de lo esperado; revisar antes de modificar')
    begin = source.index(start)
    finish = source.index(end, begin) + len(end)
    previous = source[begin:finish]
    if 'JOIN landing_capture_receipts r ON r.lead_id = l.id' not in previous or 'landing_mail_jobs' not in previous:
        raise ValueError('Selector de avisos inesperado')
    selector = '''  const leads = await sql`
    SELECT l.*, r.landing, r.lead_id AS landing_receipt_id
    FROM leads l
    LEFT JOIN landing_capture_receipts r ON r.lead_id = l.id
    WHERE (r.lead_id IS NOT NULL OR (l.source = 'form' AND l.id >= ${mainSiteFirstLeadId}))
      AND (
        SELECT count(*) FROM landing_mail_jobs j WHERE j.lead_id = l.id
      ) < 2
    ORDER BY l.id LIMIT 50`;'''
    source = source[:begin] + selector + source[finish:]
    helper = Path(__file__).with_name('main-site-messages.js').read_text()
    source = source.replace(anchor, '// MAIN_SITE_FORM_MAIL_V1\nconst mainSiteFirstLeadId = '+str(minimum_id)+';\n'+helper+'\n'+anchor+'\n  if (!lead.landing_receipt_id) return mainSiteMessages(lead);', 1)
    return source

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('source');parser.add_argument('output');parser.add_argument('--minimum-id',type=int,required=True)
    args=parser.parse_args()
    Path(args.output).write_text(patch(Path(args.source).read_text(),args.minimum_id))
