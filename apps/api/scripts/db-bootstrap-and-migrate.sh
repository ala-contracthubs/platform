#!/bin/sh
# Runs inside the migration RunTask (INF-42) as the Aurora MASTER user.
#  1. ensures the least-privilege `app` role exists (INF-39), password taken
#     from the injected app DATABASE_URL secret;
#  2. applies Prisma migrations as master (DDL);
#  3. grants DML on the resulting objects to `app`.
# Idempotent — safe to run on every deploy.
set -e

: "${DB_USER:?}" "${DB_PASSWORD:?}" "${DB_HOST:?}" "${DB_PORT:?}" "${DB_NAME:?}" "${APP_DB_URL:?}"

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

# App-role password = the password embedded in the app DATABASE_URL secret.
APP_PW=$(printf '%s' "$APP_DB_URL" | sed -E 's#^postgresql://[^:]+:([^@]+)@.*#\1#')

PRISMA="./node_modules/.bin/prisma"
SCHEMA="prisma/schema.prisma"

echo "==> ensuring app role"
cat > /tmp/role.sql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app') THEN
    CREATE ROLE app LOGIN PASSWORD '${APP_PW}';
  ELSE
    ALTER ROLE app WITH LOGIN PASSWORD '${APP_PW}';
  END IF;
END
\$\$;
GRANT CONNECT ON DATABASE ${DB_NAME} TO app;
GRANT USAGE, CREATE ON SCHEMA public TO app;
SQL
"$PRISMA" db execute --schema "$SCHEMA" --file /tmp/role.sql

echo "==> prisma migrate deploy"
"$PRISMA" migrate deploy --schema "$SCHEMA"

echo "==> granting DML to app role"
cat > /tmp/grants.sql <<SQL
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app;
SQL
"$PRISMA" db execute --schema "$SCHEMA" --file /tmp/grants.sql

echo "==> bootstrap + migrate complete"
