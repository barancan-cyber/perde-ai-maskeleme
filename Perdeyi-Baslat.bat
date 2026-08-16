@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Perde için önce Node.js kurulmalıdır.
  echo https://nodejs.org adresinden LTS sürümünü kurup bu dosyayı yeniden açın.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Perde ilk kez hazırlanıyor. Bu işlem birkaç dakika sürebilir...
  call npm ci
  if errorlevel 1 (
    echo Kurulum tamamlanamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.
    pause
    exit /b 1
  )
)

start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"
echo Perde açılıyor: http://localhost:3000
echo Uygulamayı kapatmak için bu pencereyi kapatabilirsiniz.
set "WRANGLER_LOG_PATH=.wrangler/wrangler.log"
call "node_modules\.bin\vinext.cmd" dev --host 127.0.0.1 --port 3000
