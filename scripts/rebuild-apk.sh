#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

detect_java() {
  local candidates=(
    "$HOME/.local/share/mise/installs/java/21.0.2"
    "$HOME/.local/share/mise/installs/java/21.0"
    "$HOME/.local/share/mise/installs/java/21"
  )
  for c in "${candidates[@]}"; do
    if [[ -x "${c}/bin/java" ]]; then
      echo "${c}"
      return
    fi
  done
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "${JAVA_HOME}"
    return
  fi
  echo ""
}

JHOME="$(detect_java)"
if [[ -n "${JHOME}" ]]; then
  export JAVA_HOME="${JHOME}"
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

node scripts/build.js
npx cap sync android
( cd android && ./gradlew assembleDebug )

APK="android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Building done."
echo "APK ready: $(pwd)/${APK}"