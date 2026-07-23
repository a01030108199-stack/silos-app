const fs = require('fs');
const content = fs.readFileSync('pages/reconciliation.html', 'utf8');
const scriptMatch = content.match(/<script>\s*([\s\S]*?)<\/script>/g);
if(scriptMatch) {
  const code = scriptMatch[scriptMatch.length-1].replace(/<\/?script>/g, '');
  try {
    new Function(code);
    console.log("SYNTAX OK");
  } catch (e) {
    console.error("SYNTAX ERROR:", e);
  }
} else {
  console.log("No script found");
}
