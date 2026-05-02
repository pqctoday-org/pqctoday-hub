import os

filepath = "src/components/PKILearning/modules/DigitalAssets/flows/SolanaFlow.tsx"
with open(filepath, 'r') as f:
    content = f.read()

# Replace <label ... onClick={...}> with <div ...>
content = content.replace("""              <label
                className="text-sm font-medium text-foreground cursor-pointer select-none"
                onClick={() => setSimulateError((v) => !v)}
              >
                Simulate Invalid Signature
              </label>""", """              <div
                className="text-sm font-medium text-foreground cursor-pointer select-none"
                onClick={() => setSimulateError((v) => !v)}
                onKeyDown={(e) => { if(e.key==='Enter' || e.key===' ') setSimulateError((v) => !v) }}
                role="button"
                tabIndex={0}
              >
                Simulate Invalid Signature
              </div>""")

content = content.replace("""<p className="text-xs text-muted-foreground mt-0.5" onClick={() => setSimulateError((v) => !v)}>""", """<p className="text-xs text-muted-foreground mt-0.5">""")

with open(filepath, 'w') as f:
    f.write(content)
