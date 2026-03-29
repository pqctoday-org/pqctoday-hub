#!/usr/bin/env python3
"""
scripts/extract-source-passages.py

For each library record with a local source file, extract 3-5 key passages
(<=200 chars each) using a sliding window + TF-IDF scoring approach.

Passages are stored in scripts/source-passages-MMDDYYYY.json and consumed by
generate-rag-corpus.ts to populate RAGChunkProvenance.sourcePassages[].

Usage:
  python3 scripts/extract-source-passages.py
  python3 scripts/extract-source-passages.py --collection library
  python3 scripts/extract-source-passages.py --ref-id FIPS-203
  python3 scripts/extract-source-passages.py --limit 50
  python3 scripts/extract-source-passages.py --dry-run
"""

import csv
import json
import math
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data"
OUTPUT_DIR = ROOT / "scripts"
TODAY = datetime.now().strftime("%m%d%Y")

# Passage constraints
MAX_PASSAGE_CHARS = 200
MIN_PASSAGE_CHARS = 40
PASSAGES_PER_DOC = 5
WINDOW_STEP_CHARS = 50    # Sliding window step size
MAX_TEXT_CHARS = 50_000   # Only process first 50KB of text (avoid huge PDFs)

# IDF-boosting terms specific to this domain (higher weight in TF-IDF)
DOMAIN_BOOST_TERMS = {
    "ml-kem", "ml-dsa", "slh-dsa", "falcon", "frodokem", "hqc", "bike",
    "pqc", "post-quantum", "quantum-safe", "kyber", "dilithium",
    "fips", "nist", "rfc", "ietf", "cnsa", "algorithm",
    "migration", "hybrid", "encapsulation", "signature", "key", "certificate",
    "tls", "x.509", "pkix", "cms", "pkcs", "asn.1",
    "security level", "key size", "signature size", "public key",
    "level 1", "level 3", "level 5", "finalized", "standardized",
}


# ─── CSV Utilities ────────────────────────────────────────────────────────────
def find_latest_csv(prefix):
    pattern = re.compile(rf"^{re.escape(prefix)}_(\d{{8}})(_r\d+)?\.csv$")
    candidates = []
    for f in DATA_DIR.iterdir():
        m = pattern.match(f.name)
        if m:
            candidates.append((m.group(1), m.group(2) or "", f))
    if not candidates:
        return None
    candidates.sort(key=lambda x: (x[0], x[1]))
    return candidates[-1][2]


def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ─── Text Extraction ──────────────────────────────────────────────────────────
def extract_text_from_html(path: Path) -> str:
    """Strip HTML tags and normalize whitespace."""
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""

    # Remove <script>, <style> blocks entirely
    raw = re.sub(r"<(script|style)[^>]*>.*?</(script|style)>", " ", raw, flags=re.DOTALL | re.IGNORECASE)
    # Strip remaining tags
    text = re.sub(r"<[^>]+>", " ", raw)
    # Decode common HTML entities
    text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = text.replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"')
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_TEXT_CHARS]


def extract_text_from_pdf(path: Path) -> str:
    """Use pdftotext if available, otherwise return empty string."""
    try:
        result = subprocess.run(
            ["pdftotext", "-l", "20", str(path), "-"],  # -l 20: first 20 pages only
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and result.stdout:
            text = re.sub(r"\s+", " ", result.stdout).strip()
            return text[:MAX_TEXT_CHARS]
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return ""


def extract_text(path: Path) -> str:
    """Dispatch to the right extractor based on file extension."""
    suffix = path.suffix.lower()
    if suffix in (".html", ".htm"):
        return extract_text_from_html(path)
    elif suffix == ".pdf":
        return extract_text_from_pdf(path)
    else:
        # Try as plain text
        try:
            return path.read_text(encoding="utf-8", errors="replace")[:MAX_TEXT_CHARS]
        except OSError:
            return ""


# ─── TF-IDF Passage Scoring ───────────────────────────────────────────────────
def tokenize(text: str) -> list[str]:
    """Lowercase, extract word tokens."""
    return re.findall(r"[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?", text.lower())


def build_bigrams(tokens: list[str]) -> list[str]:
    """Add bigrams to improve phrase matching."""
    return tokens + [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]


def compute_tf(tokens: list[str]) -> dict[str, float]:
    """Term frequency (normalized)."""
    if not tokens:
        return {}
    counts = Counter(tokens)
    total = sum(counts.values())
    return {term: count / total for term, count in counts.items()}


def compute_idf(all_window_tokens: list[list[str]]) -> dict[str, float]:
    """Inverse document frequency across all windows."""
    n = len(all_window_tokens)
    if n == 0:
        return {}
    doc_freq: dict[str, int] = {}
    for tokens in all_window_tokens:
        for term in set(tokens):
            doc_freq[term] = doc_freq.get(term, 0) + 1
    idf = {}
    for term, df in doc_freq.items():
        base = math.log((n + 1) / (df + 1)) + 1.0
        # Boost domain-specific terms
        boost = 2.0 if any(domain_t in term for domain_t in DOMAIN_BOOST_TERMS) else 1.0
        idf[term] = base * boost
    return idf


def score_window(tf: dict[str, float], idf: dict[str, float]) -> float:
    """TF-IDF score for a window."""
    return sum(tf_val * idf.get(term, 1.0) for term, tf_val in tf.items())


def clean_passage(text: str) -> str:
    """Clean a raw passage for output."""
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Truncate at sentence boundary if possible
    if len(text) > MAX_PASSAGE_CHARS:
        # Try to end at a sentence/clause boundary
        truncated = text[:MAX_PASSAGE_CHARS]
        for boundary in (". ", "; ", ", ", " "):
            idx = truncated.rfind(boundary)
            if idx > MAX_PASSAGE_CHARS * 0.6:
                return truncated[: idx + 1].strip()
        return truncated.strip()
    return text


def is_good_passage(text: str) -> bool:
    """Reject boilerplate / low-quality passages."""
    t = text.lower()
    # Must have some alphabetic content
    if len(re.findall(r"[a-z]", t)) < 20:
        return False
    # Skip navigation/menu-like text
    if any(nav in t for nav in ("skip to", "menu", "breadcrumb", "back to top",
                                "table of contents", "copyright ©", "all rights reserved")):
        return False
    # Skip passages dominated by repeated dots (table-of-contents leaders)
    dot_ratio = text.count(".") / max(len(text), 1)
    if dot_ratio > 0.15:
        return False
    # Skip directory listings (common in 3GPP ftp-style pages)
    if re.search(r"\bDirectory Listing\b|\bftp\.3gpp\.org\b", text, re.IGNORECASE):
        return False
    # Skip passages that are mostly numbers / punctuation
    alpha_ratio = len(re.findall(r"[a-z]", t)) / max(len(t), 1)
    if alpha_ratio < 0.4:
        return False
    return True


def extract_key_passages(text: str, n: int = PASSAGES_PER_DOC) -> list[dict]:
    """
    Use sliding window + TF-IDF to extract the n most informative passages.
    Returns list of { text, char_offset, score } dicts.
    """
    if not text or len(text) < MIN_PASSAGE_CHARS:
        return []

    # Build sliding windows
    windows = []
    for start in range(0, len(text) - MIN_PASSAGE_CHARS, WINDOW_STEP_CHARS):
        end = min(start + MAX_PASSAGE_CHARS, len(text))
        window_text = text[start:end]
        tokens = build_bigrams(tokenize(window_text))
        windows.append({"start": start, "end": end, "text": window_text, "tokens": tokens})

    if not windows:
        return []

    # Compute IDF across all windows
    idf = compute_idf([w["tokens"] for w in windows])

    # Score each window
    scored = []
    for w in windows:
        tf = compute_tf(w["tokens"])
        score = score_window(tf, idf)
        scored.append({**w, "score": score})

    # Sort by score descending, then pick top-N with diversity (no overlapping windows)
    scored.sort(key=lambda x: x["score"], reverse=True)

    selected = []
    used_ranges: list[tuple[int, int]] = []

    for w in scored:
        if len(selected) >= n:
            break

        # Check overlap with already-selected windows (require >= 80-char gap)
        overlap = any(
            not (w["end"] + 80 <= used_start or w["start"] >= used_end + 80)
            for used_start, used_end in used_ranges
        )
        if overlap:
            continue

        passage_text = clean_passage(w["text"])
        if not is_good_passage(passage_text) or len(passage_text) < MIN_PASSAGE_CHARS:
            continue

        selected.append({
            "text": passage_text,
            "char_offset": w["start"],
            "score": round(w["score"], 4),
        })
        used_ranges.append((w["start"], w["end"]))

    # Return sorted by document order (char_offset)
    selected.sort(key=lambda x: x["char_offset"])
    return selected


# ─── Main ─────────────────────────────────────────────────────────────────────
def run(collection_filter=None, ref_id_filter=None, limit=None, dry_run=False):
    results: dict[str, list[dict]] = {}
    processed = 0
    skipped_no_file = 0
    skipped_no_text = 0
    errors = 0

    # Collect all records with local files across collections
    collections = ["library", "timeline", "threats"] if not collection_filter else [collection_filter]
    all_records = []
    for coll in collections:
        csv_path = find_latest_csv(coll)
        if not csv_path:
            print(f"  [warn] No CSV found for collection '{coll}'", file=sys.stderr)
            continue
        rows = load_csv(csv_path)
        for row in rows:
            row["_collection"] = coll
        all_records.extend(rows)

    print(f"Total records: {len(all_records)}", file=sys.stderr)

    # Filter to records with local files
    with_files = [
        r for r in all_records
        if r.get("local_file") and (ROOT / r["local_file"]).exists()
    ]
    print(f"Records with local source files: {len(with_files)}", file=sys.stderr)

    if ref_id_filter:
        with_files = [r for r in with_files if r.get("reference_id") == ref_id_filter]
        print(f"Filtered to ref_id='{ref_id_filter}': {len(with_files)} records", file=sys.stderr)

    if limit:
        with_files = with_files[:limit]

    if dry_run:
        print("\nDRY RUN — would process:", file=sys.stderr)
        for r in with_files[:20]:
            print(f"  {r.get('reference_id', '?')} → {r['local_file']}", file=sys.stderr)
        if len(with_files) > 20:
            print(f"  ... and {len(with_files) - 20} more", file=sys.stderr)
        return {}

    for i, rec in enumerate(with_files):
        ref_id = rec.get("reference_id", f"row-{i}")
        local_file = rec["local_file"]
        path = ROOT / local_file

        sys.stdout.write(f"  [{i+1}/{len(with_files)}] {ref_id[:60]}...")
        sys.stdout.flush()

        try:
            text = extract_text(path)
        except Exception as e:
            print(f" ERROR: {e}")
            errors += 1
            continue

        if not text or len(text) < MIN_PASSAGE_CHARS:
            print(f" skip (no extractable text)")
            skipped_no_text += 1
            continue

        passages = extract_key_passages(text)
        if passages:
            results[ref_id] = passages
            print(f" {len(passages)} passages (top score: {passages[0]['score'] if passages else 0:.2f})")
            processed += 1
        else:
            print(f" skip (no quality passages)")
            skipped_no_text += 1

    # Write output
    output = {
        "generated": datetime.now().isoformat(),
        "total_records": len(with_files),
        "processed": processed,
        "skipped_no_text": skipped_no_text,
        "skipped_no_file": skipped_no_file,
        "errors": errors,
        "passages": results,
    }

    out_path = OUTPUT_DIR / f"source-passages-{TODAY}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nProcessed: {processed} | Skipped: {skipped_no_text} | Errors: {errors}")
    print(f"Output: {out_path}")
    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract key passages from source documents")
    parser.add_argument("--collection", choices=["library", "timeline", "threats"],
                        help="Process only one collection")
    parser.add_argument("--ref-id", help="Process only one specific reference ID")
    parser.add_argument("--limit", type=int, help="Limit number of records processed")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no extraction")
    args = parser.parse_args()

    run(
        collection_filter=args.collection,
        ref_id_filter=args.ref_id,
        limit=args.limit,
        dry_run=args.dry_run,
    )
