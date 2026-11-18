#!/usr/bin/env bash
set -euo pipefail

TILES_DIR="dist/tiles"
TILES_URL_TEMPLATE="/map/tiles/{z}/{x}/{y}.pbf"
TILEJSON_OUT=""

while [ "$#" -gt 0 ]; do
    case "$1" in
    --out)
        TILES_DIR="$2"
        shift 2
        ;;
    --out=*)
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
    --tilejson-out)
        TILEJSON_OUT="$2"
        shift 2
        ;;
    --tilejson-out=*)
        TILEJSON_OUT="${1#*=}"
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

LAYERS=()
for layer in countries geolines seas centroids capitals; do
    LAYERS+=("build/layer_$layer.mbtiles")
done
rm -f build/countries_raw.mbtiles build/geolines_raw.mbtiles build/world.mbtiles \
    "${LAYERS[@]}"

rm -rf "$TILES_DIR"
mkdir -p "$TILES_DIR"

COMMON=(-f -Z0 -z6 -pk)
POINTS=(-r1 -pf)

# Countries and geolines carry the Natural Earth keys; the join adds the
# game's codes and the localized labels.
./tools/tippecanoe "${COMMON[@]}" -o build/countries_raw.mbtiles \
    -l countries -y ADM0_A3 \
    --detect-shared-borders --no-tiny-polygon-reduction \
    build/base_countries.geojson
./tools/tile-join -f -o build/layer_countries.mbtiles \
    -c build/countries_join.csv -x ADM0_A3 \
    build/countries_raw.mbtiles

./tools/tippecanoe "${COMMON[@]}" -o build/geolines_raw.mbtiles \
    -l geolines -y name \
    build/geolines.geojson
./tools/tile-join -f -o build/layer_geolines.mbtiles \
    -c build/geolines_join.csv -x name \
    build/geolines_raw.mbtiles

./tools/tippecanoe "${COMMON[@]}" "${POINTS[@]}" -o build/layer_seas.mbtiles \
    -l seas build/sea_labels.geojson
./tools/tippecanoe "${COMMON[@]}" "${POINTS[@]}" -o build/layer_centroids.mbtiles \
    -l centroids build/centroids.geojson
./tools/tippecanoe "${COMMON[@]}" "${POINTS[@]}" -o build/layer_capitals.mbtiles \
    -l capitals build/capitals.geojson

./tools/tile-join -f -pk -o build/world.mbtiles "${LAYERS[@]}"

./tools/tile-join -f -pk -e "$TILES_DIR" build/world.mbtiles

node scripts/05_make_tilesjson.mjs \
    --out "$TILES_DIR" \
    --tiles-url-template "$TILES_URL_TEMPLATE" \
    ${TILEJSON_OUT:+--tilejson-out "$TILEJSON_OUT"}
