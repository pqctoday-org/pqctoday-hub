#!/bin/bash
# Phase Color Validation Script
# Validates that all CSV categories have corresponding Phase type definitions and color mappings

set -e

echo "🔍 Phase Color Validation Script"
echo "================================="
echo ""

# Extract unique categories from CSV using Python for proper quoted field handling
echo "📊 Extracting categories from timeline_02132026.csv..."
CSV_PHASES=$(python3 -c "
import csv, sys
with open('src/data/timeline_02132026.csv') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    phases = set()
    for row in reader:
        if len(row) >= 7 and row[6].strip():
            phases.add(row[6].strip())
    for p in sorted(phases):
        print(p)
")

# Extract defined phases from timeline.ts (only Phase type, not EventType)
echo "📝 Extracting Phase type definitions from timeline.ts..."
DEFINED_PHASES=$(sed -n '/^export type Phase/,/^$/p' src/types/timeline.ts | grep "'" | sed "s/.*'\(.*\)'.*/\1/" | sort)

# Find mismatches
echo ""
echo "❌ CSV Categories NOT in Phase type definition:"
echo "================================================"
INVALID_CATS=$(comm -23 <(echo "$CSV_PHASES" | sort) <(echo "$DEFINED_PHASES" | sort))
if [ -z "$INVALID_CATS" ]; then
  echo "  ✅ None (all CSV categories are valid)"
else
  echo "$INVALID_CATS" | while read -r cat; do
    COUNT=$(grep -c ",$cat," src/data/timeline_02132026.csv || echo "0")
    echo "  - $cat ($COUNT occurrences)"
  done
  INVALID_COUNT=$(echo "$INVALID_CATS" | wc -l | tr -d ' ')
  echo ""
  echo "  Total invalid categories: $INVALID_COUNT"
fi

echo ""
echo "⚠️  Phase types NOT found in CSV data:"
echo "======================================"
UNUSED_PHASES=$(comm -13 <(echo "$CSV_PHASES" | sort) <(echo "$DEFINED_PHASES" | sort))
if [ -z "$UNUSED_PHASES" ]; then
  echo "  ✅ None (all phases are used in CSV)"
else
  echo "$UNUSED_PHASES" | while read -r phase; do
    echo "  - $phase (defined but not used)"
  done
fi

echo ""
echo "🎨 Checking CSS color variable definitions..."
echo "=============================================="
CSS_FILE="src/styles/index.css"
MISSING_COLORS=0

while IFS= read -r PHASE; do
  PHASE_VAR="--phase-$(echo "$PHASE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
  # Use grep with -F and -- to prevent flag interpretation
  if ! grep -F -- "$PHASE_VAR" "$CSS_FILE" > /dev/null 2>&1; then
    echo "  - Missing: $PHASE_VAR (for $PHASE)"
    MISSING_COLORS=$((MISSING_COLORS + 1))
  fi
done <<< "$DEFINED_PHASES"

if [ $MISSING_COLORS -eq 0 ]; then
  echo "  ✅ All phases have CSS color variables"
fi

echo ""
echo "📈 Summary:"
echo "==========="
TOTAL_CSV=$(echo "$CSV_PHASES" | wc -l | tr -d ' ')
TOTAL_DEFINED=$(echo "$DEFINED_PHASES" | wc -l | tr -d ' ')
echo "  CSV categories: $TOTAL_CSV"
echo "  Defined phases: $TOTAL_DEFINED"
echo "  Missing CSS variables: $MISSING_COLORS"

if [ -n "$INVALID_CATS" ]; then
  echo ""
  echo "⚠️  WARNING: CSV contains categories not defined in Phase type!"
  echo "   These will display with fallback (gray) colors."
  echo "   See docs/phase-color-validation.md for recommendations."
  exit 1
else
  echo ""
  echo "✅ All CSV categories are properly defined!"
  exit 0
fi
