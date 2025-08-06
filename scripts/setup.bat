@echo off
echo 🚀 3DP Commander ERP System Setup
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm/pnpm is available
where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=pnpm
) else (
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        set PACKAGE_MANAGER=npm
    ) else (
        echo ❌ Neither npm nor pnpm is installed. Please install one of them.
        pause
        exit /b 1
    )
)

echo ✅ Using %PACKAGE_MANAGER% as package manager

REM Install dependencies
echo 📦 Installing dependencies...
%PACKAGE_MANAGER% install

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local file not found!
    echo 📝 Please create a .env.local file with the following variables:
    echo.
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
    echo JWT_SECRET=your_jwt_secret_key_here_change_in_production
    echo NEXT_PUBLIC_APP_NAME=3DP Commander
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    echo.
    echo 🔗 Get your Supabase credentials from: https://supabase.com
) else (
    echo ✅ .env.local file found
)

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit: 3DP Commander ERP System"
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Create a Supabase project at https://supabase.com
echo 2. Run the database setup script in Supabase SQL Editor
echo 3. Update your .env.local with Supabase credentials
echo 4. Run: %PACKAGE_MANAGER% run dev
echo 5. Create a GitHub repository and push your code
echo 6. Deploy to Vercel
echo.
echo 📖 See SETUP_GUIDE.md for detailed instructions
pause 