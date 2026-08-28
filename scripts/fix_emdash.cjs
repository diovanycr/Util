const fs = require('fs');
let c = fs.readFileSync('js/modules/links.js', 'utf8');

// Fix the em-dash mojibake sequence: â€" -> —
// The exact bytes in the file after the previous fix are: â followed by € and "
// We match them literally as they appear in utf8 string
const before = c.includes('\u00e2\u20ac\u201c') ? 'yes (â€")' : 'no';
c = c.split('\u00e2\u20ac\u201c').join('\u2014');
fs.writeFileSync('js/modules/links.js', c, 'utf8');

// Also check for any â€" variants
const remaining = (c.match(/\u00e2/g) || []).length;
console.log('â€" present before fix: ' + before);
console.log('Remaining \\u00e2 count after fix: ' + remaining);
console.log('Line 2:', c.split('\n')[1]);
