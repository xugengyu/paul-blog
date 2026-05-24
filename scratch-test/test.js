const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('../posts.html', 'utf8');
const scriptCode = fs.readFileSync('../js/posts.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });

// Override console to see errors
dom.window.console.log = console.log;
dom.window.console.error = console.error;

try {
  dom.window.eval(scriptCode);
  console.log("Script executed without top-level error.");

  // Simulate typing in the search bar
  const searchInput = dom.window.document.getElementById('post-search');
  if (searchInput) {
    searchInput.value = 'sat';
    const event = new dom.window.Event('input');
    searchInput.dispatchEvent(event);
    console.log("Input event dispatched.");

    const hiddenCards = dom.window.document.querySelectorAll('.post-card--hidden');
    console.log("Number of hidden cards:", hiddenCards.length);
  } else {
    console.log("Search input not found!");
  }
} catch (e) {
  console.error("Caught error:", e);
}
