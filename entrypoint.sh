#!/bin/bash
set -e

# Wait for the database to be ready
echo "Waiting for database to be ready..."
until nc -z db 5432; do
  sleep 1
done

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database (if you have a seeding script)
npm run seed

# Start the application
npm run start

exec "$@"
