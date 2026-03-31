import re

with open('src/components/Playground/hsm/HsmAcvpTesting.tsx', 'r') as f:
    content = f.read()

# Identify the runTests block
# It starts at `const runTests = async () => {`
start_idx = content.find('const runTests = async () => {')

# Find the end of runTests by counting brackets
bracket_count = 0
end_idx = start_idx
started = False

for i in range(start_idx, len(content)):
    if content[i] == '{':
        bracket_count += 1
        started = True
    elif content[i] == '}':
        bracket_count -= 1
        
    if started and bracket_count == 0:
        end_idx = i + 1
        break

run_tests_block = content[start_idx:end_idx]

# We need to rewrite run_tests_block to take dependencies as arguments
# const runTests = async (args) => {
new_signature = """export const executeAcvpTestSuite = async ({
  engines,
  hSessionRef,
  addLog,
  addHsmKey,
  clearHsmKeys,
  clearHsmLog,
  setLoading,
  setResults,
  ts
}: any) => {"""

run_tests_block = run_tests_block.replace('const runTests = async () => {', new_signature)

# The orchestrator needs the wasm imports and the JSON imports, which are at the top of the file
# Let's extract the imports from the top
imports_end = content.find('interface TestResult {')
imports_block = content[:imports_end]

# Filter out React imports and lucide-react imports from Orchestrator
orch_imports = []
for line in imports_block.split('\\n'):
    if 'react' not in line.lower() and 'lucide' not in line.lower() and 'clsx' not in line:
        orch_imports.append(line)

orch_content = "\\n".join(orch_imports) + "\\n\\n" + run_tests_block

# Write the new Orchestrator
with open('src/components/Playground/hsm/AcvpOrchestrator.ts', 'w') as f:
    f.write(orch_content)

# Now remove the runTests block from the original React file and replacing it with the import and wrapper
new_react_content = content[:start_idx] + """
  const runTests = async () => {
    const { executeAcvpTestSuite } = await import('./AcvpOrchestrator');
    // Prebuild engines array
    const engines: Array<any> = []
    if (engineMode === 'cpp') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0, slot: 0, mechs: new Set() })
    } else if (engineMode === 'rust') {
      engines.push({ M: moduleRef.current, name: 'Rust', hSession: 0, slot: 0, mechs: new Set() })
    } else if (engineMode === 'dual') {
      engines.push({ M: moduleRef.current, name: 'C++', hSession: 0, slot: 0, mechs: new Set() })
      if (crossCheckModuleRef.current) {
        engines.push({ M: crossCheckModuleRef.current, name: 'Rust', hSession: 0, slot: 0, mechs: new Set() })
      }
    }
    await executeAcvpTestSuite({
      engines,
      hSessionRef,
      addLog,
      addHsmKey,
      clearHsmKeys,
      clearHsmLog,
      setLoading,
      setResults,
      ts
    })
  }
""" + content[end_idx:]

with open('src/components/Playground/hsm/HsmAcvpTesting.tsx', 'w') as f:
    f.write(new_react_content)

print("Split HsmAcvpTesting successfully!")
