import sys
import re

file_path = 'src/components/Playground/hsm/HsmSymmetricPanel.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Instead of exact hardcoded line numbers which can be off by 1, we find the boundaries dynamically
def find_line(pattern):
    for i, line in enumerate(lines):
        if re.search(pattern, line):
            return i
    return -1

aes_panel = find_line(r'^const AesPanel =')
hmac_panel = find_line(r'^const HmacPanel =')
ctr_panel = find_line(r'^const AesCtrPanel =')
cmac_panel = find_line(r'^const AesCmacPanel =')
rng_panel = find_line(r'^const RngPanel =')
root_panel = find_line(r'^export const HsmSymmetricPanel =')

header = "".join(lines[:aes_panel-1]) # imports and helpers

def write_comp(filename, name, start, end):
    content = "export " + "".join(lines[start:end])
    with open('src/components/Playground/hsm/' + filename, 'w') as f:
        f.write(header + "\\n" + content)

write_comp('AesPanel.tsx', 'AesPanel', aes_panel, hmac_panel-1)
write_comp('HmacPanel.tsx', 'HmacPanel', hmac_panel, ctr_panel-1)
write_comp('AesCtrPanel.tsx', 'AesCtrPanel', ctr_panel, cmac_panel-1)
write_comp('AesCmacPanel.tsx', 'AesCmacPanel', cmac_panel, rng_panel-1)
write_comp('RngPanel.tsx', 'RngPanel', rng_panel, root_panel-1)

# Now rewrite the root
new_imports = """
import { AesPanel } from './AesPanel'
import { HmacPanel } from './HmacPanel'
import { AesCtrPanel } from './AesCtrPanel'
import { AesCmacPanel } from './AesCmacPanel'
import { RngPanel } from './RngPanel'
"""

new_root = header + new_imports + "\\n" + "".join(lines[root_panel:])

with open(file_path, 'w') as f:
    f.write(new_root)

print("Split completed successfully!")
