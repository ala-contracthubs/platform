# database module — one-time app-role bootstrap

Terraform provisions the Aurora cluster, the RDS-managed **master** secret (native rotation),
and publishes the **app-user** `DATABASE_URL` as a Secrets Manager secret. It does **not** create
the Postgres `app` role itself — the cluster lives in isolated subnets, so Terraform can't reach
it to run SQL.

Run this once per environment (via the migration RunTask path, a bastion, or `psql` from an
in-VPC shell), authenticated as the **master** user, substituting the password from the app
`database-url` secret:

```sql
-- INF-39: least-privilege runtime role, owns the app schema (DDL on its own schema only).
CREATE ROLE app LOGIN PASSWORD '<password-from-/contracthubs/<env>/app/database-url>';
GRANT CONNECT ON DATABASE contracthubs TO app;
GRANT USAGE, CREATE ON SCHEMA public TO app;
-- Existing + future objects:
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;
```

After this, `prisma migrate deploy` runs as **master** (DDL), and the api runtime connects as
**app** (DML) via the published `DATABASE_URL`.
