#!/usr/bin/env bash
set -euo pipefail

mkdir -p build

STAMP=build/base.stamp
OUTPUTS=(
    build/base_geolines_z0.geojson
    build/base_centroids_z0.geojson
    build/base_countries.geojson
)

IMAGE_ID="$(docker image inspect tippecanoe:latest --format '{{.Id}}')"
INPUTS_HASH="$(node -e "
const crypto = require('node:crypto')
const fs = require('node:fs')
const hash = crypto.createHash('sha256')
for (const file of process.argv.slice(1)) {
    hash.update(file).update(fs.readFileSync(file))
}
process.stdout.write(hash.digest('hex'))
" \
    upstream/maplibre.mbtiles \
    scripts/02_prepare_base.sh \
    scripts/02b_dump_base_country_tiles.sh \
    scripts/02c_merge_base_countries.mjs \
    tools/tippecanoe-decode)"
STAMP_VALUE="$INPUTS_HASH $IMAGE_ID"

up_to_date=true
[ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$STAMP_VALUE" ] || up_to_date=false
for output in "${OUTPUTS[@]}"; do
    [ -f "$output" ] || up_to_date=false
done

if [ "$up_to_date" = true ]; then
    echo "Base layers are up to date; skipping. Delete $STAMP to rebuild them."
    exit 0
fi

rm -f "$STAMP"

./tools/tippecanoe-decode -c -l geolines upstream/maplibre.mbtiles 0 0 0 > build/base_geolines_z0.geojson
./tools/tippecanoe-decode -c -l centroids upstream/maplibre.mbtiles 0 0 0 > build/base_centroids_z0.geojson

bash scripts/02b_dump_base_country_tiles.sh
node scripts/02c_merge_base_countries.mjs

printf '%s\n' "$STAMP_VALUE" > "$STAMP"
