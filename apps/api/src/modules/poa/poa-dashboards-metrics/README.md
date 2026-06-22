# `poa/poa-dashboards-metrics` — read-model subdomain (no write authority)

POA CQRS read-model subdomain (NO write authority; lives in application/queries + infrastructure/persistence, NOT domain). The Client 'My POAs' dashboard listing every Case where the user is any Principal, with humanised Sub-status, Notary office, wall-clock since creation, and a per-user next-action label; filters/sort/summary strip; web + mobile parity. Plus POA-specific metrics for Platform Admin and Agency Admin: conversion rate, median time to completion, drop-off by terminal T1-T5, average revenue per POA, no-show rate per office, unexcused termination + restart rate, dispute + overturn rate, translation attach rate, resident/non-resident mix, Individual/Company Principal mix, single/multi-Principal mix by Authority Mode. Value objects: NextActionLabel, WallClockSinceCreation, RollingWindow(30d). Fed by domain events via the EventProjectionWorker. MyPoas and PoaMetrics are READ MODELS, not aggregates.

---
CQRS read side only — lives in `application/queries` + `infrastructure/persistence`, fed by domain events. **No domain aggregates / no write authority.**
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

