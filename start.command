#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
if command -v node >/dev/null 2>&1; then
  exec node server.mjs
elif command -v python3 >/dev/null 2>&1; then
  printf '\n求是知新 · 闭卷练习工作台\nhttp://127.0.0.1:8765\n保持此终端打开；按 Ctrl+C 停止。\n\n'
  exec python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
else
  printf '需要 Node.js 或 Python 3。也可直接用浏览器打开仓库中的 offline.html。\n'
  exit 1
fi
