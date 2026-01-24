@echo off
REM Unified Backend Setup Script for Windows
REM Run this script to set up the backend for the first time

echo 🚀 Setting up Unified Backend API...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

node -v
npm -v
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and add your credentials:
    echo    - Firebase credentials ^(Project ID, Client Email, Private Key^)
    echo    - Supabase keys ^(URL, Anon Key, Service Role Key^)
    echo    - Agora credentials ^(App ID, App Certificate^)
    echo    - OpenAI API key
    echo    - Generate secure API_SECRET_KEY and JWT_SECRET
    echo.
    echo    You can generate secure keys with:
    echo    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    echo.
) else (
    echo ✅ .env file already exists
    echo.
)

REM Check for Firebase service account file
if not exist firebase-service-account.json (
    echo ⚠️  Firebase service account file not found
    echo    Please download it from Firebase Console and save as:
    echo    firebase-service-account.json
    echo.
    echo    Or configure via environment variables in .env file
    echo.
)

echo ✨ Setup complete!
echo.
echo 📖 Next steps:
echo    1. Edit .env file with your credentials
echo    2. ^(Optional^) Add firebase-service-account.json
echo    3. Run 'npm run dev' for development mode
echo    4. Run 'npm start' for production mode
echo.
echo 📚 Documentation:
echo    - README.md - Complete API documentation
echo    - DEPLOYMENT.md - Render.com deployment guide
echo    - API_EXAMPLES.md - Flutter integration examples
echo.
echo 🌐 After starting the server, test it at:
echo    http://localhost:3000/api/health
echo.

pause
