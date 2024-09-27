   # backend/entrypoint.sh

   #!/bin/sh

   # Wait for the database to be ready
   echo "Waiting for PostgreSQL..."

   while ! nc -z db 5432; do
     sleep 0.1
   done

   echo "PostgreSQL started"

   # Run Prisma migrations
   echo "Running Prisma migrations..."
   npx prisma migrate deploy

   # Run Prisma seed
   echo "Running Prisma seed..."
   npm run seed || echo "Prisma seed failed, but continuing..."

   # Start the application
   exec "$@"