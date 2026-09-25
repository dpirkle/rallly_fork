#!/bin/sh
set -e

export DIRECT_DATABASE_URL=$DATABASE_URL
export AUTH_URL=$NEXT_PUBLIC_BASE_URL

# Run migration via the local binary
./node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts

node apps/web/server.js
