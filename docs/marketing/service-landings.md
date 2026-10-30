# Service landing pages

The seven business service lines have dedicated pages; smart buildings remains a complementary solution:
- /soluciones/infraestructura
- /soluciones/edificios-inteligentes
- /soluciones/cctv
- /soluciones/control-acceso
- /soluciones/rfid
- /soluciones/energia
- /soluciones/software-ia
- /soluciones/polizas-servicios

Reusable pattern: service-specific hero and image, primary proposal CTA to #solicitar, scope, implementation process, in-page lead form and FAQs. Infrastructure additionally includes the original Panduit product portfolio and partner badge. Existing other verticals retain their prior pages.

LeadForm submits the session attribution (UTM source, medium, campaign, term, content and click identifiers) via the existing leads.create endpoint, together with the canonical route slug. On confirmed mutation success it emits lead_captured through the existing analytics hook. No personal details are included in the conversion event. Failed requests display an error and do not emit that event.

Campaign launch still requires a public production URL, a working production lead backend and Google Ads/GTM conversion configuration. No campaigns or advertising spend have been activated. Configure lead_captured as the lead conversion trigger in the account's chosen tag workflow, avoiding duplicate tags. Verify a real test conversion in that environment before launch. Browser validation here used mocked API responses, without creating real leads.

Metadata titles/descriptions update on client navigation. This SPA does not yet prerender per-service HTML; any future prerendering should preserve these URLs and content.

Reference: https://support.google.com/google-ads/answer/6238826


## Corporate and brand acquisition structure

IAMET is the corporate identity: integration and technology solution services. Public navigation now separates /nosotros, /soluciones, /marcas, /blog and /cotizacion. Existing store, industry and Academy destinations remain linked in the corporate footer.

Brand campaign destinations:
- /marcas/panduit (reuses the detailed infrastructure page and portfolio)
- /marcas/genetec
- /marcas/zebra
- /marcas/avigilon
- /marcas/apc-schneider

Brand pages use the primary service slug and include brand context in the lead's problemDescription. The quote form similarly includes the selected service and brand with the visitor's requirement; existing attribution fields remain separate. LeadForm continues to use leads.create and the existing CRM rather than creating a disconnected inbox. Prices require scope review and are not automatically calculated.

Existing CRM stages: new, contacted, qualified, proposal, won, lost. Production database, notifications, access control and delivery need end-to-end validation in the configured environment; browser previews do not establish production readiness.

The blog starts with seven original evergreen guides, one per business service, with category filtering and links to quote requests. These are guides, not invented news or product release announcements. Further news requires sourced editorial content. There is no automatic publishing schedule or new CMS in this change.

Pending company-provided content: institutional values, mission/vision if used, actual service coverage, contact details beyond the existing email and current certification evidence. No values, years of operation, service regions, partner levels or certifications for additional brands were invented.

Manufacturer references used for high-level brand scope:
- https://www.panduit.com/
- https://www.genetec.com/
- https://www.zebra.com/us/en/products.html
- https://www.avigilon.com/
- https://www.se.com/mx/es/brands/apc/
