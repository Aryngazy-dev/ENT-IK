#!/bin/sh
set -eu
if [ "${DATABASE_BOOTSTRAP_MODE:-migrate}" = "push" ]; then
  echo "Applying development database schema with db push"
  node_modules/.bin/prisma db push --skip-generate
else
  echo "Applying versioned Prisma migrations"
  node_modules/.bin/prisma migrate deploy
fi
exec npm run start
