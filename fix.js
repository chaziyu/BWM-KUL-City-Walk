const fs = require('fs');
let content = fs.readFileSync('src/features/access/access-template.js', 'utf8');
content = content.replace(/\\"/g, '"').replace(/\\n/g, '\n');
fs.writeFileSync('src/features/access/access-template.js', content);
console.log('Done!');
