# Cableado transactional email worker

Recovered from the running IONOS production worker on 2026-11-10. Sends an internal notification to alvaro.rivera@iamet.mx and a customer confirmation for leads linked by landing_capture_receipts. It does not run the website process or expose a port.

## Configuration and release

Use a private env file outside Git with the variables in .env.example. DATABASE_URL must point to the intended environment; never copy production credentials or data into staging. Use a tested application image containing the postgres npm dependency. This portable Compose file replaces the server-only file that contained a resolved database credential; that private file was not downloaded or committed.

1. Back up the target database and verify restoration before schema changes.
2. Apply deployment/vps-v2/landing-capture.sql and schema.sql with psql ON_ERROR_STOP=1 using the target database account.
3. Validate Compose with an explicit --env-file path. Run the worker with --check first; this verifies variables and database access without sending.
4. Start only this Compose project's worker, after checking the environment and recipients. Startup processes all existing landing receipts that do not have both jobs, not just new receipts. In staging use synthetic contacts and a controlled email provider/test setup; this exact production worker has a fixed internal recipient and must not be started against copied customer data.
5. Inspect landing_mail_jobs and provider delivery events. accepted means provider acceptance, not inbox delivery. The production trial lead 3 was confirmed received by both recipients by the operator.

## Retry behavior and limitations

Each lead has separate internal/customer jobs with a unique constraint. Payloads are stored once, attempts are recorded before HTTP requests, and Resend idempotency keys remain stable. Failed connections retry after five minutes; ambiguous jobs stop for review after twenty hours to avoid retrying beyond the provider deduplication window. Non-retryable HTTP responses require review. Do not reset first_attempt or delete accepted jobs to force sends. This is the exact deployed implementation, not a claim of unlimited exactly-once delivery.

The database network remains internal. The separate mail_egress bridge supplies outbound DNS/HTTPS without publishing database or worker ports. Stop this worker to pause email without stopping lead capture. Keep its job table to retain delivery records.
