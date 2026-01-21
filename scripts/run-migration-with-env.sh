#!/bin/bash

# Script to run Prisma migrations with environment variables from .env.local
# This script loads .env.local and runs the migration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "Error: .env.local file not found"
  echo "Please create .env.local with your DATABASE_URL"
  exit 1
fi

# Load environment variables from .env.local
# Using a safer method that handles values with spaces and special characters
export $(grep -v '^#' .env.local | grep -v '^$' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env.local"
  exit 1
fi

echo "Running Prisma migration..."
echo "Using database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/g')" # Mask password

# Run the migration
npx prisma migrate deploy

echo "Migration completed successfully!"
