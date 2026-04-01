import fs from 'fs';

const fileContent = fs.readFileSync('src/components/Playground/tabs/KemOpsTab.tsx', 'utf8');

// The three components we want to extract
const hsmKemStart = fileContent.indexOf('export const HsmKemPanel: React.FC = () => {');
const tabSoftStart = fileContent.indexOf('const KemOpsTabSoftware: React.FC = () => {');
const x25519Start = fileContent.indexOf('const X25519ECDHPanel: React.FC = () => {');

// The top helpers up until HsmKemPanel
const topContent = fileContent.substring(0, hsmKemStart);

// Since X25519 is at the very end:
const x25519Panel = fileContent.substring(x25519Start);

// The KemOpsTabSoftware ends where X25519 starts (approx, minus a comment header)
const x25519HeaderIndex = fileContent.indexOf('// ── P-256 ECDH', tabSoftStart) > -1 ? fileContent.indexOf('// ── P-256 ECDH', tabSoftStart) : x25519Start;
const kemOpsTabSoftwareContent = fileContent.substring(tabSoftStart, x25519HeaderIndex).trim();

// The HsmKemPanel ends where KemOpsTab starts
const tabStart = fileContent.indexOf('export const KemOpsTab: React.FC = () => {');
const hsmKemPanelContent = fileContent.substring(hsmKemStart, tabStart).trim();

// The original file just needs imports, and export const KemOpsTab which returns <KemOpsTabSoftware />
const topContentImportsOnly = fileContent.substring(0, fileContent.indexOf('// ── HSM KEM Panel')).trim();

// Construct new files
const hsmKemFile = topContent + hsmKemPanelContent;
// Add export keywords for Software and X25519
const softFile = topContentImportsOnly + '\\n\\nexport ' + kemOpsTabSoftwareContent;
const x25519File = topContentImportsOnly + '\\n\\nexport ' + x25519Panel;

const newRootFile = topContentImportsOnly + `

import { KemOpsTabSoftware } from './KemOpsTabSoftware'

// ── Software KEM Tab ──────────────────────────────────────────────────────────

export const KemOpsTab: React.FC = () => {
  return <KemOpsTabSoftware />
}
`;

fs.writeFileSync('src/components/Playground/tabs/HsmKemPanel.tsx', hsmKemFile);
fs.writeFileSync('src/components/Playground/tabs/KemOpsTabSoftware.tsx', softFile);
fs.writeFileSync('src/components/Playground/tabs/X25519ECDHPanel.tsx', x25519File);
fs.writeFileSync('src/components/Playground/tabs/KemOpsTab.tsx', newRootFile);
console.log('Successfully sliced KemOpsTab.tsx');
