const fs = require('fs');
const glob = require('glob'); // Not available by default, let's use a simpler recursive approach or find

const { execSync } = require('child_process');
const files = execSync('find client/src/Modules -name "*.jsx"').toString().split('\n').filter(Boolean);

let totalTables = 0;

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;
  let count = 0;
  
  // Wrap tables
  code = code.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (match) => {
    if (match.includes('Table>')) return match; 
    count++;
    return `<div className="w-full overflow-x-auto">${match}</div>`;
  });
  
  if (count > 0) {
    console.log(`Replaced ${count} tables in ${file}`);
    totalTables += count;
  }
  
  // Fix grids
  code = code.replace(/className="grid grid-cols-2 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 $1"');
  code = code.replace(/className="grid grid-cols-3 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 $1"');
  code = code.replace(/className="grid grid-cols-4 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 $1"');

  if (code !== originalCode) {
    fs.writeFileSync(file, code);
  }
});

console.log(`Total tables wrapped: ${totalTables}`);
