const fs = require('fs');
const file = 'client/src/Modules/Attendance/pages/Attendance.jsx';
let code = fs.readFileSync(file, 'utf8');

// Replace all raw tables with wrapper
let count = 0;
code = code.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (match) => {
  // If already wrapped (just a heuristic), skip
  if (match.includes('Table>')) return match; 
  count++;
  return `<div className="w-full overflow-x-auto">${match}</div>`;
});

console.log(`Replaced ${count} tables in ${file}`);

// Make grids responsive
code = code.replace(/className="grid grid-cols-2 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 $1"');
code = code.replace(/className="grid grid-cols-3 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 $1"');
code = code.replace(/className="grid grid-cols-4 (.*?)"/g, 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 $1"');
code = code.replace(/className="flex justify-between (.*?)"/g, 'className="flex flex-col sm:flex-row sm:justify-between $1"');

fs.writeFileSync(file, code);
