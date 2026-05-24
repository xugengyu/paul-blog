const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('../notes.html', 'utf8');
const scriptCode = fs.readFileSync('../js/mindmap.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });

// Override console to see errors
dom.window.console.log = console.log;
dom.window.console.error = console.error;

// Mock fetch
dom.window.fetch = async (url) => {
  if (url === 'notes/index.json') {
    return { json: async () => ({ notes: ['n1'], links: [] }) };
  }
  if (url.startsWith('notes/')) {
    return { json: async () => ({ id: 'n1', title: 'Test Note', category: 'RF Engineering', content: 'hello world' }) };
  }
  throw new Error("Unknown url " + url);
};

// Mock d3
dom.window.d3 = {
  select: () => ({
    append: () => ({
      attr: () => ({
        append: () => ({
          selectAll: () => ({
            data: () => ({
              join: () => ({
                attr: () => ({
                  call: () => ({
                    append: () => ({
                      attr: () => ({
                        attr: () => ({
                          text: () => ({
                            attr: () => ({
                              each: () => ({})
                            })
                          })
                        })
                      })
                    }),
                    on: () => ({})
                  })
                })
              })
            })
          })
        }),
        call: () => ({})
      })
    })
  }),
  zoom: () => ({ scaleExtent: () => ({ on: () => ({}) }) }),
  forceSimulation: () => ({ force: () => ({ force: () => ({ force: () => ({ force: () => ({ force: () => ({ force: () => ({ on: () => ({}) }) }) }) }) }) }) }),
  forceLink: () => ({ id: () => ({ distance: () => ({}) }) }),
  forceManyBody: () => ({ strength: () => ({}) }),
  forceCenter: () => ({}),
  forceCollide: () => ({ radius: () => ({}) }),
  forceX: () => ({ strength: () => ({}) }),
  forceY: () => ({ strength: () => ({}) }),
  drag: () => ({ on: () => ({ on: () => ({ on: () => ({}) }) }) })
};

try {
  dom.window.eval(scriptCode);
  console.log("Script executed without top-level error.");

  setTimeout(() => {
    // Simulate typing in the search bar
    const searchInput = dom.window.document.getElementById('note-search');
    if (searchInput) {
      searchInput.value = 'hello';
      const event = new dom.window.Event('input');
      searchInput.dispatchEvent(event);
      console.log("Input event dispatched on note-search.");
    } else {
      console.log("Search input not found!");
    }
  }, 1000);
} catch (e) {
  console.error("Caught error:", e);
}
