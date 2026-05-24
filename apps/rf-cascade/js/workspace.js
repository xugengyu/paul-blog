class Wire {
  constructor(sourceId, sourcePort, targetId, targetPort) {
    this.id = 'wire_' + Date.now() + Math.random().toString(36).substr(2, 9);
    this.sourceId = sourceId;
    this.sourcePort = sourcePort;
    this.targetId = targetId;
    this.targetPort = targetPort;
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.element.setAttribute('class', 'wire-path');
    this.element.dataset.id = this.id;
  }
}

const Workspace = {
  blocks: [],
  wires: [],
  selectedBlocks: new Set(),
  selectedWires: new Set(),
  clipboard: null,
  container: null,
  svgLayer: null,
  gridSize: 20,
  
  dragState: null,
  tempWire: null,
  contextMenuX: 0,
  contextMenuY: 0,
  
  init() {
    this.container = document.getElementById('workspace');
    this.svgLayer = document.getElementById('wires-layer');
    
    this.container.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    
    this.container.addEventListener('drop', e => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/rf-block');
      if (type) {
        const rect = this.container.getBoundingClientRect();
        let x = e.clientX - rect.left - 60;
        let y = e.clientY - rect.top - 40;
        
        x = Math.round(x / this.gridSize) * this.gridSize;
        y = Math.round(y / this.gridSize) * this.gridSize;
        
        this.addBlock(type, x, y);
      }
    });

    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('contextmenu', this.onContextMenu.bind(this));
  },

  selectBlock(block) {
    this.selectedBlocks.add(block);
    if (block.element) {
      block.element.classList.add('rf-block--selected');
    }
  },

  deselectBlock(block) {
    this.selectedBlocks.delete(block);
    if (block.element) {
      block.element.classList.remove('rf-block--selected');
    }
  },

  selectWire(wire) {
    this.selectedWires.add(wire);
    if (wire.element) {
      wire.element.classList.add('wire-path--selected');
    }
  },

  deselectWire(wire) {
    this.selectedWires.delete(wire);
    if (wire.element) {
      wire.element.classList.remove('wire-path--selected');
    }
  },

  clearSelection() {
    this.selectedBlocks.forEach(b => {
      if (b.element) b.element.classList.remove('rf-block--selected');
    });
    this.selectedWires.forEach(w => {
      if (w.element) w.element.classList.remove('wire-path--selected');
    });
    this.selectedBlocks.clear();
    this.selectedWires.clear();
  },

  addBlock(type, x, y, id) {
    const blockId = id || ('blk_' + Date.now() + Math.floor(Math.random()*1000));
    const BlockClass = window.RFBlocks[type];
    if (!BlockClass) return;
    
    const block = new BlockClass(blockId, type, x, y);
    this.blocks.push(block);
    
    const el = block.render();
    this.container.appendChild(el);
    return block;
  },

  removeBlock(id) {
    const blockIndex = this.blocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;
    
    const block = this.blocks[blockIndex];
    if (block.element) block.element.remove();
    this.blocks.splice(blockIndex, 1);
    
    this.wires = this.wires.filter(w => {
      if (w.sourceId === id || w.targetId === id) {
        if (w.element) w.element.remove();
        return false;
      }
      return true;
    });
  },

  removeWire(id) {
    const idx = this.wires.findIndex(w => w.id === id);
    if (idx !== -1) {
      if (this.wires[idx].element) this.wires[idx].element.remove();
      this.wires.splice(idx, 1);
    }
  },

  intersects(r1, r2) {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom || 
             r2.bottom < r1.top);
  },

  getSelectionBounds() {
    let minX = Infinity, minY = Infinity;
    this.selectedBlocks.forEach(b => {
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
    });
    return { left: minX === Infinity ? 0 : minX, top: minY === Infinity ? 0 : minY };
  },

  copy() {
    if (this.selectedBlocks.size === 0) return;
    
    const bounds = this.getSelectionBounds();
    this.clipboard = {
      blocks: Array.from(this.selectedBlocks).map(b => ({
        relId: b.id,
        type: b.type,
        params: JSON.parse(JSON.stringify(b.params)),
        w: b.element ? b.element.offsetWidth : 120,
        h: b.element ? b.element.offsetHeight : 80,
        relX: b.x - bounds.left,
        relY: b.y - bounds.top
      })),
      wires: Array.from(this.selectedWires)
        .filter(w => {
          const srcBlock = this.blocks.find(b => b.id === w.sourceId);
          const tgtBlock = this.blocks.find(b => b.id === w.targetId);
          return srcBlock && tgtBlock && this.selectedBlocks.has(srcBlock) && this.selectedBlocks.has(tgtBlock);
        })
        .map(w => ({
          sourceRelId: w.sourceId,
          sourcePort: w.sourcePort,
          targetRelId: w.targetId,
          targetPort: w.targetPort
        }))
    };
  },

  paste(x, y) {
    if (!this.clipboard || !this.clipboard.blocks.length) return;
    
    const idMap = {};
    this.clearSelection();
    
    this.clipboard.blocks.forEach(cb => {
      let px = x + cb.relX;
      let py = y + cb.relY;
      
      px = Math.round(px / this.gridSize) * this.gridSize;
      py = Math.round(py / this.gridSize) * this.gridSize;
      
      const newBlock = this.addBlock(cb.type, px, py);
      if (newBlock) {
        newBlock.params = JSON.parse(JSON.stringify(cb.params));
        if (newBlock.element) {
          newBlock.element.style.width = cb.w + 'px';
          newBlock.element.style.height = cb.h + 'px';
        }
        newBlock.rebuildPorts();
        newBlock.updateParamDisplay();
        
        idMap[cb.relId] = newBlock.id;
        this.selectBlock(newBlock);
      }
    });
    
    this.clipboard.wires.forEach(cw => {
      const newSourceId = idMap[cw.sourceRelId];
      const newTargetId = idMap[cw.targetRelId];
      if (newSourceId && newTargetId) {
        const wire = new Wire(newSourceId, cw.sourcePort, newTargetId, cw.targetPort);
        this.svgLayer.appendChild(wire.element);
        this.wires.push(wire);
        
        wire.element.addEventListener('dblclick', (ev) => {
          ev.stopPropagation();
          if (confirm('Delete this connection?')) {
            this.removeWire(wire.id);
            if (window.App) window.App.calculateCascade();
          }
        });
        
        this.selectWire(wire);
      }
    });
    
    this.updateWires();
    if (window.App) window.App.calculateCascade();
  },

  deleteSelected() {
    this.selectedWires.forEach(w => {
      this.removeWire(w.id);
    });
    this.selectedBlocks.forEach(b => {
      this.removeBlock(b.id);
    });
    this.clearSelection();
    if (window.App) window.App.calculateCascade();
  },

  exportWorkspace() {
    const data = {
      blocks: this.blocks.map(b => ({
        id: b.id,
        type: b.type,
        x: b.x,
        y: b.y,
        w: b.element ? b.element.offsetWidth : 120,
        h: b.element ? b.element.offsetHeight : 80,
        params: b.params
      })),
      wires: this.wires.map(w => ({
        sourceId: w.sourceId,
        sourcePort: w.sourcePort,
        targetId: w.targetId,
        targetPort: w.targetPort
      }))
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rf-workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importWorkspace(data) {
    if (!data || !Array.isArray(data.blocks)) return;
    
    this.clear();
    
    // 1. Recreate blocks
    data.blocks.forEach(b => {
      const newBlock = this.addBlock(b.type, b.x, b.y, b.id);
      if (newBlock) {
        newBlock.params = JSON.parse(JSON.stringify(b.params));
        if (b.w && newBlock.element) newBlock.element.style.width = b.w + 'px';
        if (b.h && newBlock.element) newBlock.element.style.height = b.h + 'px';
        newBlock.rebuildPorts();
        newBlock.updateParamDisplay();
      }
    });
    
    // 2. Recreate wires
    if (Array.isArray(data.wires)) {
      data.wires.forEach(w => {
        const wire = new Wire(w.sourceId, w.sourcePort, w.targetId, w.targetPort);
        this.svgLayer.appendChild(wire.element);
        this.wires.push(wire);
        
        wire.element.addEventListener('dblclick', (ev) => {
          ev.stopPropagation();
          if (confirm('Delete this connection?')) {
            this.removeWire(wire.id);
            if (window.App) window.App.calculateCascade();
          }
        });
      });
    }
    
    this.updateWires();
    if (window.App) window.App.calculateCascade();
  },

  onMouseDown(e) {
    if (e.button !== 0) return; // only left click
    
    if (e.target.classList.contains('port')) {
      if (e.target.classList.contains('port--out')) {
        const blockId = e.target.dataset.blockId;
        const portId = e.target.dataset.portId;
        
        this.dragState = { type: 'wire', sourceId: blockId, sourcePort: portId };
        
        this.tempWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempWire.setAttribute('class', 'wire-path');
        this.tempWire.style.pointerEvents = 'none';
        this.svgLayer.appendChild(this.tempWire);
      }
      return;
    }

    if (e.target.classList.contains('resize-handle')) {
      const blockEl = e.target.closest('.rf-block');
      if (blockEl) {
        const blockId = blockEl.dataset.id;
        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
          this.dragState = {
            type: 'resize',
            block: block,
            startX: e.clientX,
            startY: e.clientY,
            startW: blockEl.offsetWidth,
            startH: blockEl.offsetHeight
          };
          return;
        }
      }
    }

    if (e.target.classList.contains('wire-path')) {
      const wireId = e.target.dataset.id;
      const wire = this.wires.find(w => w.id === wireId);
      if (wire) {
        if (!e.ctrlKey && !e.shiftKey) {
          this.clearSelection();
        }
        if (this.selectedWires.has(wire)) {
          this.deselectWire(wire);
        } else {
          this.selectWire(wire);
        }
      }
      return;
    }

    const blockEl = e.target.closest('.rf-block');
    if (blockEl) {
      const blockId = blockEl.dataset.id;
      const block = this.blocks.find(b => b.id === blockId);
      if (block) {
        if (!this.selectedBlocks.has(block)) {
          if (!e.ctrlKey && !e.shiftKey) {
            this.clearSelection();
          }
          this.selectBlock(block);
        } else if (e.ctrlKey || e.shiftKey) {
          this.deselectBlock(block);
          return;
        }
        
        const rect = this.container.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        const dragBlocks = [];
        this.selectedBlocks.forEach(sb => {
          dragBlocks.push({ block: sb, startX: sb.x, startY: sb.y });
        });
        
        this.dragState = {
          type: 'block',
          clickX: startX,
          clickY: startY,
          dragBlocks: dragBlocks
        };
      }
    } else {
      if (!e.ctrlKey && !e.shiftKey) {
        this.clearSelection();
      }
      window.App.hideContextMenu();
      
      const rect = this.container.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      
      const selectionBoxEl = document.createElement('div');
      selectionBoxEl.className = 'selection-box';
      selectionBoxEl.style.left = startX + 'px';
      selectionBoxEl.style.top = startY + 'px';
      this.container.appendChild(selectionBoxEl);
      
      this.dragState = {
        type: 'select',
        startX: startX,
        startY: startY,
        element: selectionBoxEl
      };
    }
  },

  onMouseMove(e) {
    if (!this.dragState) return;

    const rect = this.container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (this.dragState.type === 'block') {
      const dx = x - this.dragState.clickX;
      const dy = y - this.dragState.clickY;
      
      this.dragState.dragBlocks.forEach(db => {
        let newX = db.startX + dx;
        let newY = db.startY + dy;
        
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
        
        db.block.x = newX;
        db.block.y = newY;
        db.block.updatePosition();
      });
      this.updateWires();
    } 
    else if (this.dragState.type === 'resize') {
      const block = this.dragState.block;
      let newW = this.dragState.startW + (e.clientX - this.dragState.startX);
      let newH = this.dragState.startH + (e.clientY - this.dragState.startY);
      
      newW = Math.round(newW / this.gridSize) * this.gridSize;
      newH = Math.round(newH / this.gridSize) * this.gridSize;
      
      newW = Math.max(60, newW);
      newH = Math.max(40, newH);
      
      block.element.style.width = newW + 'px';
      block.element.style.height = newH + 'px';
      
      if (block.updatePortsBasedOnParams) {
        block.updatePortsBasedOnParams();
      } else {
        block.inputs.forEach((p, index, arr) => {
          p.offsetY = newH / (arr.length + 1) * (index + 1);
        });
        block.outputs.forEach((p, index, arr) => {
          p.offsetY = newH / (arr.length + 1) * (index + 1);
        });
      }
      
      block.inputs.forEach(p => {
        const portEl = block.element.querySelector(`.port--in[data-port-id="${p.id}"]`);
        if (portEl) portEl.style.top = (p.offsetY - 2) + 'px';
      });
      block.outputs.forEach(p => {
        const portEl = block.element.querySelector(`.port--out[data-port-id="${p.id}"]`);
        if (portEl) portEl.style.top = (p.offsetY - 2) + 'px';
      });
      
      this.updateWires();
    }
    else if (this.dragState.type === 'wire') {
      const srcPos = this.getPortCoords(this.dragState.sourceId, this.dragState.sourcePort, 'out');
      if (srcPos) {
        this.drawBezier(this.tempWire, srcPos.x, srcPos.y, x, y);
      }
    }
    else if (this.dragState.type === 'select') {
      const x1 = this.dragState.startX;
      const y1 = this.dragState.startY;
      const x2 = x;
      const y2 = y;
      
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      
      this.dragState.element.style.left = left + 'px';
      this.dragState.element.style.top = top + 'px';
      this.dragState.element.style.width = width + 'px';
      this.dragState.element.style.height = height + 'px';
      
      const box = { left, top, right: left + width, bottom: top + height };
      
      this.blocks.forEach(b => {
        const bBox = {
          left: b.x,
          top: b.y,
          right: b.x + (b.element ? b.element.offsetWidth : 120),
          bottom: b.y + (b.element ? b.element.offsetHeight : 80)
        };
        if (this.intersects(box, bBox)) {
          this.selectBlock(b);
        } else {
          this.deselectBlock(b);
        }
      });
      
      this.wires.forEach(w => {
        if (w.element) {
          const bbox = w.element.getBBox();
          const wBox = {
            left: bbox.x,
            top: bbox.y,
            right: bbox.x + bbox.width,
            bottom: bbox.y + bbox.height
          };
          if (this.intersects(box, wBox)) {
            this.selectWire(w);
          } else {
            this.deselectWire(w);
          }
        }
      });
    }
  },

  onMouseUp(e) {
    if (!this.dragState) return;

    if (this.dragState.type === 'wire') {
      if (e.target.classList.contains('port') && e.target.classList.contains('port--in')) {
        const targetId = e.target.dataset.blockId;
        const targetPort = e.target.dataset.portId;
        
        if (targetId !== this.dragState.sourceId) {
          const exists = this.wires.find(w => 
            w.sourceId === this.dragState.sourceId && 
            w.sourcePort === this.dragState.sourcePort && 
            w.targetId === targetId && 
            w.targetPort === targetPort
          );
          
          if (!exists) {
            const wire = new Wire(this.dragState.sourceId, this.dragState.sourcePort, targetId, targetPort);
            this.svgLayer.appendChild(wire.element);
            this.wires.push(wire);
            this.updateWires();
            
            wire.element.addEventListener('dblclick', (ev) => {
              ev.stopPropagation();
              if (confirm('Delete this connection?')) {
                this.removeWire(wire.id);
                if (window.App) window.App.calculateCascade();
              }
            });
          }
        }
      }
      
      if (this.tempWire) {
        this.tempWire.remove();
        this.tempWire = null;
      }
    }
    else if (this.dragState.type === 'select') {
      if (this.dragState.element) {
        this.dragState.element.remove();
      }
    }

    this.dragState = null;
  },

  onContextMenu(e) {
    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    this.contextMenuX = e.clientX - rect.left;
    this.contextMenuY = e.clientY - rect.top;
    
    const blockEl = e.target.closest('.rf-block');
    let targetBlock = null;
    if (blockEl) {
      const blockId = blockEl.dataset.id;
      targetBlock = this.blocks.find(b => b.id === blockId);
    }
    
    if (targetBlock) {
      if (!this.selectedBlocks.has(targetBlock)) {
        this.clearSelection();
        this.selectBlock(targetBlock);
      }
    }
    
    window.App.showContextMenu(e.clientX, e.clientY, targetBlock);
  },

  getPortCoords(blockId, portId, type) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block) return null;
    
    const portDef = type === 'out' 
      ? block.outputs.find(p => p.id === portId)
      : block.inputs.find(p => p.id === portId);
      
    if (!portDef) return null;
    
    const w = block.element ? block.element.offsetWidth : 120;
    const x = type === 'out' ? block.x + w : block.x;
    const y = block.y + portDef.offsetY;
    
    return { x, y };
  },

  updateWires() {
    this.wires = this.wires.filter(wire => {
      const srcPos = this.getPortCoords(wire.sourceId, wire.sourcePort, 'out');
      const tgtPos = this.getPortCoords(wire.targetId, wire.targetPort, 'in');
      if (srcPos && tgtPos) {
        this.drawBezier(wire.element, srcPos.x, srcPos.y, tgtPos.x, tgtPos.y);
        return true;
      } else {
        if (wire.element) wire.element.remove();
        return false;
      }
    });
  },

  drawBezier(pathEl, x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1) * 0.5;
    const cp1x = x1 + Math.max(dx, 40);
    const cp1y = y1;
    const cp2x = x2 - Math.max(dx, 40);
    const cp2y = y2;
    
    const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    pathEl.setAttribute('d', d);
  },

  clear() {
    this.blocks.forEach(b => { if (b.element) b.element.remove(); });
    this.wires.forEach(w => { if (w.element) w.element.remove(); });
    this.blocks = [];
    this.wires = [];
    this.clearSelection();
  }
};

window.Workspace = Workspace;
