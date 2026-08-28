const fs = require('fs');
let buf = fs.readFileSync('js/modules/links.js');

function replaceBytes(buf, badHex, goodHex) {
    const bad = Buffer.from(badHex, 'hex');
    const good = Buffer.from(goodHex, 'hex');
    let result = [];
    let i = 0;
    while (i < buf.length) {
        if (buf.slice(i, i + bad.length).equals(bad)) {
            result.push(good);
            i += bad.length;
        } else {
            result.push(buf.slice(i, i + 1));
            i++;
        }
    }
    return Buffer.concat(result);
}

// Mojibake sequences to fix:
// c3 a2 e2 82 ac e2 80 9d  ->  e2 80 94  (â€" -> —  em-dash)
// c3 9a  -> c3 9a is actually "Ú" which is correct for "Úteis"... wait no
// Let's check: Ú in utf8 is c3 9a. That IS correct utf8 for Ú.
// But the word should be "Úteis" -> Ú is U+00DA which is c3 9a - that IS correct.
// So line 2 should read: " * links.js — Aba de Links Úteis" - Ú is correct!

const replacements = [
    // â€" (mojibake em-dash) -> — (real em-dash U+2014)
    ['c3a2e282ace2809d', 'e2809c'],   // let's try all combos
    ['c3a2e282ace28094', 'e28094'],
    ['c3a2e282ace28093', 'e28094'],
];

// The actual bad sequence from hex: c3 a2 e2 82 ac e2 80 9d
// This is: Ã (c3a2) + € (e282ac) + " (e2809d) 
// Should be: — (e28094) 
buf = replaceBytes(buf, 'c3a2e282ace2809d', 'e28094');

// Also c3 a1 in line 3 - "clicáveis" -> á = c3 a1 which IS correct UTF-8
// So actually line 3 clicáveis is already correct!

// Let's also fix the BOM-less issue: file has BOM ef bb bf at start, keep it
fs.writeFileSync('js/modules/links.js', buf);

// Verify
const text = fs.readFileSync('js/modules/links.js', 'utf8');
const line2 = text.split('\n')[1];
console.log('Line 2 after fix:', line2);
const badChars = (text.match(/\u00e2\u20ac/g) || []).length;
console.log('Remaining bad sequences:', badChars);
