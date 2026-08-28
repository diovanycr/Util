const fs = require('fs');
const b = fs.readFileSync('js/modules/links.js');

// Find line 2 bytes  
let lineStart = b.indexOf(0x0a) + 1; // after first \n
let lineEnd = b.indexOf(0x0a, lineStart);
const line2Bytes = b.slice(lineStart, lineEnd);
console.log('Line 2 hex:', line2Bytes.toString('hex').match(/../g).join(' '));
console.log('Line 2 text:', line2Bytes.toString('utf8'));

// Replace the specific mojibake sequence for em dash
// Pattern: C3 A2 E2 80 93 (UTF-8 double-encoded em-dash)  
let content = fs.readFileSync('js/modules/links.js');
// Try replacing byte sequences directly
const patterns = [
    { bad: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x93]), good: Buffer.from([0xe2, 0x80, 0x94]) },  // â€" -> —
    { bad: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x94]), good: Buffer.from([0xe2, 0x80, 0x94]) },
    { bad: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x9c]), good: Buffer.from([0xe2, 0x80, 0x94]) },
    { bad: Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0x9d]), good: Buffer.from([0xe2, 0x80, 0x94]) },
];
for (const {bad, good} of patterns) {
    const hexBad = bad.toString('hex');
    const hexContent = content.toString('hex');
    if (hexContent.includes(hexBad)) {
        console.log('Found pattern:', hexBad);
    }
}

// Print first 300 bytes hex for analysis
console.log('\nFirst 350 bytes:');
console.log(b.slice(0, 350).toString('hex').match(/../g).join(' '));
