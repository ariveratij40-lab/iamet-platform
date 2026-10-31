# Visitor assistant

Public widget: VisitorAssistantV2, mounted by the public application shell. It appears on home, about, service, brand, blog, quote and contact pages. It does not mount in login, account, warranty or administrator areas. The launcher invites visitors to ask; the panel opens only on request. It supports quick suggestions, typed messages, Escape to close, a fresh-conversation button and contextual actions. Messages remain only in component memory, not localStorage or the CRM.

Verified profile: shared/iamet-profile.ts is used by corporate pages and the assistant. shared/visitor-assistant.ts provides approved service, brand and coverage guidance and builds the generative system instructions. Do not add unverified experience, response-time, warranty, pricing or certification claims.

API: visitorAssistant.chat accepts the latest eight user/assistant turns, up to 2,000 characters each. System messages are rejected by the input schema. A procedure-level per-IP limit of 12 calls/minute also covers batched tRPC calls. No tools, account access or database access are granted to this assistant. Action links come from the approved catalog, never model-generated URLs. Model replies render as plain text.

AI uses the existing server LLM_API_URL, LLM_API_KEY and LLM_MODEL settings (legacy Forge fallback remains available through the shared LLM adapter). Requests carry a 12-second abort signal and a 450-token reply budget. Validate the configured provider/model in staging before rollout; implementation tests mock the provider, rather than making a paid live call. No credentials have been configured or exposed by this change.

If the server has no model key or the model fails, it returns mode=guide with deterministic approved guidance. The browser uses the same clearly labeled guide if the API cannot be reached (including Vite-only local previews). The guide is a service orientation fallback, not a substitute for generative conversation. The UI distinguishes guide mode from AI responses.

Quote links include origen=asistente and the service slug when detected. QuoteV2 then submits LeadForm with source=agent. Contact details are collected on the existing quote form and remain subject to that form's CRM/backend setup; the chat does not create leads or send messages to IAMET staff on its own. Warranty requests route to /garantias and the authenticated customer flow.

Validation: pnpm check; pnpm exec vitest run server/visitor-assistant.test.ts server/warranty.test.ts; pnpm build. Browser verification covers guide fallback, contextual service-to-quote routing, mobile panel bounds, Escape, and exclusion from the private portal. No VPS deployment was performed.
