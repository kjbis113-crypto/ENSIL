#!/bin/bash
# ENSIL 전시 — 매일 시작. 더블클릭으로 실행하고 이 창은 닫지 않는다(닫으면 브릿지가 꺼진다).
# 브릿지(ws :7777) + 사이트(http :8080)를 띄우고 Chrome 으로 사이트를 연다.
cd "$(dirname "$0")"
if [ ! -f dist/index.html ]; then
  echo "dist/ 가 없습니다. 먼저 SETUP-MAC.command 를 실행하세요."
  read -n 1 -s -r -p "아무 키나 누르면 닫힙니다"; exit 1
fi
echo "== ENSIL 브릿지 + 사이트 시작 (이 창을 닫지 마세요) =="
( sleep 2; open -a "Google Chrome" "http://localhost:8080/" ) &
exec node bridge/index.js --no-serial
