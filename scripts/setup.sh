#!/bin/bash

echo "🚀 3DP Commander ERP System Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm/pnpm is available
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
else
    echo "❌ Neither npm nor pnpm is installed. Please install one of them."
    exit 1
fi

echo "✅ Using $PACKAGE_MANAGER as package manager"

# Install dependencies
echo "📦 Installing dependencies..."
$PACKAGE_MANAGER install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "📝 Please create a .env.local file with the following variables:"
    echo ""
    echo "DATABASE_URL=file:./local.db"
    echo "JWT_SECRET=your_jwt_secret_key_here_change_in_production"
    echo "NEXT_PUBLIC_APP_NAME=3DP Commander"
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
    echo ""
    echo "🔗 The application uses SQLite for local data storage"
else
    echo "✅ .env.local file found"
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: 3DP Commander ERP System"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: $PACKAGE_MANAGER run setup-db"
echo "2. Run: $PACKAGE_MANAGER run dev"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Login with admin@3dpcommander.com / admin123"
echo "5. Create a GitHub repository and push your code (optional)"
echo "6. Deploy to Vercel (optional)"
echo ""
echo "📖 See SETUP_GUIDE.md for detailed instructions" 