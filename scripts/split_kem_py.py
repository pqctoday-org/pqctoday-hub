import sys

with open('src/components/Playground/tabs/KemOpsTab.tsx', 'r') as f:
    lines = f.readlines()

header = "".join(lines[:40])

hsm_kem = "".join(lines[41:368])
soft_kem = "export " + "".join(lines[374:1088])
x25519_kem = "export " + "".join(lines[1089:1205])

new_root = header + """
import { KemOpsTabSoftware } from './KemOpsTabSoftware'

// ── Software KEM Tab ──────────────────────────────────────────────────────────

export const KemOpsTab: React.FC = () => {
  return <KemOpsTabSoftware />
}
"""

with open('src/components/Playground/tabs/HsmKemPanel.tsx', 'w') as f:
    f.write(header + "\\n" + hsm_kem)

with open('src/components/Playground/tabs/KemOpsTabSoftware.tsx', 'w') as f:
    f.write(header + "\\n" + soft_kem)

with open('src/components/Playground/tabs/X25519ECDHPanel.tsx', 'w') as f:
    f.write(header + "\\n" + x25519_kem)

with open('src/components/Playground/tabs/KemOpsTab.tsx', 'w') as f:
    f.write(new_root)

print("Split completed successfully!")
