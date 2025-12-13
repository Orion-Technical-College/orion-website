#!/bin/bash

# Setup script for EMC Workspace environment variables

echo "🔧 EMC Workspace Environment Setup"
echo "===================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
  cp .env.local .env.local.backup
fi

# Generate NEXTAUTH_SECRET if not set
if ! grep -q "NEXTAUTH_SECRET=" .env.local 2>/dev/null || grep -q "your-secret-key" .env.local 2>/dev/null; then
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "✅ Generated NEXTAUTH_SECRET"
else
  echo "ℹ️  NEXTAUTH_SECRET already set in .env.local"
fi

# Create .env.local from example if it doesn't exist
if [ ! -f ".env.local" ]; then
  cp env.example .env.local
  echo "✅ Created .env.local from env.example"
fi

# Update NEXTAUTH_SECRET if we generated one
if [ ! -z "$NEXTAUTH_SECRET" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env.local
  else
    # Linux
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env.local
  fi
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local and set your DATABASE_URL"
echo "2. Update NEXTAUTH_URL if needed (default: http://localhost:3000)"
echo "3. Run: npm run db:push (to push schema to database)"
echo "4. Run: npm run db:seed (to create initial Platform Admin user)"
echo ""
echo "💡 Your generated NEXTAUTH_SECRET:"
if [ ! -z "$NEXTAUTH_SECRET" ]; then
  echo "   $NEXTAUTH_SECRET"
else
  echo "   (Already set in .env.local)"
fi
echo ""

