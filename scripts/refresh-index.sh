#!/usr/bin/env bash
# refresh-index.sh — rebuild the RAG search index from source data and re-sign it.
#
# Run this LOCALLY (not in CI): the embedding step uses an on-device ONNX model
# that is far too slow on GitHub runners. Data/feature PRs do NOT regenerate the
# index — `.gitattributes merge=ours` keeps them from conflicting on it — so the
# index is rebuilt here, in one batch, after data changes land.
#
#   npm run refresh-index
#   git add public/data/{rag-corpus.json,rag-corpus.json.sig,embeddings.bin,embeddings-meta.json}
#   git commit -m "chore(data): refresh RAG index"
#
# Signing key: set ATTESTATION_PRIVATE_KEY_FILE, or place the maintainer key at
# ~/.pqctoday-attestation/maintainer-private.key (default).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 1/3  Generating RAG corpus (fast, pure JS)…"
npx tsx scripts/generate-rag-corpus.ts

echo "▶ 2/3  Building embedding index (local ONNX — a few minutes)…"
npm run --silent generate-embeddings

echo "▶ 3/3  Signing attestable artifacts…"
KEY="${ATTESTATION_PRIVATE_KEY_FILE:-$HOME/.pqctoday-attestation/maintainer-private.key}"
if [ ! -f "$KEY" ]; then
  echo "✗ Signing key not found at: $KEY"
  echo "  Set ATTESTATION_PRIVATE_KEY_FILE to the maintainer key path and re-run,"
  echo "  or sign manually:  ATTESTATION_PRIVATE_KEY_FILE=<path> npm run trust-engine:sign"
  exit 1
fi
ATTESTATION_PRIVATE_KEY_FILE="$KEY" npm run --silent trust-engine:sign

echo "▶ Verifying corpus⇄embeddings⇄source freshness…"
npx tsx scripts/ci/check-index-freshness.ts

echo
echo "✓ Index refreshed. Review & commit:"
echo "    git add public/data/{rag-corpus.json,rag-corpus.json.sig,embeddings.bin,embeddings-meta.json}"
echo "    git commit -m 'chore(data): refresh RAG index'"
