# domain/ports

**Repository ports ONLY** — `XRepository` interfaces the aggregates need to load/save state.

Do **not** put external-service / I/O / scheduler / clock / publisher / subscriber / query
ports here. Those are driven I/O ports and live in [`../../application/ports`](../../application/ports).

`domain/**` imports nothing but `@contracthubs` shared **kernel** — never NestJS, the ORM,
an AWS SDK, `shared/platform`, or `shared/audit`. See `docs/ARCHITECTURE.md`.

