const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('pages/monthly_movement_report.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });
