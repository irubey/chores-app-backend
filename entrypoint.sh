   # backend/entrypoint.sh

   #!/bin/sh

   # Wait for the database to be ready
   echo "Waiting for PostgreSQL..."

   while ! nc -z db 5432; do
     sleep 0.1
   done

   echo "PostgreSQL started"

   # Run Prisma migrations
   echo "Checking for schema changes and applying migrations..."
   npx prisma migrate dev --name init

   # Check if migrations were successful
   if [ $? -ne 0 ]; then
     echo "Prisma migrations failed. Exiting..."
     exit 1
   fi

   # Generate Prisma client
   echo "Generating Prisma client..."
   npx prisma generate

   # Check if client generation was successful
   if [ $? -ne 0 ]; then
     echo "Prisma client generation failed. Exiting..."
     exit 1
   fi

   # Run Prisma seed
   echo "Running Prisma seed..."
   npm run seed

   # Check if seed was successful
   if [ $? -ne 0 ]; then
     echo "Prisma seed failed. Exiting..."
     exit 1
   fi

   # Start the application
   exec "$@"