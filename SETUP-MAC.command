#!/bin/bash
# ENSIL 전시 — 최초 세팅 (인터넷 되는 곳에서 한 번만). 더블클릭으로 실행.
# 하는 일: 웹 의존성 설치 → 빌드(dist/) → 브릿지 의존성 설치
# 사전 준비: Chrome, Node 22 LTS(https://nodejs.org 의 macOS Installer .pkg) 설치
cd "$(dirname "$0")"
echo "== ENSIL 최초 세팅 =="
if ! command -v node >/dev/null 2>&1; then
  echo "Node 가 없습니다. https://nodejs.org 에서 22 LTS macOS Installer(.pkg)를 설치한 뒤 다시 실행하세요."
  read -n 1 -s -r -p "아무 키나 누르면 닫힙니다"; exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
echo "node $(node -v)"
if [ "$NODE_MAJOR" -ge 23 ]; then
  echo "⚠ Node 23 이상은 빌드가 크래시합니다(debug.md #1). 22 LTS 로 바꿔 설치하세요."
  read -n 1 -s -r -p "아무 키나 누르면 닫힙니다"; exit 1
fi
set -e
echo "-- 웹 의존성 설치"; npm ci
echo "-- 빌드"; npm run build
echo "-- 브릿지 의존성 설치"; (cd bridge && npm install)
echo
echo "== 완료. 전시 당일엔 START-MAC.command 를 더블클릭하세요 =="
read -n 1 -s -r -p "아무 키나 누르면 닫힙니다"
