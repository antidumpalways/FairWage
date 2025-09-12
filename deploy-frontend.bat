@echo off
echo 🚀 FairWage Frontend Deployment Script
echo ======================================

echo.
echo 📦 Installing Vercel CLI...
call npm install -g vercel

echo.
echo 🔐 Logging into Vercel...
call vercel login

echo.
echo 🌐 Deploying to Vercel...
cd Frontend
call vercel --prod

echo.
echo ✅ Deployment completed!
echo 📱 Check your Vercel dashboard for the live URL
echo.
pause
