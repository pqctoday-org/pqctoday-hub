import os
updates = [
    ("FiveG", "5g-security"),
    ("Module1-Introduction", "pqc-101"),
    ("QuantumSafeVPN", "vpn-ssh-pqc"),
    ("Entropy", "entropy-randomness"),
    ("IoTOT", "iot-ot-pqc")
]
base_path = "src/components/PKILearning/modules"
for folder, slug in updates:
    index_file = os.path.join(base_path, folder, "index.tsx")
    if os.path.exists(index_file):
        with open(index_file, "r") as f:
            content = f.read()
        if "slug:" not in content:
            import re
            content = re.sub(r"(const MODULE_ID\s*=\s*'[^']+')", rf"\1 // slug: '{slug}'", content)
            if "slug:" not in content:
                 content = re.sub(r'(const MODULE_ID\s*=\s*"[^"]+")', rf'\1 // slug: "{slug}"', content)
            with open(index_file, "w") as f:
                f.write(content)
print("Done")
