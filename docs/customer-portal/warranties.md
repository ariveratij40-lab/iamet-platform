# Customer warranties, orders and ticket tracking

Public process and customer entry point: /garantias. Account registration, email verification and password recovery reuse /tienda/login. The authenticated portal uses the existing store customer identity, not subscriber or administrator sessions. Login from the warranty page returns to that page. The legacy profile links to the portal and uses the correct shared token key.

Private API: /api/trpc/warranty.*. Customer JWTs are sent in X-Store-Token, verified with HS256, and checked against an existing verified store_users record on every operation. Customer-owned ticket, invoice and order lookups are filtered by that account. Client API caches are cleared on login/logout and cross-tab account changes so a different customer cannot see a prior account’s cached records. Administrator endpoints require an authenticated administrative user; the back office is /admin/garantias, linked in the sidebar. Quote ownership on new submissions is resolved from the authenticated account rather than trusting an ID supplied by the browser.

Invoice uploads: PDF/JPEG/PNG, maximum 5 MiB, with server-side size, base64, declared MIME, filename extension and signature checks. Original file bytes are held privately as base64 in warranty_invoices, separate from ticket listings. They never go to public object storage. Downloads require owner or administrator authorization. This validates file types; it is not an antivirus service. Customer creation is limited to ten tickets per rolling 24 hours, with a per-account transaction lock. Ticket, invoice and initial update are committed together.

Customer UI supports ticket creation, history, comments, invoice downloads, orders and service orders. Administrator UI supports review, public replies, status changes, invoice download and manual creation/update of customer orders by registered email. Orders are not imported from an external ERP or payment provider. Store quote history remains distinct from orders.

Statuses: received, reviewing, awaiting_customer, approved, rejected, resolved. Approved means the claim has been reviewed as procedente; filing alone does not grant coverage. Customers cannot reply to resolved or rejected cases; administrators can reopen a case with an update. No warranty period, guaranteed response time, replacement promise or refund policy has been invented. No email notification delivery is promised by this module; follow-up is available in the portal. Lists currently show the most recent 100 customer records / 200 administrator records.

## Installation on staging

1. Back up the database and confirm the existing migration journal. This module targets the PostgreSQL deployment already used by staging.
2. Apply drizzle/0005_customer-warranties.sql through the project's PostgreSQL migration process (it is registered in drizzle/meta/_journal.json). It creates customer_orders, warranty_tickets, warranty_invoices and warranty_updates with ownership foreign keys; it does not migrate historical orders.
3. Deploy the matching application build. Ensure JWT_SECRET is set, the store account tables exist and registration/verification email is configured.
4. Validate with two separate verified customer accounts: register, log in, upload a test invoice, view/reply, inspect administrator review, register orders, log out and deny cross-account access. Verify passwords/recovery and actual email delivery in the configured environment.
5. Include invoice data in protected database backups and define a retention policy appropriate for the company's invoices and warranty records. Provision an explicit privacy notice before public rollout.

No VPS database migration or production deployment was executed during implementation. The additive migration and the full service lifecycle were exercised using an isolated PostgreSQL-compatible PGlite test database with fictional records. Docker was unavailable locally; no real customer invoices or orders were used.

Validation: pnpm check; pnpm exec vitest run server/warranty.test.ts; pnpm build. Tests cover unauthenticated/forged/unverified sessions, profile retrieval, ticket/invoice creation, cross-account denial, administrator permissions and replies, closed tickets, order ownership, disguised/oversized files, transactional rollback and daily limits.
