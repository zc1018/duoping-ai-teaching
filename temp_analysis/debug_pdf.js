const fs = require('fs');
const pdfParse = require('pdf-parse');

console.log('Type of pdfParse:', typeof pdfParse);
console.log('Keys of pdfParse:', Object.keys(pdfParse));
if (typeof pdfParse === 'object') {
    console.log('Prototype:', Object.getPrototypeOf(pdfParse));
}
