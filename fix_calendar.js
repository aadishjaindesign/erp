const fs = require('fs');
const path = './client/src/Modules/Attendance/pages/Attendance.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add customDate state
if (!content.includes('const [customDate, setCustomDate]')) {
  content = content.replace(
    "const [dailySummary, setDailySummary] = useState([]);",
    "const [dailySummary, setDailySummary] = useState([]);\n  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);"
  );
}

// 2. Add handleDateChange handler
if (!content.includes('const handleDateChange =')) {
  content = content.replace(
    "const fetchData = async (silent = false) => {",
    "const handleDateChange = (newDate) => {\n    if (newDate) {\n      setCustomDate(newDate);\n      fetchData(false, newDate);\n    }\n  };\n\n  const fetchData = async (silent = false, dateOverride = customDate) => {"
  );
} else if (!content.includes('dateOverride = customDate')) {
  content = content.replace(
    "const fetchData = async (silent = false) => {",
    "const fetchData = async (silent = false, dateOverride = customDate) => {"
  );
}

// 3. Update getDailySummary call in fetchData
content = content.replace(
  "adminAttendanceApi.getDailySummary(),",
  "adminAttendanceApi.getDailySummary(dateOverride),"
);

// 4. Update the header UI to use DatePicker
content = content.replace(
  /<div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-\[#FAF9F6\] border border-\[#E8E6E1\] py-1.5 px-3 rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">\s*<Calendar size=\{14\} className="text-slate-400" \/>\s*<span>\{formatDate\(new Date\(\)\)\}<\/span>\s*<\/div>/g,
  `<div className="w-44 ml-2">
                <DatePicker 
                  value={customDate} 
                  onChange={handleDateChange} 
                />
              </div>`
);

// 5. Update handleSaveQuickEdit to use customDate
content = content.replace(
  "date: new Date().toISOString(),",
  "date: new Date(customDate).toISOString(),"
);

// 6. Update the "Today's Log" button text to "Edit Log"
content = content.replace(
  "Today's Log",
  "Edit Log"
);
content = content.replace(
  "Today's Log",
  "Edit Log"
);
content = content.replace(
  "Today\\'s attendance updated",
  "Attendance updated"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully applied Custom Calendar fixes.");
