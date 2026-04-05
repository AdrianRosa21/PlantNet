const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/app/(dashboard)/crops/[cropId]/page.tsx');
const replacementFile = path.join(__dirname, 'jsx_replace.txt');

try {
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  
  // Keep up to line 412 (index 411)
  const linesToKeep = lines.slice(0, 412);
  
  const replacementContent = fs.readFileSync(replacementFile, 'utf8');
  
  const newContent = linesToKeep.join('\n') + '\n' + replacementContent;
  
  fs.writeFileSync(targetFile, newContent, 'utf8');
  console.log('Successfully patched page.tsx');
} catch (e) {
  console.error('Error patching file:', e.message);
}
