#!/usr/bin/env bash
set -euo pipefail

# Carpeta de salida
OUT_DIR="$HOME/Descargas"
mkdir -p "$OUT_DIR"

if [ "$#" -eq 0 ]; then
  echo "Uso: $0 <ruta/archivo1> [ruta/archivo2 ...]" >&2
  exit 1
fi

for SRC in "$@"; do
  if [ ! -f "$SRC" ]; then
    echo "⚠️  No existe el archivo: $SRC" >&2
    continue
  fi

  BASENAME="$(basename "$SRC")"
  EXT="${BASENAME##*.}"
  NAME="${BASENAME%.*}"

  OUT_FILE="$OUT_DIR/${NAME}.md"

  {
    echo "\`\`\`$EXT"
    cat "$SRC"
    echo
    echo "\`\`\`"
  } > "$OUT_FILE"

  echo "✅ Generado: $OUT_FILE"
done
