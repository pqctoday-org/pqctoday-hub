#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
#
# Runs INSIDE the emsdk container (Dockerfile.wasm, stage "tool"). Compiles the
# NIST SP 800-90B mains against the WASM dependency prefix and writes the
# artefacts plus BUILDINFO.json to $1.
set -euo pipefail

OUT="${1:?output dir}"
PREFIX="${PREFIX:-/opt/wasm}"
SRC=/src/nist/cpp
mkdir -p "$OUT"

# Flags mirror the upstream Makefile (-std=c++11 -O2) minus -fopenmp (replaced
# by compat/omp.h) and the x87-only -ffloat-store / host-only -march=native.
# asserts stay ON (no -DNDEBUG), exactly as upstream builds them.
# -sPRINTF_LONG_DOUBLE=1: emscripten's default printf converts long double to
# double, which would misprint the tool's %.22Lg verbose lines.
CXXFLAGS=(-std=c++11 -O2 -ffp-contract=off -Wno-unknown-pragmas
  -I/src/compat -I"$PREFIX/include")
LIBS=("$PREFIX/lib/libldbl128.a" "$PREFIX/lib/libbz2.a" "$PREFIX/lib/libdivsufsort.a" "$PREFIX/lib/libdivsufsort64.a"
  "$PREFIX/lib/libjsoncpp.a" "$PREFIX/lib/libcrypto.a")
LDFLAGS=(-sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node
  -sINVOKE_RUN=0 -sEXIT_RUNTIME=1 -sEXPORTED_RUNTIME_METHODS=callMain,FS
  -sFORCE_FILESYSTEM=1 -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=64MB
  -sMAXIMUM_MEMORY=4GB -sSTACK_SIZE=8MB -sPRINTF_LONG_DOUBLE=1)

build() {
  local main="$1" out="$2" export="$3"
  echo ">> em++ $main -> $out"
  em++ "${CXXFLAGS[@]}" "$SRC/$main" -o "$OUT/$out.mjs" "${LIBS[@]}" \
    "${LDFLAGS[@]}" -sEXPORT_NAME="$export"
}

build non_iid_main.cpp ea_non_iid createEaNonIid
build iid_main.cpp ea_iid createEaIid
build restart_main.cpp ea_restart createEaRestart

EMCC_VERSION="$(emcc --version | head -1)"
{
  echo "{"
  echo "  \"tool\": \"usnistgov/SP800-90B_EntropyAssessment\","
  echo "  \"nistCommit\": \"${NIST_COMMIT}\","
  echo "  \"toolVersionString\": \"$(grep -m1 '#define VERSION' $SRC/shared/utils.h | cut -d'"' -f2)\","
  echo "  \"compiler\": \"${EMCC_VERSION//\"/}\","
  echo "  \"cxxflags\": \"${CXXFLAGS[*]}\","
  echo "  \"ldflags\": \"${LDFLAGS[*]}\","
  echo "  \"sourcePatches\": [],"
  echo "  \"deps\": {\"bzip2\": \"1.0.8\", \"libdivsufsort\": \"2.0.1\", \"jsoncpp\": \"1.9.8\", \"openssl\": \"3.6.4\"},"
  echo "  \"files\": {"
  first=1
  for f in "$OUT"/ea_*.mjs "$OUT"/ea_*.wasm; do
    [[ $first -eq 1 ]] || echo ","
    first=0
    printf '    "%s": {"bytes": %s, "sha256": "%s"}' "$(basename "$f")" \
      "$(stat -c %s "$f")" "$(sha256sum "$f" | cut -d' ' -f1)"
  done
  echo ""
  echo "  }"
  echo "}"
} > "$OUT/BUILDINFO.json"

mkdir -p "$OUT/licenses"
cp /src/LICENSE.bzip2 /src/LICENSE.libdivsufsort /src/LICENSE.jsoncpp /src/LICENSE.openssl /src/LICENSE.glibc-ldbl128 "$OUT/licenses/"
# The NIST tool's licence notice is the "## License" section of its README.
awk '/^## License/{on=1; next} /^## /{on=0} on' /src/nist/README.md > "$OUT/licenses/NOTICE.nist-sp800-90b"
cat "$OUT/BUILDINFO.json"
