const fs = require('fs');
const content = fs.readFileSync('pages/reconciliation.html', 'utf8');
const scriptMatch = content.match(/<script>\s*([\s\S]*?)<\/script>/g);
const code = scriptMatch[scriptMatch.length-1].replace(/<\/?script>/g, '');
try {
  new Function(code);
  console.log('Syntax OK');
} catch(e) {
  console.error('SyntaxError found:', e);
}
