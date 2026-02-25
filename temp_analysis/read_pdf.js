const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

// Fix for potential import issues
const pdf = pdfParse.default || pdfParse;

const filePath = path.resolve('../../通用AI带教引擎：架构设计与落地方案.pdf');

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const dataBuffer = fs.readFileSync(filePath);

console.log('Reading PDF...');

if (typeof pdf !== 'function') {
    console.error('pdf-parse module is not a function. Type:', typeof pdf);
    // Attempt to find the function in the object
    if (typeof pdfParse === 'function') {
        pdfParse(dataBuffer).then(processData).catch(handleError);
    } else {
        console.error('Cannot find pdf function');
    }
} else {
    pdf(dataBuffer).then(processData).catch(handleError);
}

function processData(data) {
    console.log('Number of pages:', data.numpages);
    console.log('\n--- Content Preview (Start) ---');
    console.log(data.text.substring(0, 1500));

    console.log('\n--- Content Preview (Middle) ---');
    const mid = Math.floor(data.text.length / 2);
    console.log(data.text.substring(mid, mid + 1500));

    console.log('\n--- Content Preview (End) ---');
    console.log(data.text.substring(data.text.length - 1500));
}

function handleError(error) {
    console.error('Error reading PDF:', error);
}
