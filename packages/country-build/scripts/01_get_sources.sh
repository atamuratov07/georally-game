#!/usr/bin/env bash
set -euo pipefail

# Natural Earth 5.1 layers; the zips are committed, so this only fills gaps.
mkdir -p upstream

fetch() {
    [ -f "upstream/$2.zip" ] ||
        curl -fL "https://naciscdn.org/naturalearth/$1/$2.zip" -o "upstream/$2.zip"
}

fetch 10m/cultural ne_10m_admin_0_countries_lakes
fetch 10m/physical ne_10m_geographic_lines
fetch 10m/physical ne_10m_geography_marine_polys
fetch 110m/cultural ne_110m_admin_0_countries
