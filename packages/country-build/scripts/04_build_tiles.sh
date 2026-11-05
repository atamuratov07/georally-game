#!/usr/bin/env bash
set -euo pipefail

TILES_DIR="dist/tiles"
TILES_URL_TEMPLATE="/map/tiles/{z}/{x}/{y}.pbf"

while [ "$#" -gt 0 ]; do
    case "$1" in
    --tiles-dir)
        TILES_DIR="$2"
        shift 2
        ;;
    --tiles-dir=*)
        TILES_DIR="${1#*=}"
        shift
        ;;
    --tiles-url-template)
        TILES_URL_TEMPLATE="$2"
        shift 2
        ;;
    --tiles-url-template=*)
        TILES_URL_TEMPLATE="${1#*=}"
        shift
        ;;
    *)
        echo "Unknown argument: $1" >&2
        exit 1
        ;;
    esac
done

if [ -z "$TILES_DIR" ] || [ "$TILES_DIR" = "/" ] || [ "$TILES_DIR" = "." ]; then
    echo "Unsafe tiles output directory: $TILES_DIR" >&2
    exit 1
fi

rm -f \
    build/base_geolines_patched.mbtiles \
    build/base_attrs_patched.mbtiles \
    build/base_core.mbtiles \
    build/centroids.mbtiles \
    build/capitals.mbtiles \
    build/countries_extra.mbtiles \
    build/world_complete.mbtiles

rm -rf "$TILES_DIR"
mkdir -p "$TILES_DIR"

# 1) Patch original geolines with localized labels, dropping the date line
./tools/tile-join -f -o build/base_geolines_patched.mbtiles \
    -j '{ "geolines": ["!=", "name", "International Date Line"] }' \
    -c build/geolines_join.csv -x name \
    upstream/maplibre.mbtiles

# 2) Patch original countries with their codes and ISO numeric ids
./tools/tile-join -f -o build/base_attrs_patched.mbtiles \
    -c build/countries_join.csv \
    -x ADM0_A3 -x ABBREV -x CONTINENT -x NAME -x fid \
    build/base_geolines_patched.mbtiles

# 3) Keep only countries + geolines from the patched base
./tools/tile-join -f -o build/base_core.mbtiles \
    -l countries -l geolines \
    build/base_attrs_patched.mbtiles

# 4) Build rebuilt centroids
./tools/tippecanoe -f -o build/centroids.mbtiles \
    -l centroids -Z0 -z6 -r1 -pf -pk \
    build/centroids.geojson

# 5) Build capitals
./tools/tippecanoe -f -o build/capitals.mbtiles \
    -l capitals -Z0 -z6 -r1 -pf -pk \
    build/capitals.geojson

# 6) Optional: build supplemental countries only if needed
SUPP_COUNT=$(node -e "const fs=require('fs');const fc=JSON.parse(fs.readFileSync('build/supplemental_countries.geojson','utf8'));process.stdout.write(String((fc.features||[]).length));")

if [ "$SUPP_COUNT" -gt 0 ]; then
    ./tools/tippecanoe -f -o build/countries_extra.mbtiles \
        -l countries -Z0 -z6 -pf -pk \
        build/supplemental_countries.geojson

    ./tools/tile-join -f -o build/world_complete.mbtiles \
        build/base_core.mbtiles \
        build/centroids.mbtiles \
        build/capitals.mbtiles \
        build/countries_extra.mbtiles
else
    ./tools/tile-join -f -o build/world_complete.mbtiles \
        build/base_core.mbtiles \
        build/centroids.mbtiles \
        build/capitals.mbtiles
fi

# 7) Export static pbf directory
./tools/tile-join -f -e "$TILES_DIR" build/world_complete.mbtiles

# 8) Generate tiles.json file
node scripts/05_make_tilesjson.mjs \
    --tiles-dir "$TILES_DIR" \
    --tiles-url-template "$TILES_URL_TEMPLATE"
