#!/usr/bin/env bash
set -euo pipefail

mkdir -p upstream

[ -f upstream/ne_110m_admin_0_countries.zip ] || \
  curl -fL "https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip" \
  -o upstream/ne_110m_admin_0_countries.zip
