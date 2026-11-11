# IAMET release reconciliation — 2026-11-10

## Evidence

- GitHub visual base: feature/iamet-cinematic-services-hero at bc990529f34f83f2d8c119d5c6c59bd58d6da265.
- Production 198.251.68.105: iamet_v2_app_prod uses iamet-v2-prod:cableado-release-20261110; iamet_cableado uses iamet-cableado:capture-20261110; independent iamet_cableado_mail worker. The source candidate was based on d19dbfa with uncommitted functional and homepage changes.
- Staging 108.175.9.162: staging.iamet.mx routes to iamet_mirror_app_staging, image iamet-mirror-staging:nov10i, managed by /opt/apps/iamet/staging-runtime/compose.yaml. No build context or revision label proves which source produced that image. The older iamet_app_staging is not this domain's upstream.
- CI on the visual base validates builds for PRs targeting feature/iamet-ionos-production, or manual dispatch. It does not deploy servers.

## Reconciled source

This branch preserves the entire cinematic base. It adds exact recovered REST capture sources, the transaction-capable CRM function, the production landing source and independent email worker. Local production homepage variants are retained under deployment/recovery/20261110 as noncompiled reference files. Secrets, resolved runtime Compose files, database backups and customer data are excluded.

## Promotion contract

Commit all source changes on a feature branch, review the diff, run capture tests and both builds, then validate a release on staging before promoting the same reviewed commit to production. Keep per-environment data, credentials, origins, URLs and email controls separate. Do not run the legacy main-pulling staging script against the mirror deployment.

Record the full commit SHA, build inputs, image digest, schema migration status and rollback image for every component. Use commit-tagged images and org.opencontainers.image.revision labels in future builds. If frontend environment values differ, build environment-specific images from that same commit and record both digests; do not claim identical artifacts.

Production capture requires LANDING_CAPTURE_ENABLED=true, CRM_ENGINE=v2, and LANDING_ALLOWED_ORIGINS=https://cableadoestructurado.iamet.mx. The /api/leads Nginx upstream must be the production app, not the test app. Build landings/cableado/Dockerfile.prod with PUBLIC_CAPTURE_ENABLED=true, PUBLIC_LEAD_ENDPOINT=/api/leads and PUBLIC_PRIVACY_URL=https://privacidad.iamet.mx/. Keep preview capture disabled until its isolated backend is tested.

Before a release: backup and restore-test the database; apply additive migrations explicitly; check health and invalid-input handling; test a controlled capture and retry; confirm CRM and both email deliveries. Update only intended services and reload Nginx after container replacement. Roll back application/landing images without deleting captured leads or mail records.

## Current limit

Pushing this branch does not synchronize or deploy either VPS. Server configurations and running images must subsequently be reconciled through a reviewed release. No server was modified while retrieving these sources.
