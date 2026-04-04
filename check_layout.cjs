const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) walk(file, results);
    else if (file.endsWith('.tsx')) results.push(file);
  });
  return results;
}

const files = walk('./src/components/PKILearning/modules');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('Pkcs11LogPanel')) {
    const idx = content.indexOf('<Pkcs11LogPanel');
    const targetBlock = content.slice(idx, idx + 800); // look at 800 chars after the tag
    
    // Check if there are things following the block that suggest it's not the end
    // E.g. </TabsContent>, <div className="bg-muted, <div className="mt-6
    
    console.log(`\n\n=== ${path.basename(file)} ===`);
    console.log(targetBlock.split('\n').filter(l => l.trim().startsWith('<') && !l.trim().startsWith('</')).join('\n'));
  }
}
