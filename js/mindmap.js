/* ============================================
   mindmap.js — Interactive knowledge-graph
   D3.js force-directed graph with note overlay
   ============================================
   Notes are loaded from individual JSON files:
     notes/index.json   — manifest (note IDs + links)
     notes/{id}.json    — individual note data

   To add a new note:
     1. Create  notes/my-note.json  with { id, title, category, content }
     2. Add "my-note" to the "notes" array in  notes/index.json
     3. Add link objects to the "links" array to connect it
   ============================================ */

(function () {
  'use strict';

  // ---------- Colour map ----------
  var categoryColor = {
    'Fundamentals':      getComputedStyle(document.documentElement).getPropertyValue('--node-fundamentals').trim() || '#7C9CBF',
    'RF Engineering':    getComputedStyle(document.documentElement).getPropertyValue('--node-rf').trim()           || '#E8A87C',
    'Satellite Comms':   getComputedStyle(document.documentElement).getPropertyValue('--node-satcom').trim()       || '#5CC4B4',
    'Signal Processing': getComputedStyle(document.documentElement).getPropertyValue('--node-sigproc').trim()      || '#C49BBB'
  };

  // ---------- Load notes from JSON files ----------
  async function loadNotes() {
    var res = await fetch('notes/index.json');
    var manifest = await res.json();

    // Fetch each note in parallel
    var notePromises = manifest.notes.map(function (id) {
      return fetch('notes/' + id + '.json').then(function (r) { return r.json(); });
    });

    var nodes = await Promise.all(notePromises);
    var links = manifest.links;

    return { nodes: nodes, links: links };
  }

  // ---------- Boot ----------
  var container = document.getElementById('mindmap-container');
  if (!container) return;

  loadNotes()
    .then(function (data) { initGraph(data.nodes, data.links); })
    .catch(function (err) { console.error('Failed to load notes:', err); });

  // ---------- Build the graph ----------
  function initGraph(nodes, links) {

    // Adjacency lookup
    var adjacency = {};
    nodes.forEach(function (n) { adjacency[n.id] = []; });
    links.forEach(function (l) {
      adjacency[l.source].push(l.target);
      adjacency[l.target].push(l.source);
    });

    // SVG setup
    var width = container.clientWidth;
    var height = container.clientHeight;

    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    var g = svg.append('g');

    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', function (event) {
          g.attr('transform', event.transform);
        })
    );

    // Force simulation
    var simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; }).distance(140))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04));

    // Draw links
    var linkSel = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link');

    // Draw nodes
    var nodeSel = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    var nodeRadius = 22;

    nodeSel.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', function (d) { return categoryColor[d.category] || '#888'; });

    // Labels (wrap long titles)
    nodeSel.append('text')
      .text(function (d) { return d.title; })
      .attr('dy', nodeRadius + 16)
      .each(function (d) {
        var text = d3.select(this);
        var words = d.title.split(/\s+/);
        if (d.title.length > 14 && words.length > 1) {
          text.text('');
          var mid = Math.ceil(words.length / 2);
          text.append('tspan').attr('x', 0).attr('dy', 0).text(words.slice(0, mid).join(' '));
          text.append('tspan').attr('x', 0).attr('dy', '1.15em').text(words.slice(mid).join(' '));
        }
      });

    // Click → open note
    nodeSel.on('click', function (event, d) {
      event.stopPropagation();
      openNote(d);
    });

    // Tick
    simulation.on('tick', function () {
      linkSel
        .attr('x1', function (d) { return d.source.x; })
        .attr('y1', function (d) { return d.source.y; })
        .attr('x2', function (d) { return d.target.x; })
        .attr('y2', function (d) { return d.target.y; });

      nodeSel.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
    });

    // Drag handlers
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x; d.fy = event.y;
    }
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    // ---- Note overlay ----
    var overlay    = document.getElementById('note-overlay');
    var noteTitle  = document.getElementById('note-title');
    var noteBody   = document.getElementById('note-body');
    var noteCat    = document.getElementById('note-category');
    var noteConn   = document.getElementById('note-connected-links');
    var noteClose  = document.getElementById('note-close');
    var searchInput = document.getElementById('note-search');

    function openNote(d) {
      noteTitle.textContent = d.title;
      noteCat.textContent   = d.category;
      noteBody.innerHTML    = d.content;

      noteConn.innerHTML = '';
      (adjacency[d.id] || []).forEach(function (nId) {
        var neighbor = nodes.find(function (n) { return n.id === nId; });
        if (neighbor) {
          var btn = document.createElement('button');
          btn.className = 'note-overlay__connected-link';
          btn.textContent = neighbor.title;
          btn.addEventListener('click', function () { openNote(neighbor); });
          noteConn.appendChild(btn);
        }
      });

      overlay.classList.add('note-overlay--open');
    }

    function closeNote() {
      overlay.classList.remove('note-overlay--open');
    }

    noteClose.addEventListener('click', closeNote);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeNote(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNote(); });

    // ---- Category filter & Search ----
    var hiddenCategories = {};
    var searchQuery = '';

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilter();
      });
    }

    document.querySelectorAll('#mindmap-legend .legend-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.category;
        if (hiddenCategories[cat]) {
          delete hiddenCategories[cat];
          btn.classList.add('legend-item--active');
        } else {
          hiddenCategories[cat] = true;
          btn.classList.remove('legend-item--active');
        }
        applyFilter();
      });
    });

    var legendPanel = document.getElementById('legend-panel');
    var legendToggle = document.getElementById('legend-toggle');
    var legendClose = document.getElementById('legend-close');

    if (legendToggle && legendPanel && legendClose) {
      legendToggle.addEventListener('click', function () {
        legendPanel.classList.add('legend-panel--open');
      });
      legendClose.addEventListener('click', function () {
        legendPanel.classList.remove('legend-panel--open');
      });
    }

    function applyFilter() {
      nodeSel
        .transition().duration(300)
        .style('opacity', function (d) { 
          var matchesSearch = !searchQuery || (d.title && d.title.toLowerCase().includes(searchQuery)) || (d.content && d.content.toLowerCase().includes(searchQuery));
          return (hiddenCategories[d.category] || !matchesSearch) ? 0.08 : 1; 
        })
        .style('pointer-events', function (d) { 
          var matchesSearch = !searchQuery || (d.title && d.title.toLowerCase().includes(searchQuery)) || (d.content && d.content.toLowerCase().includes(searchQuery));
          return (hiddenCategories[d.category] || !matchesSearch) ? 'none' : 'all'; 
        });

      linkSel
        .transition().duration(300)
        .style('opacity', function (d) {
          var srcNode = (typeof d.source === 'object') ? d.source : nodes.find(function (n) { return n.id === d.source; });
          var tgtNode = (typeof d.target === 'object') ? d.target : nodes.find(function (n) { return n.id === d.target; });
          
          var srcMatch = !searchQuery || (srcNode.title && srcNode.title.toLowerCase().includes(searchQuery)) || (srcNode.content && srcNode.content.toLowerCase().includes(searchQuery));
          var tgtMatch = !searchQuery || (tgtNode.title && tgtNode.title.toLowerCase().includes(searchQuery)) || (tgtNode.content && tgtNode.content.toLowerCase().includes(searchQuery));

          var srcHidden = hiddenCategories[srcNode.category] || !srcMatch;
          var tgtHidden = hiddenCategories[tgtNode.category] || !tgtMatch;

          return (srcHidden || tgtHidden) ? 0.05 : 0.8;
        });
    }

    // ---- Resize ----
    window.addEventListener('resize', function () {
      width  = container.clientWidth;
      height = container.clientHeight;
      svg.attr('width', width).attr('height', height);
      simulation.force('center', d3.forceCenter(width / 2, height / 2));
      simulation.force('x', d3.forceX(width / 2).strength(0.04));
      simulation.force('y', d3.forceY(height / 2).strength(0.04));
      simulation.alpha(0.3).restart();
    });
  }
})();
