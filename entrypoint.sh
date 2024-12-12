   # backend/entrypoint.sh

   #!/bin/sh

   # Wait for the database to be ready
   echo "Waiting for PostgreSQL..."

   while ! nc -z db 5432; do
     sleep 0.1
   done

   echo "PostgreSQL started"

   # In development, reset the database and apply migrations
   if [ "$NODE_ENV" = "development" ]; then
     echo "Development environment detected..."
     
     # Create and apply migrations
     echo "Creating and applying migrations..."
     npx prisma migrate dev --name init
     
     # Generate Prisma client
     echo "Generating Prisma client..."
     npx prisma generate

     # Run database seeding
     echo "Seeding the database..."
     npx prisma db seed
   else
     # In production, just deploy existing migrations
     echo "Applying existing migrations..."
     npx prisma migrate deploy
     
     # Generate Prisma client
     echo "Generating Prisma client..."
     npx prisma generate
   fi

   # Check if operations were successful
   if [ $? -ne 0 ]; then
     echo "Prisma operations failed. Exiting..."
     exit 1
   fi

   # Start the application
   exec "$@"
