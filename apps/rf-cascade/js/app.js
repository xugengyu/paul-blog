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
      
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.dataset.key = key;
      input.value = block.params[key];
      
      group.appendChild(label);
      group.appendChild(input);
      body.appendChild(group);
    });
    
    this.modal.classList.remove('hidden');
  },
  
  saveParamsFromModal() {
    const inputs = document.querySelectorAll('#modal-body input');
    inputs.forEach(input => {
      const key = input.dataset.key;
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        this.activeBlock.params[key] = val;
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

    // Find start block (SignalSource or Antenna with NO inputs connected to it)
    let startBlocks = blocks.filter(b => b.type === 'SignalSource' || b.type === 'Antenna');
    startBlocks = startBlocks.filter(b => !wires.find(w => w.targetId === b.id));

    if (startBlocks.length === 0) {
      display.textContent = 'Error: No starting block found (Signal Source or Antenna with no inputs).';
      return;
    }
    if (startBlocks.length > 1) {
      display.textContent = 'Error: Multiple un-driven start blocks found. Please construct a single chain.';
      return;
    }

    let currentBlock = startBlocks[0];
    let power_dBm = currentBlock.params.Power_dBm !== undefined ? currentBlock.params.Power_dBm : -100;
    
    // Initial NF setup
    let blockNF = currentBlock.params.NF_dB || 0;
    let totalF = Math.pow(10, blockNF / 10);
    let totalGainLinear = 1; 

    let log = `--- Cascade Analysis ---\n\n`;
    log += `Start: ${currentBlock.type}\n`;
    
    currentBlock.calculatedPOut = power_dBm;
    currentBlock.calculatedNF = 10 * Math.log10(totalF);
    currentBlock.updateParamDisplay();

    if (currentBlock.type === 'SignalSource') {
      log += `Initial Power: ${power_dBm.toFixed(2)} dBm\n`;
    } else if (currentBlock.type === 'Antenna') {
       log += `Antenna assumed start power: -100 dBm\n`;
    }

    let chainValid = true;

    while (chainValid) {
      const outWires = wires.filter(w => w.sourceId === currentBlock.id);
      
      if (outWires.length === 0) {
        log += `\nEnd of Chain Reached.\nFinal Output Power: ${power_dBm.toFixed(2)} dBm`;
        break; // Done
      }
      
      if (outWires.length > 1) {
        display.textContent = log + `\nError: Branching detected at ${currentBlock.type}. Strictly linear chains only.`;
        return;
      }

      const nextBlockId = outWires[0].targetId;
      const nextBlock = blocks.find(b => b.id === nextBlockId);
      
      log += `  |\n  v\nBlock: ${nextBlock.type}\n`;
      
      nextBlock.calculatedPIn = power_dBm;

      let nextBlockNF = 0;
      let nextBlockGain = 0;

      if (nextBlock.type === 'Amplifier') {
        power_dBm += nextBlock.params.Gain_dB;
        nextBlockGain = nextBlock.params.Gain_dB;
        nextBlockNF = nextBlock.params.NF_dB;
        log += `  + Gain: ${nextBlock.params.Gain_dB} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else if (nextBlock.type === 'Attenuator' || nextBlock.type === 'Filter') {
        power_dBm -= nextBlock.params.Loss_dB;
        nextBlockGain = -nextBlock.params.Loss_dB;
        nextBlockNF = nextBlock.params.Loss_dB;
        log += `  - Loss: ${nextBlock.params.Loss_dB} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      } else {
        nextBlockNF = nextBlock.params.NF_dB || 0;
        log += `  (No power effect) -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
      }
      
      let f_i = Math.pow(10, nextBlockNF / 10);
      let g_i = Math.pow(10, nextBlockGain / 10);
      
      totalF = totalF + (f_i - 1) / totalGainLinear;
      totalGainLinear = totalGainLinear * g_i;

      nextBlock.calculatedPOut = power_dBm;
      nextBlock.calculatedNF = 10 * Math.log10(totalF);
      nextBlock.updateParamDisplay();

      currentBlock = nextBlock;
    }
    
    display.textContent = log;
  }
};

window.App = App;

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
