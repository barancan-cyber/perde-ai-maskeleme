#!/bin/bash

cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Perde icin once Node.js kurulmalidir."
  echo "https://nodejs.org adresinden LTS surumunu kurup bu dosyayi yeniden acin."
  read -r -p "Kapatmak icin Enter tusuna basin..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Perde ilk kez hazirlaniyor. Bu islem birkaç dakika surebilir..."
  npm ci || {
    echo "Kurulum tamamlanamadi. Internet baglantinizi kontrol edip yeniden deneyin."
    read -r -p "Kapatmak icin Enter tusuna basin..."
    exit 1
  }
fi

(
  for _ in {1..60}; do
    if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
      open http://localhost:3000
      exit 0
    fi
    sleep 1
  done
) &

echo "Perde aciliyor: http://localhost:3000"
echo "Uygulamayi kapatmak icin bu pencereyi kapatabilirsiniz."
npm run dev -- --host 127.0.0.1 --port 3000
