#!/usr/bin/env python3
"""Shared helpers for the scripts that back src/data/validation/vector-manifest.json.

Every vector file under src/data/acvp that carries a `source.kind == "nist-acvp-server"`
manifest entry records, in the manifest and/or in the file's own `_provenance` block:

  * the upstream repository (usnistgov/ACVP-Server),
  * the pinned commit (`source.revision` / `_provenance.source_commit`),
  * one or more upstream paths (`_provenance.source_files[].source_path`, a
    per-testGroup `source_path`, `_provenance.source_path`, or the manifest's
    `source.nist.upstreamPath`),
  * the SHA-256 each of those upstream files must hash to.

This module fetches those files at the pinned commit, verifies the digest, and caches
them on disk so the reproduction and cross-check scripts can be re-run offline.

Nothing here reads or trusts any hub implementation of a cryptographic primitive; it
only moves bytes and checks digests.
"""

from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

RAW_BASE = 'https://raw.githubusercontent.com/usnistgov/ACVP-Server'

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / 'src/data/validation/vector-manifest.json'
DEFAULT_CACHE = REPO_ROOT / 'tmp/acvp-upstream-cache'


class UpstreamError(RuntimeError):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def load_manifest(path: Path | None = None) -> dict:
    return json.loads((path or MANIFEST_PATH).read_text())


def manifest_entry(vector_id: str, manifest: dict | None = None) -> dict:
    manifest = manifest or load_manifest()
    for entry in manifest['files']:
        if entry['id'] == vector_id:
            return entry
    raise UpstreamError(f'no manifest entry with id {vector_id!r}')


@dataclass(frozen=True)
class UpstreamFile:
    """One pinned upstream ACVP-Server file."""

    commit: str
    path: str
    expected_sha256: str | None

    @property
    def url(self) -> str:
        return f'{RAW_BASE}/{self.commit}/{self.path}'


class UpstreamCache:
    """Fetch-once, digest-verified store of pinned upstream files."""

    def __init__(self, cache_dir: Path | None = None, offline: bool = False, quiet: bool = False):
        self.cache_dir = Path(cache_dir or DEFAULT_CACHE)
        self.offline = offline
        self.quiet = quiet
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._mem: dict[tuple[str, str], bytes] = {}
        self.fetched: list[str] = []
        self.reused: list[str] = []

    def _local(self, uf: UpstreamFile) -> Path:
        safe = uf.path.replace('/', '__')
        return self.cache_dir / f'{uf.commit[:12]}__{safe}'

    def _log(self, msg: str) -> None:
        if not self.quiet:
            print(msg, file=sys.stderr)

    def raw(self, uf: UpstreamFile) -> bytes:
        key = (uf.commit, uf.path)
        if key in self._mem:
            return self._mem[key]
        local = self._local(uf)
        data: bytes | None = None
        if local.exists():
            data = local.read_bytes()
            if uf.expected_sha256 and sha256_bytes(data) != uf.expected_sha256:
                self._log(f'cache digest mismatch, refetching: {local}')
                data = None
            else:
                self.reused.append(uf.path)
        if data is None:
            if self.offline:
                raise UpstreamError(f'--offline and not cached: {uf.url}')
            self._log(f'fetch {uf.url}')
            with urllib.request.urlopen(uf.url, timeout=120) as resp:  # noqa: S310 (pinned raw URL)
                if resp.status != 200:
                    raise UpstreamError(f'HTTP {resp.status} for {uf.url}')
                data = resp.read()
            got = sha256_bytes(data)
            if uf.expected_sha256 and got != uf.expected_sha256:
                raise UpstreamError(
                    f'upstream digest mismatch for {uf.path}\n'
                    f'  recorded: {uf.expected_sha256}\n  fetched : {got}'
                )
            local.write_bytes(data)
            self.fetched.append(uf.path)
        self._mem[key] = data
        return data

    def json(self, uf: UpstreamFile) -> dict:
        return json.loads(self.raw(uf))


def declared_upstream(entry: dict, vector: dict) -> tuple[str, dict[str, str | None]]:
    """Return (commit, {upstream_path: expected_sha256}) declared for one vector file.

    Merges every place the provenance record names an upstream file:
      manifest source.nist.upstreamPath / upstreamSha256,
      manifest source.verification.evidence[].title / sha256,
      the file's _provenance.source_path / source_sha256,
      the file's _provenance.source_files[],
      each testGroup's own source_path / source_sha256.
    """
    prov = vector.get('_provenance') or {}
    nist = entry['source'].get('nist') or {}
    commit = prov.get('source_commit') or nist.get('revision') or entry['source'].get('revision')
    if not commit:
        raise UpstreamError(f'{entry["id"]}: no pinned commit recorded')

    paths: dict[str, str | None] = {}

    def add(path: str | None, digest: str | None) -> None:
        if not path:
            return
        prev = paths.get(path)
        if prev and digest and prev != digest:
            raise UpstreamError(
                f'{entry["id"]}: conflicting recorded digests for {path}: {prev} vs {digest}'
            )
        paths[path] = prev or digest

    add(nist.get('upstreamPath'), nist.get('upstreamSha256'))
    for ev in ((entry['source'].get('verification') or {}).get('evidence') or []):
        title = ev.get('title') or ''
        if title.startswith('gen-val/'):
            add(title, ev.get('sha256'))
    add(prov.get('source_path'), prov.get('source_sha256'))
    for sf in prov.get('source_files') or []:
        add(sf.get('source_path'), sf.get('source_sha256'))
    for group in vector.get('testGroups') or []:
        if isinstance(group, dict):
            add(group.get('source_path'), group.get('source_sha256'))

    if not paths:
        raise UpstreamError(f'{entry["id"]}: no upstream path recorded anywhere')
    return commit, paths


def group_upstream_path(entry: dict, vector: dict, group: dict) -> str:
    """The upstream file a single local testGroup was cut from."""
    prov = vector.get('_provenance') or {}
    return (
        group.get('source_path')
        or prov.get('source_path')
        or ((entry['source'].get('nist') or {}).get('upstreamPath'))
    )


def index_upstream_cases(upstream: dict) -> dict[int, tuple[dict, dict]]:
    """tcId -> (group, case) for every case in an upstream ACVP projection/prompt file."""
    out: dict[int, tuple[dict, dict]] = {}
    for group in upstream.get('testGroups') or []:
        for case in group.get('tests') or []:
            tc = case.get('tcId')
            if tc is not None:
                out[tc] = (group, case)
    return out

