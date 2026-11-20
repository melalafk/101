#!/bin/bash
# Mac: çift tıklayınca Masa101'i başlatır.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js kurulu değil. https://nodejs.org adresinden LTS sürümünü kurup tekrar deneyin."
  read -n 1 -s -r -p "Kapatmak için bir tuşa basın"
  exit 1
fi
node server.mjs
