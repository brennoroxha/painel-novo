#!/bin/bash
# Script to run Prisma migrations in the deployed container

# Run migrations
npx prisma migrate deploy

# Check if migrations ran successfully
if [ $? -eq 0 ]; then
    echo "✓ Prisma migrations completed successfully"
else
    echo "✗ Prisma migrations failed"
    exit 1
fi

# Generate Prisma Client (if not already generated)
npx prisma generate

echo "✓ Prisma Client generated"
