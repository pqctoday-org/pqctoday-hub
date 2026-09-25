#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-only
# Run acvp_native_runner.py for every fixture bundle inside an EXISTING
# container, against a PKCS#11 .so already present in that container, and copy
# the three output files per fixture back into the evidence run directory.
#
# Read-only towards the container's shared paths: everything is staged in a
# private /tmp/acvp-h-<pid> inside the container and removed afterwards.
# Nothing is built here — building engines is a separate, recorded step
# (see tools/acvp-native/README.md).
#
# --module-from-host PATH copies a host-side engine .so into the private staging
# dir first (e.g. an engine built earlier and kept outside the container) and
# uses that copy; its SHA-256 is what the runner records.
#
# usage: run-in-container.sh --container NAME (--module /path/in/container.so | --module-from-host PATH) \
#          --engine cpp|rust --target TARGET_ID --label "TARGET LABEL" \
#          --run evidence/acvp-xplat/<runId> --bundles <host dir with cpp/<fixture>/> \
#          [--image-name N --image-id SHA] [--host-machine TEXT] \
#          [--acceleration none|enabled|unknown --acceleration-detail TEXT]
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES=(ML-KEM-encapDecap-FIPS203 ML-DSA-sigVer-FIPS204)
ACCEL=unknown ACCEL_DETAIL="" IMAGE_NAME="" IMAGE_ID="" HOST_MACHINE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --container) CONTAINER="$2"; shift 2 ;;
    --module) MODULE="$2"; shift 2 ;;
    --module-from-host) MODULE_HOST="$2"; shift 2 ;;
    --engine) ENGINE="$2"; shift 2 ;;
    --target) TARGET="$2"; shift 2 ;;
    --label) LABEL="$2"; shift 2 ;;
    --run) RUN="$2"; shift 2 ;;
    --bundles) BUNDLES="$2"; shift 2 ;;
    --image-name) IMAGE_NAME="$2"; shift 2 ;;
    --image-id) IMAGE_ID="$2"; shift 2 ;;
    --host-machine) HOST_MACHINE="$2"; shift 2 ;;
    --acceleration) ACCEL="$2"; shift 2 ;;
    --acceleration-detail) ACCEL_DETAIL="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 64 ;;
  esac
done
: "${CONTAINER:?}" "${ENGINE:?}" "${TARGET:?}" "${LABEL:?}" "${RUN:?}" "${BUNDLES:?}"

T="/tmp/acvp-h-$$"
cleanup() { docker exec "$CONTAINER" rm -rf "$T" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker exec "$CONTAINER" mkdir -p "$T/runner" "$T/bundles" "$T/out" "$T/engine"
if [[ -n "${MODULE_HOST:-}" ]]; then
  MODULE="$T/engine/$(basename "$MODULE_HOST")"
  docker cp -q "$MODULE_HOST" "$CONTAINER:$MODULE"
fi
: "${MODULE:?--module or --module-from-host is required}"
for f in acvp_native_runner.py pkcs11_constants.py hub_contract.json; do
  docker cp -q "$HERE/$f" "$CONTAINER:$T/runner/$f"
done
BUILD_INFO_ARG=()
if [[ -f "$RUN/targets/$TARGET/build-info.json" ]]; then
  docker cp -q "$RUN/targets/$TARGET/build-info.json" "$CONTAINER:$T/build-info.json"
  BUILD_INFO_ARG=(--build-info "$T/build-info.json")
fi

rc=0
for fx in "${FIXTURES[@]}"; do
  docker cp -q "$BUNDLES/cpp/$fx" "$CONTAINER:$T/bundles/$fx"
  args=(--bundle "$T/bundles/$fx" --module "$MODULE" --engine-id "$ENGINE" --out "$T/out/$fx"
        --target-id "$TARGET" --target-label "$LABEL" --acceleration "$ACCEL" --work-dir "$T/work-$fx")
  [[ -n "$ACCEL_DETAIL" ]] && args+=(--acceleration-detail "$ACCEL_DETAIL")
  [[ -n "$IMAGE_NAME" ]] && args+=(--image-name "$IMAGE_NAME")
  [[ -n "$IMAGE_ID" ]] && args+=(--image-id "$IMAGE_ID")
  [[ -n "$HOST_MACHINE" ]] && args+=(--host-machine "$HOST_MACHINE")
  docker exec "$CONTAINER" python3 "$T/runner/acvp_native_runner.py" "${args[@]}" ${BUILD_INFO_ARG[@]+"${BUILD_INFO_ARG[@]}"} || rc=$?
  mkdir -p "$RUN/targets/$TARGET/$fx"
  for f in response.json evidence.json execution-environment.json; do
    docker cp -q "$CONTAINER:$T/out/$fx/$f" "$RUN/targets/$TARGET/$fx/$f"
  done
done
exit "$rc"
