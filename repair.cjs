const fs = require('fs');
const path = require('path');

const CURRENCIES_CODE = `const CURRENCIES = [
  { code: 'FCFA', name: 'FCFA (XOF) - Franc CFA', rate: 1, symbol: 'XOF' },
  { code: 'EUR', name: 'Euro (EUR) - €', rate: 655.957, symbol: '€' },
  { code: 'USD', name: 'Dollar US (USD) - $', rate: 600, symbol: '$' },
  { code: 'MAD', name: 'Dirham Marocain (MAD) - DH', rate: 60.3, symbol: 'DH' },
  { code: 'GBP', name: 'Livre Sterling (GBP) - £', rate: 775.2, symbol: '£' },
  { code: 'CAD', name: 'Dollar Canadien (CAD) - C$', rate: 445, symbol: 'C$' },
  { code: 'CHF', name: 'Franc Suisse (CHF) - CHF', rate: 685, symbol: 'CHF' },
  { code: 'AED', name: 'Dirham EAU (AED) - AED', rate: 163.5, symbol: 'AED' },
  { code: 'SAR', name: 'Riyal Saoudien (SAR) - SR', rate: 160, symbol: 'SR' }
];

`;

function repairFile(filePath, exportMarker) {
  console.log(`Repairing file: ${filePath}`);
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File ${filePath} does not exist.`);
    return false;
  }
  
  const content = fs.readFileSync(absolutePath, 'utf8');
  
  // Find where const CURRENCIES starts to cut imports
  const currenciesStartIdx = content.indexOf('const CURRENCIES = [');
  if (currenciesStartIdx === -1) {
    console.error(`Error: 'const CURRENCIES = [' not found in ${filePath}`);
    return false;
  }
  
  const importsSection = content.substring(0, currenciesStartIdx);
  
  // Find the original export component
  const exportIdx = content.indexOf(exportMarker);
  if (exportIdx === -1) {
    console.error(`Error: '${exportMarker}' not found in ${filePath}`);
    return false;
  }
  
  const componentSection = content.substring(exportIdx);
  
  const repairedContent = importsSection + CURRENCIES_CODE + componentSection;
  
  fs.writeFileSync(absolutePath, repairedContent, 'utf8');
  console.log(`Successfully repaired ${filePath}!`);
  return true;
}

const ok1 = repairFile('src/pages/EnterpriseList.tsx', 'export const EnterpriseList = () => {');
const ok2 = repairFile('src/pages/Cotisations.tsx', 'export const Cotisations: React.FC = () => {');

if (ok1 && ok2) {
  console.log('All files repaired successfully.');
} else {
  process.exit(1);
}
