import os

filepath = "src/components/Playground/hsm/SshSimulationPanel.tsx"
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("packets: any[]", "packets: Record<string, unknown>[]")
content = content.replace("classical: any[]; pqc: any[]", "classical: Record<string, unknown>[]; pqc: Record<string, unknown>[]")

with open(filepath, 'w') as f:
    f.write(content)
