@echo off
setlocal EnableExtensions
chcp 65001 >nul
title Perde - AI Öncesi Kişisel Veri Maskeleme
cd /d "%~dp0"

echo.
echo ================================================
echo   Perde baslatiliyor...
echo ================================================
echo.

where node.exe >nul 2>nul
if errorlevel 1 (
  echo HATA: Node.js bulunamadi.
  echo Node.js 22.13 veya daha yeni bir LTS surumunu kurun:
  echo https://nodejs.org/en/download
  echo.
  echo Node.js'i yeni kurduysaniz bu pencereyi kapatip Windows'u
  echo yeniden baslattiktan sonra tekrar deneyin.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo HATA: npm bulunamadi. Node.js kurulumunu yeniden calistirin ve
  echo "Add to PATH" seceneginin acik oldugundan emin olun.
  pause
  exit /b 1
)

for /f "delims=" %%V in ('node -p "process.versions.node" 2^>nul') do set "PERDE_NODE_VERSION=%%V"
for /f "tokens=1,2 delims=." %%A in ("%PERDE_NODE_VERSION%") do (
  set "PERDE_NODE_MAJOR=%%A"
  set "PERDE_NODE_MINOR=%%B"
)

echo Node.js surumu: %PERDE_NODE_VERSION%
if not defined PERDE_NODE_MAJOR (
  echo HATA: Node.js surumu okunamadi.
  pause
  exit /b 1
)

if %PERDE_NODE_MAJOR% LSS 22 (
  echo.
  echo HATA: Bu uygulama Node.js 22.13 veya daha yeni bir surum gerektirir.
  echo Bilgisayarinizdaki Node.js surumu: %PERDE_NODE_VERSION%
  echo Guncel LTS surumunu https://nodejs.org/en/download adresinden kurun.
  pause
  exit /b 1
)

if %PERDE_NODE_MAJOR% EQU 22 if %PERDE_NODE_MINOR% LSS 13 (
  echo.
  echo HATA: Bu uygulama en az Node.js 22.13 gerektirir.
  echo Bilgisayarinizdaki Node.js surumu: %PERDE_NODE_VERSION%
  echo Guncel LTS surumunu https://nodejs.org/en/download adresinden kurun.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vinext.cmd" (
  echo.
  echo Perde ilk kez hazirlaniyor. Bu islem birkac dakika surebilir...
  call npm ci
  if errorlevel 1 (
    echo.
    echo HATA: Gerekli parcalar kurulamadi.
    echo Internet baglantisini kontrol edin. Antivirus veya kurum agi npm'i
    echo engelliyorsa farkli bir internet baglantisiyla yeniden deneyin.
    pause
    exit /b 1
  )
)

echo.
echo Perde aciliyor: http://localhost:3000
echo Tarayici, sunucu hazir oldugunda otomatik acilacak.
echo Uygulamayi kapatmak icin bu pencereyi kapatabilirsiniz.
echo.

start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "$adres='http://127.0.0.1:3000'; 1..120 | ForEach-Object { try { Invoke-WebRequest -UseBasicParsing -Uri $adres -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:3000'; exit } catch { Start-Sleep -Seconds 1 } }"

set "WRANGLER_LOG_PATH=.wrangler/wrangler.log"
call npm run dev -- --host 127.0.0.1 --port 3000

set "PERDE_EXIT_CODE=%ERRORLEVEL%"
if not "%PERDE_EXIT_CODE%"=="0" (
  echo.
  echo HATA: Perde baslatilamadi. Hata kodu: %PERDE_EXIT_CODE%
  echo Yukaridaki hata metninin ekran goruntusunu destek icin saklayin.
  pause
)

exit /b %PERDE_EXIT_CODE%
