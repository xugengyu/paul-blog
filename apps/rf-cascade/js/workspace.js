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
  container: null,
  svgLayer: null,
  gridSize: 20,
  
  dragState: null,
  tempWire: null,
  
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

  addBlock(type, x, y) {
    const id = 'blk_' + Date.now() + Math.floor(Math.random()*1000);
    const BlockClass = window.RFBlocks[type];
    if (!BlockClass) return;
    
    const block = new BlockClass(id, type, x, y);
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

  onMouseDown(e) {
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

    if (e.target.classList.contains('wire-path')) return;

    const blockEl = e.target.closest('.rf-block');
    if (blockEl) {
      if (e.button !== 0) return;
      
      const blockId = blockEl.dataset.id;
      const block = this.blocks.find(b => b.id === blockId);
      if (block) {
        document.querySelectorAll('.rf-block--selected').forEach(el => el.classList.remove('rf-block--selected'));
        blockEl.classList.add('rf-block--selected');
        
        const rect = this.container.getBoundingClientRect();
        this.dragState = {
          type: 'block',
          block: block,
          offsetX: e.clientX - rect.left - block.x,
          offsetY: e.clientY - rect.top - block.y
        };
      }
    } else {
      document.querySelectorAll('.rf-block--selected').forEach(el => el.classList.remove('rf-block--selected'));
      window.App.hideContextMenu();
    }
  },

  onMouseMove(e) {
    if (!this.dragState) return;

    const rect = this.container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (this.dragState.type === 'block') {
      const block = this.dragState.block;
      let newX = x - this.dragState.offsetX;
      let newY = y - this.dragState.offsetY;
      
      newX = Math.round(newX / this.gridSize) * this.gridSize;
      newY = Math.round(newY / this.gridSize) * this.gridSize;
      
      block.x = newX;
      block.y = newY;
      block.updatePosition();
      this.updateWires();
    } 
    else if (this.dragState.type === 'resize') {
      const block = this.dragState.block;
      let newW = this.dragState.startW + (e.clientX - this.dragState.startX);
      let newH = this.dragState.startH + (e.clientY - this.dragState.startY);
      
      newW = Math.max(60, newW);
      newH = Math.max(40, newH);
      
      block.element.style.width = newW + 'px';
      block.element.style.height = newH + 'px';
      
      block.inputs.forEach(p => p.offsetY = newH / 2);
      block.outputs.forEach(p => p.offsetY = newH / 2);
      
      this.updateWires();
    }
    else if (this.dragState.type === 'wire') {
      const srcPos = this.getPortCoords(this.dragState.sourceId, this.dragState.sourcePort, 'out');
      if (srcPos) {
        this.drawBezier(this.tempWire, srcPos.x, srcPos.y, x, y);
      }
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
            
            wire.element.addEventListener('click', (ev) => {
              ev.stopPropagation();
              if (confirm('Delete this connection?')) {
                this.removeWire(wire.id);
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

    this.dragState = null;
  },

  onContextMenu(e) {
    e.preventDefault();
    const blockEl = e.target.closest('.rf-block');
    if (blockEl) {
      const blockId = blockEl.dataset.id;
      const block = this.blocks.find(b => b.id === blockId);
      if (block) {
        window.App.showContextMenu(e.clientX, e.clientY, block);
      }
    } else {
      window.App.hideContextMenu();
    }
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
    this.wires.forEach(wire => {
      const srcPos = this.getPortCoords(wire.sourceId, wire.sourcePort, 'out');
      const tgtPos = this.getPortCoords(wire.targetId, wire.targetPort, 'in');
      if (srcPos && tgtPos) {
        this.drawBezier(wire.element, srcPos.x, srcPos.y, tgtPos.x, tgtPos.y);
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
  }
};

window.Workspace = Workspace;
