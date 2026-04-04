const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

const deriveFiles = [
    'HsmKeyAgreementPanel.tsx',
    'TEEHSMTrustedChannel.tsx',
    'HybridEncryptionDemo.tsx',
    'katRunner.ts',
    'softhsm.kat.test.ts',
    'secp256k1.kat.test.ts',
    'softhsm.cross-engine.kat.test.ts',
    'Pkcs11Simulator.tsx', // Actually simulator might need both
];

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const baseName = path.basename(file);
    const modeEC = deriveFiles.includes(baseName) ? "'derive'" : "'sign'";
    const modeRSA = deriveFiles.includes(baseName) ? "'decrypt'" : "'sign'";

    // Handle 3 arguments: M, hSession, curve/bits
    content = content.replace(/hsm_generateECKeyPair\s*\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3) => `hsm_generateECKeyPair(${p1}, ${p2}, ${p3}, false, ${modeEC})`);
        
    content = content.replace(/hsm_generateRSAKeyPair\s*\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3) => `hsm_generateRSAKeyPair(${p1}, ${p2}, ${p3}, false, ${modeRSA})`);

    // Handle 4 arguments: M, hSession, curve/bits, extractable
    content = content.replace(/hsm_generateECKeyPair\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3, p4) => `hsm_generateECKeyPair(${p1}, ${p2}, ${p3}, ${p4}, ${modeEC})`);
        
    content = content.replace(/hsm_generateRSAKeyPair\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3, p4) => `hsm_generateRSAKeyPair(${p1}, ${p2}, ${p3}, ${p4}, ${modeRSA})`);

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Total files modified: ${changedCount}`);
