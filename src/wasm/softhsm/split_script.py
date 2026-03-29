import re
import os
import glob

# Ensure directory
os.makedirs('src/wasm/softhsm', exist_ok=True)

with open('src/wasm/softhsm.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Define boundaries (approximate string matching for exact cut points)
# We will use exactly matched string points or regexes to split the sections.

patterns = [
    ('loaders', r"(// ── Singleton loaders.*?)(?=\n// ── PKCS#11 call log)"),
    ('logging', r"(// ── PKCS#11 call log.*?)(?=\n// ── Inline PKCS#11 constants)"),
    ('constants', r"(// ── Inline PKCS#11 constants.*?)(?=\n// ── Pointer helpers)"),
    ('helpers', r"(// ── Pointer helpers.*?)(?=\n// ── High-level PKCS#11 helpers)"),
    # The "High-level PKCS#11 helpers" block contains hsm_initialize up to line 1732.
    # It contains session management, ML-KEM, ML-DSA, objects, etc.
    ('high_level', r"(// ── High-level PKCS#11 helpers.*?)(?=\n// ── Additional PKCS#11 constants)"),
    ('constants2', r"(// ── Additional PKCS#11 constants.*?)(?=\n// ── Additional WASM memory helpers)"),
    ('helpers2', r"(// ── Additional WASM memory helpers.*?)(?=\n// ── RSA helpers)"),
    ('classical', r"(// ── RSA helpers.*?\n// ── EC / ECDSA / ECDH helpers.*?\n// ── EdDSA helpers.*?)(?=\n// ── PBKDF2 helpers|// ── AES helpers)"),
    ('kdf', r"(// ── PBKDF2 helpers.*?\n// ── HKDF helpers.*?)(?=\n// ── EdDSA helpers|// ── AES helpers)"),
    ('symmetric', r"(// ── AES helpers.*?\n// ── HMAC helpers.*?\n// ── SHA digest helper.*?\n// ── KMAC helpers.*?)(?=\n// ── SLH-DSA helpers|// ── SPKI public key extraction)"),
    ('slhdsa', r"(// ── SLH-DSA helpers.*?)(?=\n// ── Key attribute inspection)"),
    ('inspect', r"(// ── Key attribute inspection.*?)(?=\n// ── Mechanism Discovery)"),
    ('mechanisms', r"(// ── Mechanism Discovery.*?)(?=\n// ── Key Wrap/Unwrap)"),
    ('keywrap', r"(// ── Key Wrap/Unwrap.*?)(?=\n// ── KMAC helpers|\Z)"),
    ('spki', r"(// ── SPKI public key extraction.*?)(?=\n// ──|\Z)"),
]

# Quick and dirty: we will actually just parse line-by-line using the commented region headers.
lines = text.split('\n')
blocks = []
current_header = 'header'
current_lines = []

def get_block_name(line):
    if '// ── Singleton loaders' in line: return 'loaders'
    if '// ── PKCS#11 call log' in line: return 'logging'
    if '// ── Inline PKCS#11 constants' in line: return 'constants'
    if '// ── Pointer helpers' in line: return 'helpers'
    # For the high-level block, it has subsections that aren't '──' but are just comments, or are they exported functions?
    # We will just split everything accurately by exports.
    if '// ── Additional PKCS#11 constants' in line: return 'constants'
    if '// ── Internal crypto constants' in line: return 'constants'
    if '// ── Additional WASM memory helpers' in line: return 'helpers'
    if '// ── RSA helpers' in line: return 'classical'
    if '// ── EC / ECDSA / ECDH helpers' in line: return 'classical'
    if '// ── PBKDF2 helpers' in line: return 'kdf'
    if '// ── HKDF helpers' in line: return 'kdf'
    if '// ── EdDSA helpers' in line: return 'classical'
    if '// ── AES helpers' in line: return 'symmetric'
    if '// ── HMAC helpers' in line: return 'symmetric'
    if '// ── SHA digest helper' in line: return 'symmetric'
    if '// ── SLH-DSA helpers' in line: return 'pqc'
    if '// ── Key attribute inspection' in line: return 'objects'
    if '// ── Mechanism Discovery' in line: return 'session'
    if '// ── Key Wrap/Unwrap' in line: return 'keywrap'
    if '// ── KMAC helpers' in line: return 'symmetric'
    if '// ── SPKI public key extraction' in line: return 'objects'
    
    # We also need to split the giant "High-level PKCS#11 helpers" which starts at 720.
    if 'export const hsm_initialize' in line: return 'session'
    if 'export const hsm_createObject' in line: return 'objects'
    if 'export const hsm_generateMLKEMKeyPair' in line: return 'pqc'
    if 'export const hsm_signMLDSA' in line: return 'pqc'
    
    return None

import copy
modules = {
    'header': [],
    'loaders': [],
    'logging': [],
    'constants': [],
    'helpers': [],
    'session': [],
    'objects': [],
    'pqc': [],
    'classical': [],
    'kdf': [],
    'symmetric': [],
    'keywrap': [],
}

current_mod = 'header'

for line in lines:
    mod_name = get_block_name(line)
    if mod_name:
        current_mod = mod_name
    
    # Special sub-splits inside the monolith "High-level helpers"
    if current_mod == 'session':
        if line.startswith('export const hsm_createObject'): current_mod = 'objects'
        elif line.startswith('export const hsm_generateMLKEM'): current_mod = 'pqc'
        elif line.startswith('export const hsm_generateMLDSA'): current_mod = 'pqc'
        elif line.startswith('export const hsm_signMLDSA'): current_mod = 'pqc'
        elif line.startswith('export const hsm_verifyMLDSA'): current_mod = 'pqc'
        elif line.startswith('export const hsm_encapsulateMLKEM'): current_mod = 'pqc'
        elif line.startswith('export const hsm_decapsulateMLKEM'): current_mod = 'pqc'
    elif current_mod == 'objects':
        if line.startswith('export const hsm_generateMLKEM'): current_mod = 'pqc'

    modules[current_mod].append(line)

# Now extract exports to build the dependency graph for imports.
exports = {}
for mod, mod_lines in modules.items():
    mod_txt = "\n".join(mod_lines)
    # Find `export const X`, `export type X`, `export interface X`
    # Also grab standalone names.
    found_exports = re.findall(r'export\s+(?:const|let|var|function|type|interface)\s+([a-zA-Z0-9_]+)', mod_txt)
    for name in found_exports:
        exports[name] = mod

# SoftHSMModule type isn't parsed correctly if it's `export type { SoftHSMModule }`
exports['SoftHSMModule'] = 'header'
exports['Pkcs11LogInspect'] = 'header'

# Now we construct the file contents!
for mod, mod_lines in modules.items():
    if mod == 'header': continue
    
    # Find all used words in this module.
    mod_txt = "\n".join(mod_lines)
    used_words = set(re.findall(r'[a-zA-Z0-9_]+', mod_txt))
    
    # Needs import
    imports_by_source = {}
    for word in used_words:
        if word in exports and exports[word] != mod:
            source = exports[word]
            if source == 'header':
                source_path = "'@pqctoday/softhsm-wasm'" if word == 'SoftHSMModule' else "'../pkcs11Inspect'"
                imports_by_source.setdefault(source_path, set()).add(word)
            else:
                imports_by_source.setdefault(f"'./{source}'", set()).add(word)
    
    # Create the imports string
    imports_str = ""
    for source, names in imports_by_source.items():
        if source == "'@pqctoday/softhsm-wasm'":
            imports_str += f"import type {{ SoftHSMModule }} from '@pqctoday/softhsm-wasm'\n"
        elif source == "'../pkcs11Inspect'":
            imports_str += f"import type {{ {', '.join(sorted(names))} }} from '../pkcs11Inspect'\n"
        else:
            # We assume regular imports for things from sibling modules.
            imports_str += f"import {{ {', '.join(sorted(names))} }} from {source}\n"
    
    with open(f"src/wasm/softhsm/{mod}.ts", "w", encoding="utf-8") as f:
        # Standardize the file with standard TS pragmas or nothing.
        # Ensure we don't have multiple imports of SoftHSMModule.
        f.write(imports_str + "\n" + mod_txt)

# Finally, write the main softhsm.ts barrel file.
barrel = '''/**
 * SoftHSM WASM service — Phase 6 integration (Modularized)
 */

export type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
export type {
  Pkcs11LogInspect,
  InspectSection,
  DecodedMechanism,
  DecodedAttribute,
  DecodedValue,
} from './pkcs11Inspect'

export * from './softhsm/loaders'
export * from './softhsm/logging'
export * from './softhsm/constants'
export * from './softhsm/helpers'
export * from './softhsm/session'
export * from './softhsm/objects'
export * from './softhsm/pqc'
export * from './softhsm/classical'
export * from './softhsm/symmetric'
export * from './softhsm/keywrap'
export * from './softhsm/kdf'
'''

with open("src/wasm/softhsm.ts", "w", encoding="utf-8") as f:
    f.write(barrel)

print("Split completed successfully!")
