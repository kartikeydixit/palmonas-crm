#!/bin/bash

echo "🔍 Verifying Palmonas CRM Setup..."
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker found: $(docker --version)"
else
    echo "❌ Docker not found - please install Docker"
    exit 1
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose found: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose found: $(docker-compose version)"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

# Check .env file
if [ -f .env ]; then
    echo "✅ .env file exists"
    
    # Check JWT secrets
    if grep -q "JWT_ACCESS_SECRET=change_me" .env; then
        echo "⚠️  Warning: JWT secrets are using default values"
    else
        echo "✅ JWT secrets configured"
    fi
else
    echo "❌ .env file not found - run: cp .env.example .env"
    exit 1
fi

# Check required directories
for dir in backend worker mock-channels frontend; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory not found"
        exit 1
    fi
done

# Check package.json files
for dir in backend worker mock-channels frontend; do
    if [ -f "$dir/package.json" ]; then
        echo "✅ $dir/package.json exists"
    else
        echo "❌ $dir/package.json not found"
        exit 1
    fi
done

# Check Dockerfile files
for dir in backend worker mock-channels frontend; do
    if [ -f "$dir/Dockerfile" ]; then
        echo "✅ $dir/Dockerfile exists"
    else
        echo "❌ $dir/Dockerfile not found"
        exit 1
    fi
done

echo ""
echo "✅ Setup verification complete!"
echo ""
echo "To start the application, run:"
echo "  docker compose up --build"
echo ""
