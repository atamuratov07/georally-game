#!/usr/bin/env bash
set -euo pipefail

if command -v cygpath >/dev/null 2>&1; then
    HOST_DIR="$(cygpath -w "$PWD")"
else
    HOST_DIR="$PWD"
fi

mkdir -p build/tmp_base_country_tiles
rm -f build/tmp_base_country_tiles/*.geojson

MSYS2_ARG_CONV_EXCL='*' docker run --rm -i \
    -v "$HOST_DIR:/work" \
    -w /work \
    tippecanoe:latest \
    sh -s <<'EOF'
mkdir -p build/tmp_base_country_tiles

tippecanoe-enumerate upstream/maplibre.mbtiles |
  awk '$2 == 6 { print $1, $2, $3, $4 }' |
  xargs -P "$(nproc)" -n 4 sh -c '
    tippecanoe-decode -c -l countries "$1" "$2" "$3" "$4" \
      > "build/tmp_base_country_tiles/$2_$3_$4.geojson" || true
  ' decode
EOF
