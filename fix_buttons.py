import os

files = [
    "src/components/PKILearning/modules/DigitalAssets/flows/SolanaFlow.tsx",
    "src/components/Playground/hsm/VpnSimulationPanel.tsx"
]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()

    # We can just change <button to <div role="button"
    # Actually wait, Button is imported. We can change to <Button variant="ghost" ...
    # But Button doesn't accept all props like normal div.
    # A div with role="button" and tabIndex={0} is fine.
    
    # In VpnSimulationPanel.tsx:
    if "aria-label=\"Dismiss instructions\"" in content:
        content = content.replace("<button", "<div role=\"button\" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter' || e.key===' ') setShowInstructions(false) }}")
        content = content.replace("</button>", "</div>")
        
    # In SolanaFlow.tsx:
    if "role=\"checkbox\"" in content and "<button" in content:
        # replace <button with <div
        # The toggle has onClick={() => setInvalidateSignature(!invalidateSignature)}
        content = content.replace("<button", "<div tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter' || e.key===' ') setInvalidateSignature(!invalidateSignature) }}")
        content = content.replace("</button>", "</div>")

    with open(filepath, 'w') as f:
        f.write(content)
