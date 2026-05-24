const App = {
  contextMenu: null,
  modal: null,
  activeBlock: null,

  init() {
    this.contextMenu = document.getElementById('context-menu');
    this.modal = document.getElementById('param-modal');
    
    window.Workspace.init();
    
    this.setupToolbox();
    this.setupUI();
    
    // Hide context menu on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        this.hideContextMenu();
      }
    });
  },
  
  setupToolbox() {
    const items = document.querySelectorAll('.toolbox-item');
    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/rf-block', item.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  },
  
  setupUI() {
    // Clear button
    document.getElementById('btn-clear').addEventListener('click', () => {
      if(confirm("Are you sure you want to clear the workspace?")) {
        window.Workspace.clear();
      }
    });

    // Close button
    document.getElementById('btn-close').addEventListener('click', () => {
      window.location.href = '../../apps.html';
    });

    document.getElementById('btn-calculate').addEventListener('click', () => {
      this.calculateCascade();
    });
    
    // Context Menu Items
    document.getElementById('menu-edit').addEventListener('click', () => {
      this.hideContextMenu();
      if (this.activeBlock) {
        this.openParamModal(this.activeBlock);
      }
    });
    
    document.getElementById('menu-delete').addEventListener('click', () => {
      this.hideContextMenu();
      if (this.activeBlock) {
        window.Workspace.removeBlock(this.activeBlock.id);
        this.activeBlock = null;
      }
    });

    // Modal buttons
    document.getElementById('modal-cancel').addEventListener('click', () => {
      this.modal.classList.add('hidden');
    });

    document.getElementById('modal-save').addEventListener('click', () => {
      if (this.activeBlock) {
        this.saveParamsFromModal();
      }
      this.modal.classList.add('hidden');
    });
  },

  showContextMenu(x, y, block) {
    this.activeBlock = block;
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.classList.remove('hidden');
  },

  hideContextMenu() {
    this.contextMenu.classList.add('hidden');
  },

  openParamModal(block) {
    document.getElementById('modal-title').textContent = `Edit ${block.type} Parameters`;
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    
    Object.keys(block.params).forEach(key => {
      const group = document.createElement('div');
      group.className = 'form-group';
      
      const label = document.createElement('label');
      label.textContent = key.replace(/_/g, ' ');
      
      const val = block.params[key];
      const isNum = typeof val === 'number';
      
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'param-input-wrapper';
      
      const input = document.createElement('input');
      input.type = isNum ? 'number' : 'text';
      if (isNum) {
        input.step = 'any';
      }
      input.dataset.key = key;
      input.value = val;
      
      inputWrapper.appendChild(input);
      
      if (isNum) {
        const spinButtons = document.createElement('div');
        spinButtons.className = 'param-spin-buttons';
        
        const btnUp = document.createElement('button');
        btnUp.type = 'button';
        btnUp.className = 'spin-btn spin-btn--up';
        btnUp.innerHTML = '▲';
        
        const btnDown = document.createElement('button');
        btnDown.type = 'button';
        btnDown.className = 'spin-btn spin-btn--down';
        btnDown.innerHTML = '▼';
        
        const isInteger = key === 'Number_of_Outputs' || key === 'Number_of_Inputs';
        const stepVal = isInteger ? 1 : 0.5;
        
        btnUp.addEventListener('click', () => {
          let curr = parseFloat(input.value);
          if (isNaN(curr)) curr = 0;
          curr = curr + stepVal;
          input.value = isInteger ? Math.round(curr) : parseFloat(curr.toFixed(2));
        });
        
        btnDown.addEventListener('click', () => {
          let curr = parseFloat(input.value);
          if (isNaN(curr)) curr = 0;
          curr = curr - stepVal;
          if (isInteger) {
            curr = Math.max(1, Math.round(curr));
          }
          input.value = isInteger ? curr : parseFloat(curr.toFixed(2));
        });
        
        spinButtons.appendChild(btnUp);
        spinButtons.appendChild(btnDown);
        inputWrapper.appendChild(spinButtons);
      }
      
      group.appendChild(label);
      group.appendChild(inputWrapper);
      body.appendChild(group);
    });
    
    this.modal.classList.remove('hidden');
  },
  
  saveParamsFromModal() {
    const inputs = document.querySelectorAll('#modal-body input');
    inputs.forEach(input => {
      const key = input.dataset.key;
      if (input.type === 'number') {
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
          this.activeBlock.params[key] = val;
        }
      } else {
        this.activeBlock.params[key] = input.value;
      }
    });
    this.activeBlock.updateParamDisplay();
    if (this.activeBlock.rebuildPorts) {
      this.activeBlock.rebuildPorts();
    }
  },

  calculateCascade() {
    const blocks = window.Workspace.blocks;
    const wires = window.Workspace.wires;
    const display = document.getElementById('results-display');
    
    // Clear previous calculations
    blocks.forEach(b => b.clearCalculations());

    if (blocks.length === 0) {
      display.textContent = 'Workspace is empty.';
      return;
    }

    // Find start blocks (blocks with no incoming wires)
    let startBlocks = blocks.filter(b => !wires.find(w => w.targetId === b.id));

    if (startBlocks.length === 0) {
      display.textContent = 'Error: No starting block found (Signal Source or Antenna with no inputs).';
      return;
    }

    let log = `--- Cascade Analysis ---\n\n`;
    
    let queue = [...startBlocks];
    let processed = new Set();
    
    const inputSignals = {};
    blocks.forEach(b => {
      inputSignals[b.id] = {};
    });

    while (queue.length > 0) {
      // Find a block that is ready (all incoming wires have provided signals)
      let readyIdx = queue.findIndex(b => {
        const incomingWires = wires.filter(w => w.targetId === b.id);
        return incomingWires.every(w => inputSignals[b.id][w.targetPort] !== undefined);
      });
      
      if (readyIdx === -1) {
        log += `\nError: Cycle detected or unresolved dependency in the graph.\n`;
        break;
      }
      
      let block = queue.splice(readyIdx, 1)[0];
      if (processed.has(block.id)) continue;
      
      log += `Block: ${block.type} (${block.id.substring(0, 8)})\n`;
      
      let blockPin = -100;
      let blockTotalF = 1;
      let blockTotalGainLinear = 1;
      
      const incomingWires = wires.filter(w => w.targetId === block.id);
      
      if (incomingWires.length === 0) {
        // Source node
        blockPin = block.params.Power_dBm !== undefined ? block.params.Power_dBm : -100;
        let blockNF = block.params.NF_dB || 0;
        blockTotalF = Math.pow(10, blockNF / 10);
        blockTotalGainLinear = 1;
        log += `  Initial Power: ${blockPin.toFixed(2)} dBm\n`;
      } else if (block.type === 'Combiner') {
        // Combiner sums linear power
        let sumMw = 0;
        incomingWires.forEach(w => {
          let sig = inputSignals[block.id][w.targetPort];
          sumMw += Math.pow(10, sig.power_dBm / 10);
          if (sig.totalF > blockTotalF) blockTotalF = sig.totalF;
          if (sig.totalGainLinear > blockTotalGainLinear) blockTotalGainLinear = sig.totalGainLinear;
        });
        blockPin = 10 * Math.log10(sumMw);
        log += `  Combined Pin: ${blockPin.toFixed(2)} dBm\n`;
      } else {
        // Standard block (1 input)
        let sig = inputSignals[block.id][incomingWires[0].targetPort];
        blockPin = sig.power_dBm;
        blockTotalF = sig.totalF;
        blockTotalGainLinear = sig.totalGainLinear;
        log += `  Pin: ${blockPin.toFixed(2)} dBm\n`;
      }
      
      block.calculatedPIn = incomingWires.length > 0 ? blockPin : undefined;
      
      let power_dBm = blockPin;
      let nextBlockNF = 0;
      let nextBlockGain = 0;
      
      if (block.type === 'Amplifier') {
        power_dBm += block.params.Gain_dB;
        nextBlockGain = block.params.Gain_dB;
        nextBlockNF = block.params.NF_dB;
        log += `  Gain: ${block.params.Gain_dB} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else if (block.type === 'Attenuator' || block.type === 'Filter') {
        power_dBm -= block.params.Loss_dB;
        nextBlockGain = -block.params.Loss_dB;
        nextBlockNF = block.params.Loss_dB;
        log += `  Loss: ${block.params.Loss_dB} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else if (block.type === 'Combiner') {
        power_dBm -= block.params.Loss_dB;
        nextBlockGain = -block.params.Loss_dB;
        nextBlockNF = block.params.Loss_dB;
        log += `  Combiner Loss: ${block.params.Loss_dB} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else if (block.type === 'Splitter') {
        let numOuts = Math.max(2, Math.floor(block.params.Number_of_Outputs));
        let splitLoss = 10 * Math.log10(numOuts);
        power_dBm -= (block.params.Loss_dB + splitLoss);
        nextBlockGain = -(block.params.Loss_dB + splitLoss);
        nextBlockNF = block.params.Loss_dB;
        log += `  Split Loss: ${(block.params.Loss_dB + splitLoss).toFixed(2)} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else if (block.type === 'Load') {
        log += `  Absorbed Power: ${blockPin.toFixed(2)} dBm\n\n`;
        block.calculatedPOut = undefined;
        block.updateParamDisplay();
        processed.add(block.id);
        continue;
      } else if (block.type !== 'SignalSource') {
        nextBlockNF = block.params.NF_dB || 0;
        log += `  (No power effect) -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      }
      
      if (block.type !== 'SignalSource') {
        let f_i = Math.pow(10, nextBlockNF / 10);
        let g_i = Math.pow(10, nextBlockGain / 10);
        blockTotalF = blockTotalF + (f_i - 1) / blockTotalGainLinear;
        blockTotalGainLinear = blockTotalGainLinear * g_i;
      }
      
      block.calculatedPOut = power_dBm;
      block.calculatedNF = 10 * Math.log10(blockTotalF);
      block.updateParamDisplay();
      
      processed.add(block.id);
      
      const outWires = wires.filter(w => w.sourceId === block.id);
      outWires.forEach(w => {
        inputSignals[w.targetId][w.targetPort] = {
          power_dBm: power_dBm,
          totalF: blockTotalF,
          totalGainLinear: blockTotalGainLinear
        };
        if (!processed.has(w.targetId) && !queue.find(b => b.id === w.targetId)) {
          const tgtBlock = blocks.find(b => b.id === w.targetId);
          if (tgtBlock) queue.push(tgtBlock);
        }
      });
      log += '\n';
    }
    
    display.textContent = log;
  }
};

window.App = App;

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
