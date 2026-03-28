const fs = require('fs');

const moduleDataRaw = fs.readFileSync('/Users/ericamador/antigravity/pqc-timeline-app/src/components/PKILearning/moduleData.ts', 'utf8');

const modulesMatch = moduleDataRaw.match(/export const MODULE_CATALOG: Record<string, ModuleItem> = validateCatalog\(\{(.*?)\}\)/s);
const moduleIds = [];

// Extract module IDs
const lines = moduleDataRaw.split('\n');
for (const line of lines) {
    const m = line.match(/^  '?([a-z0-9\-]+)'?: \{/);
    if (m) {
        if (m[1] !== 'quiz' && m[1] !== 'assess') {
            moduleIds.push(m[1]);
        }
    }
}

const csvData = fs.readFileSync('/Users/ericamador/antigravity/pqc-timeline-app/src/data/quantum_safe_cryptographic_software_reference_03272026.csv', 'utf8');
const csvLines = csvData.split('\n').filter(l => l.trim().length > 0);
const headers = csvLines[0].split(',');

const moduleIndex = headers.indexOf('learning_modules');
const categoryIndex = headers.indexOf('category_name');
const softwareIndex = headers.indexOf('software_name');

const mappedModules = new Set();
const categoriesToModules = {};

for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i];
    let row = [];
    let cur = '';
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
        if (line[c] === '"') {
            inQuote = !inQuote;
        } else if (line[c] === ',' && !inQuote) {
            row.push(cur);
            cur = '';
        } else {
            cur += line[c];
        }
    }
    row.push(cur);

    if (row.length <= moduleIndex) continue;

    const mods = row[moduleIndex].split(';');
    const cat = row[categoryIndex];
    if (!categoriesToModules[cat]) categoriesToModules[cat] = new Set();

    mods.forEach(m => {
        if (m.trim()) {
            mappedModules.add(m.trim());
            categoriesToModules[cat].add(m.trim());
        }
    });
}

console.log("=== GAP ANALYSIS: Modules with NO mapped products in Migrate Scope ===");
let hasGaps1 = false;
for (const mid of moduleIds) {
    if (!mappedModules.has(mid)) {
        console.log(`- ${mid}`);
        hasGaps1 = true;
    }
}
if (!hasGaps1) console.log("None! All modules have at least one product.");

console.log("\n=== GAP ANALYSIS: Migrate Categories with NO mapped Learn Modules ===");
let hasGaps2 = false;
for (const [cat, mods] of Object.entries(categoriesToModules)) {
    if (mods.size === 0) {
        console.log(`- Category: ${cat}`);
        hasGaps2 = true;
    }
}
if (!hasGaps2) console.log("None! All product categories map to at least one learning module.");

console.log("\n=== Migrate Category to Module Counts ===");
for (const [cat, mods] of Object.entries(categoriesToModules).sort((a,b) => b[1].size - a[1].size)) {
    console.log(`- ${cat} -> ${mods.size} distinct modules`);
}
