# CRM administrator password recovery

The existing customer recovery route reads store_users; it cannot reset staff accounts in users. /admin/recuperar and /api/auth/admin-password now provide a separate recovery path restricted to active administrators with local passwords.

Production app must receive RESEND_API_KEY and EMAIL_FROM from its existing private environment file, alongside JWT_SECRET and the canonical HTTPS VITE_APP_URL. Configuring these only on the landing mail worker is insufficient. No schema migration is required.

Tokens are signed for a distinct audience, expire after twenty minutes and contain an HMAC fingerprint of the current password hash. They are sent in a URL fragment, not a query string. Completion checks the current role/status and atomically replaces the matching old hash. Password changes invalidate all outstanding reset tokens; concurrent use succeeds once. Existing login sessions retain their existing expiry policy; this change does not add session revocation.

Request responses do not reveal account existence. No raw token, password, recipient or provider response is logged by the new flow. Provider acceptance is logged without the message contents. Verify delivery through the user's inbox; never ask the operator to paste the link/token or password into chat. The recipient chooses and submits their new password themselves.

Validation: six isolated PostgreSQL-compatible tests cover intended recipient and canonical origin, unknown/customer/inactive accounts, token tampering/expiry/audience, password storage and replay, concurrent use and password length. Existing seven lead-capture tests also pass. Resend is mocked in tests.

Deployment must preserve the current image, explicit private --env-file path and database backup. Recreate only the app, verify health and landing capture, reload Nginx, then request the recovery link. Rollback restores the app/configuration; never restore the entire database to undo an application rollout or overwrite a newly selected password.
