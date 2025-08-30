@echo off
echo.
echo ========================================
echo   GEMINI CHAT - MOBILE TESTING MODE
echo ========================================
echo.
echo 🔧 Starting development server with mobile access...
echo 📱 Authentication will be bypassed for local testing
echo 🌐 Server will be accessible on local network
echo.

REM Kill any existing processes on ports 3001 and 5174
echo 🧹 Cleaning up existing processes...
npx kill-port 3001 2>nul
npx kill-port 5174 2>nul

echo.
echo 🚀 Starting Gemini Advanced Chat...
echo.
echo 📱 MOBILE ACCESS INSTRUCTIONS:
echo    1. Connect your mobile device to the same WiFi
echo    2. Open mobile browser and go to one of these URLs:
echo       - http://192.168.1.8:5174/
echo       - http://localhost:5174/ (if on same device)
echo    3. No login required - authentication bypassed in dev mode
echo    4. Look for "🔧 DEV" indicator in the header
echo.
echo 🔧 Development features enabled:
echo    ✅ Authentication bypass
echo    ✅ Mobile sidebar scrolling
echo    ✅ Thinking model support
echo    ✅ Web search integration
echo    ✅ API key persistence
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
