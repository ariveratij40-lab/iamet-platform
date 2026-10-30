# Service landing pages

The seven homepage solutions each have a dedicated destination:
- /soluciones/infraestructura
- /soluciones/edificios-inteligentes
- /soluciones/cctv
- /soluciones/control-acceso
- /soluciones/rfid
- /soluciones/energia
- /soluciones/software-ia

Reusable pattern: service-specific hero and image, primary proposal CTA to #solicitar, scope, implementation process, in-page lead form and FAQs. Infrastructure additionally includes the original Panduit product portfolio and partner badge. Existing other verticals retain their prior pages.

LeadForm submits the session attribution (UTM source, medium, campaign, term, content and click identifiers) via the existing leads.create endpoint, together with the canonical route slug. On confirmed mutation success it emits lead_captured through the existing analytics hook. No personal details are included in the conversion event. Failed requests display an error and do not emit that event.

Campaign launch still requires a public production URL, a working production lead backend and Google Ads/GTM conversion configuration. No campaigns or advertising spend have been activated. Configure lead_captured as the lead conversion trigger in the account's chosen tag workflow, avoiding duplicate tags. Verify a real test conversion in that environment before launch. Browser validation here used mocked API responses, without creating real leads.

Metadata titles/descriptions update on client navigation. This SPA does not yet prerender per-service HTML; any future prerendering should preserve these URLs and content.

Reference: https://support.google.com/google-ads/answer/6238826
