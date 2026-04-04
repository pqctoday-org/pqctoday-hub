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

const wrapFiles = [
    'KeyWrapPanel.tsx',
    'EnvelopeEncryptionDemo.tsx' // wrapKeyHandle uses wrap
];
// Note: Some files might use AES for HKDF/Derive but by default let's use 'encrypt'.

let changedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const baseName = path.basename(file);
    
    // Most general AES generation needs encryption.
    let modeAES = "'encrypt'";
    if (wrapFiles.includes(baseName) || content.includes('Wrap') || content.includes('kek')) {
        // We will do a generic replacement but I will check edge cases manually if needed.
    }

    // Replace 3 args: M, hSession, bits -> hsm_generateAESKey(M, hSession, bits, false, 'encrypt/wrap')
    content = content.replace(/hsm_generateAESKey\s*\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3) => {
            const m = match.toLowerCase();
            const mode = (m.includes('wrap') || m.includes('kek')) ? "'wrap'" : "'encrypt'";
            return `hsm_generateAESKey(${p1}, ${p2}, ${p3}, false, ${mode})`;
        });

    // Replace 3 args import: M, hSession, bytes -> hsm_importAESKey(M, hSession, bytes, false, 'encrypt')
    content = content.replace(/hsm_importAESKey\s*\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3) => {
            const m = match.toLowerCase();
            const mode = (m.includes('wrap') || m.includes('kek')) ? "'wrap'" : "'encrypt'";
            return `hsm_importAESKey(${p1}, ${p2}, ${p3}, false, ${mode})`;
        });

    // Replace RSA import defaults:
    content = content.replace(/hsm_importRSAPublicKey\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*false\s*\)/g, 
        (match, p1, p2, p3, p4) => `hsm_importRSAPublicKey(${p1}, ${p2}, ${p3}, ${p4}, 'verify')`);
    
    content = content.replace(/hsm_importRSAPublicKey\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*true\s*\)/g, 
        (match, p1, p2, p3, p4) => `hsm_importRSAPublicKey(${p1}, ${p2}, ${p3}, ${p4}, 'encrypt')`);

    // if it was 4 args (missing the boolean)
    content = content.replace(/hsm_importRSAPublicKey\s*\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)/g, 
        (match, p1, p2, p3, p4) => {
            return `hsm_importRSAPublicKey(${p1}, ${p2}, ${p3}, ${p4}, 'encrypt')`;
        });

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedCount++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Total files modified: ${changedCount}`);
