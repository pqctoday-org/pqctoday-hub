#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Unit tests for copy_upstream_cases.py (offline: synthetic upstream, manifest, vector).

  python3 -m unittest scripts/acvp/test_copy_upstream_cases.py
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import copy_upstream_cases as cuc  # noqa: E402
from acvp_upstream import UpstreamError, sha256_bytes  # noqa: E402

UPSTREAM_PATH = 'gen-val/json-files/X/internalProjection.json'


def upstream_doc() -> dict:
    return {'testGroups': [
        {'tgId': 2, 'parameterSet': 'P', 'preHash': 'preHash', 'deferred': False, 'tests': [
            {'tcId': 1, 'hashAlg': 'SHA2-256', 'message': 'aa', 'context': '', 'testPassed': True, 'deferred': False},
            {'tcId': 2, 'hashAlg': 'SHA2-512/224', 'message': 'bbcc', 'context': '01', 'testPassed': False, 'deferred': False},
        ]},
        {'tgId': 4, 'parameterSet': 'Q', 'preHash': 'preHash', 'deferred': False, 'tests': [
            {'tcId': 9, 'hashAlg': 'SHA2-512/256', 'message': 'dd', 'context': '', 'testPassed': True, 'deferred': False},
        ]},
    ]}


class FakeCache:
    def __init__(self, doc: dict):
        self.doc = doc

    def json(self, uf):
        assert uf.path == UPSTREAM_PATH
        return self.doc


def write_fixture(tmp: Path) -> tuple[Path, Path]:
    vector = {
        '_provenance': {'source_commit': 'c' * 40, 'source_path': UPSTREAM_PATH, 'source_sha256': None},
        'testGroups': [{'tgId': 2, 'parameterSet': 'P', 'preHash': 'preHash', 'tests': [
            {'tcId': 1, 'hashAlg': 'SHA2-256', 'message': 'aa', 'context': '', 'testPassed': True},
        ]}],
        'notExecuted': [
            {'tgId': 2, 'tcId': 2, 'hashAlg': 'SHA2-512/224', 'why': 'no-mech'},
            {'tgId': 4, 'tcId': 9, 'hashAlg': 'SHA2-512/256', 'why': 'no-mech'},
            {'tgId': 6, 'cases': 3, 'why': 'other-reason'},
        ],
    }
    vdir = tmp / 'acvp'
    vdir.mkdir()
    vpath = vdir / 'v_test.json'
    vpath.write_text(cuc.dumps(vector))
    manifest = {'files': [{
        'id': 'v_test', 'path': 'src/data/acvp/v_test.json', 'sha256': sha256_bytes(vpath.read_bytes()),
        'source': {'kind': 'nist-acvp-server', 'revision': 'c' * 40,
                   'nist': {'upstreamPath': UPSTREAM_PATH, 'upstreamSha256': None}},
        'cases': [{'caseId': 'v_test#/testGroups/0/tests/0', 'pointer': '/testGroups/0/tests/0',
                   'parameters': {'parameterSet': 'P', 'hashAlg': 'SHA2-256', 'messageBytes': 1, 'contextBytes': 0},
                   'expectation': 'positive', 'upstream': {'tgId': 2, 'tcId': 1}, 'lineage': ['v-tg2']}],
        'lineage': [{'id': 'v-tg2', 'appliesTo': ['v_test#/testGroups/0/tests/0'],
                     'transformations': [{'type': 'subset', 'detail': '1 case'},
                                         {'type': 'field-drop', 'detail': 'upstream fields not carried: deferred'}]}],
    }]}
    mpath = tmp / 'manifest.json'
    mpath.write_text(cuc.dumps(manifest))
    return mpath, vdir


class CopyUpstreamCasesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.mpath, self.vdir = write_fixture(self.tmp)

    def run_copy(self, **kw):
        return cuc.run('v_test', kw.get('whys', {'no-mech'}), kw.get('tcids'), FakeCache(upstream_doc()),
                       dry_run=kw.get('dry_run', False), manifest_path=self.mpath,
                       vector_root=self.vdir, when='2026-10-22', fmt=None, note=kw.get('note'),
                       repo_root=self.tmp)

    def load(self):
        return (json.loads((self.vdir / 'v_test.json').read_text()),
                json.loads(self.mpath.read_text())['files'][0])

    def test_copies_into_existing_and_new_groups_byte_for_byte(self):
        copied = self.run_copy()
        self.assertEqual([(c['tgId'], c['tcId']) for c in copied], [(2, 2), (4, 9)])
        vector, entry = self.load()
        g0, g1 = vector['testGroups']
        # only the fields the file carries, upstream values unchanged, 'deferred' still dropped
        self.assertEqual(g0['tests'][1], {'tcId': 2, 'hashAlg': 'SHA2-512/224', 'message': 'bbcc',
                                          'context': '01', 'testPassed': False})
        self.assertEqual({k: v for k, v in g1.items() if k != 'tests'},
                         {'tgId': 4, 'parameterSet': 'Q', 'preHash': 'preHash'})
        self.assertEqual(g1['tests'], [{'tcId': 9, 'hashAlg': 'SHA2-512/256', 'message': 'dd',
                                        'context': '', 'testPassed': True}])
        # only the copied rows leave notExecuted
        self.assertEqual(vector['notExecuted'], [{'tgId': 6, 'cases': 3, 'why': 'other-reason'}])

    def test_manifest_records_cases_lineage_and_digest(self):
        self.run_copy()
        vector, entry = self.load()
        self.assertEqual(entry['sha256'], sha256_bytes((self.vdir / 'v_test.json').read_bytes()))
        recs = {r['pointer']: r for r in entry['cases']}
        r = recs['/testGroups/0/tests/1']
        self.assertEqual(r['upstream'], {'tgId': 2, 'tcId': 2})
        self.assertEqual(r['parameters'], {'parameterSet': 'P', 'hashAlg': 'SHA2-512/224',
                                           'messageBytes': 2, 'contextBytes': 1})
        self.assertEqual(r['expectation'], 'negative')
        self.assertEqual(r['lineage'], ['v-tg2'])
        new = recs['/testGroups/1/tests/0']
        self.assertEqual(new['parameters']['parameterSet'], 'Q')
        self.assertEqual(new['lineage'], ['v-tg2-tg4'])
        lin = {L['id']: L for L in entry['lineage']}
        self.assertIn('v_test#/testGroups/0/tests/1', lin['v-tg2']['appliesTo'])
        self.assertEqual(lin['v-tg2-tg4']['appliesTo'], ['v_test#/testGroups/1/tests/0'])
        # the new group keeps the declared field-drop, not the template's subset text
        types = [t['type'] for t in lin['v-tg2-tg4']['transformations']]
        self.assertIn('field-drop', types)

    def test_tcid_list_and_dry_run(self):
        copied = self.run_copy(tcids={9}, dry_run=True)
        self.assertEqual([(c['tgId'], c['tcId']) for c in copied], [(4, 9)])
        vector, _ = self.load()
        self.assertEqual(len(vector['testGroups']), 1)  # dry run writes nothing
        self.assertEqual(len(vector['notExecuted']), 3)

    def test_note_appends_an_update_sentence_to_the_subset_policy(self):
        self.run_copy(note='The engines take these hashes now.')
        vector, entry = self.load()
        policy = vector['_provenance']['subset_policy']
        self.assertTrue(policy.startswith('Update 2026-10-22: the 2 upstream case(s) tg2/tc2, tg4/tc9'))
        self.assertTrue(policy.endswith('The engines take these hashes now.'))
        self.assertEqual(entry['sha256'], sha256_bytes((self.vdir / 'v_test.json').read_bytes()))

    def test_new_group_is_a_container_and_embedded_copies_are_declared(self):
        sig = 'ab12cd34ef56' * 4  # 48 hex chars, a fingerprint-grade value
        doc = upstream_doc()
        doc['testGroups'][1]['tests'][0]['message'] = sig
        (self.tmp / 'fixture.json').write_text(json.dumps({'embedded': sig.upper()}))
        manifest = json.loads(self.mpath.read_text())
        manifest['files'][0]['caseContainers'] = [{'pointer': '/testGroups/0/tests', 'kind': 'array'}]
        manifest['files'][0]['copies'] = [{'path': 'fixture.json', 'kind': 'embedded-values',
                                           'cases': [], 'fields': ['message']}]
        self.mpath.write_text(cuc.dumps(manifest))
        cuc.run('v_test', {'no-mech'}, None, FakeCache(doc), dry_run=False, manifest_path=self.mpath,
                vector_root=self.vdir, when='2026-10-22', fmt=None, repo_root=self.tmp)
        _, entry = self.load()
        self.assertIn({'pointer': '/testGroups/1/tests', 'kind': 'array'}, entry['caseContainers'])
        self.assertEqual(entry['copies'][0]['cases'], ['v_test#/testGroups/1/tests/0'])

    def test_refuses_a_case_already_present(self):
        vector, _ = self.load()
        vector['notExecuted'].append({'tgId': 2, 'tcId': 1, 'why': 'no-mech'})
        (self.vdir / 'v_test.json').write_text(cuc.dumps(vector))
        with self.assertRaises(UpstreamError):
            self.run_copy()


if __name__ == '__main__':
    unittest.main()
