const fs = require('fs');
const path = require('path');

const csvDir = path.join(__dirname, '../src/data');
const errorsPath = path.join(__dirname, '../pure_errors.json');
const errorsData = JSON.parse(fs.readFileSync(errorsPath, 'utf8'));

// Find errors
const n22 = errorsData.checkResults.find(r => r.id === 'N22-library');
const badFiles = new Set(n22.findings.map(f => f.value));

const libraryCsvPath = path.join(csvDir, 'library_03272026.csv');
let libraryCsv = fs.readFileSync(libraryCsvPath, 'utf8');
const lines = libraryCsv.split('\n');

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const parts = parseCSVLine(lines[i]);
  const localFile = parts[20];
  // check if local_file exactly matches one of the bad files
  if (localFile && badFiles.has(localFile.replace('public/library/', ''))) {
    // blank out the local file
    parts[20] = '';
    // set downloadable to 'no-corrupt'
    parts[19] = 'no-corrupt';
    
    // delete the corrupt file
    if (fs.existsSync(path.join(__dirname, '../', localFile))) {
      fs.unlinkSync(path.join(__dirname, '../', localFile));
    }
  }
  lines[i] = serializeCSVLine(parts);
}
fs.writeFileSync(libraryCsvPath, lines.join('\n'));

// Now fix auth sources flags
const authCsvPath = path.join(csvDir, 'pqc_authoritative_sources_reference_02282026.csv');
let authCsv = fs.readFileSync(authCsvPath, 'utf8');
const authLines = authCsv.split('\n');
const n2 = errorsData.checkResults.find(r => r.id === 'N2-auth-sources-flags');

for (const finding of n2.findings) {
  const sourceName = finding.value;
  const colName = finding.field; // e.g. Leaders_CSV
  
  // Find which column index the field corresponds or just parse header
  const headerParts = parseCSVLine(authLines[0]);
  const colIdx = headerParts.indexOf(colName);
  
  // Find row
  for (let i = 1; i < authLines.length; i++) {
    if (!authLines[i].trim()) continue;
    const parts = parseCSVLine(authLines[i]);
    if (parts[0] === sourceName && parts[colIdx] === 'Yes') {
      parts[colIdx] = 'No';
      authLines[i] = serializeCSVLine(parts);
    }
  }
}
fs.writeFileSync(authCsvPath, authLines.join('\n'));

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function serializeCSVLine(parts) {
  return parts.map(p => {
    if (p.includes(',') || p.includes('"') || p.includes('\n')) {
      return '"' + p.replace(/"/g, '""') + '"';
    }
    return p;
  }).join(',');
}
