const XLSX = require('xlsx');
const path = require('path');

// Adjusted path to verify exact location
const filePath = path.resolve('../../koolearn_ma_qa_analysis_2025-03_to_2025-12.xlsx');
console.log('Reading file from:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    console.log('All Sheets:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log('\n--- Sheet:', sheetName, '---');
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log('Total Rows:', data.length);
        if (data.length > 0) {
            console.log('Headers:', Object.keys(data[0]));
            console.log('Sample Row:', JSON.stringify(data[0], null, 2));
        }
    });

} catch (e) {
    console.error('Error reading file:', e);
}
