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

    // Keyboard shortcuts (Copy/Paste/Delete)
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          window.Workspace.copy();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          window.Workspace.paste(window.Workspace.lastMouseX, window.Workspace.lastMouseY);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        window.Workspace.deleteSelected();
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
    // Save Workspace button
    document.getElementById('btn-save-ws').addEventListener('click', () => {
      window.Workspace.exportWorkspace();
    });

    // Load Workspace button
    const fileInput = document.getElementById('input-load-ws');
    document.getElementById('btn-load-ws').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          window.Workspace.importWorkspace(data);
        } catch (err) {
          alert('Failed to parse workspace file: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

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

    // Display Options Checkboxes
    const chkBlock = document.getElementById('chk-show-block-params');
    const chkCasc = document.getElementById('chk-show-cascaded-params');
    const chkFreq = document.getElementById('chk-show-frequency');
    const chkLogs = document.getElementById('chk-show-logs');

    const updateOptions = () => {
      window.Workspace.displayOptions = {
        showBlockParams: chkBlock ? chkBlock.checked : true,
        showCascadedParams: chkCasc ? chkCasc.checked : true,
        showFrequency: chkFreq ? chkFreq.checked : true,
        showLogs: chkLogs ? chkLogs.checked : true
      };
      
      const resultsSec = document.getElementById('results-section');
      if (resultsSec) {
        resultsSec.style.display = window.Workspace.displayOptions.showLogs ? 'block' : 'none';
      }
      
      window.Workspace.blocks.forEach(b => b.updateParamDisplay());
    };

    if (chkBlock) chkBlock.addEventListener('change', updateOptions);
    if (chkCasc) chkCasc.addEventListener('change', updateOptions);
    if (chkFreq) chkFreq.addEventListener('change', updateOptions);
    if (chkLogs) chkLogs.addEventListener('change', updateOptions);
    
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
        this.calculateCascade();
      }
    });

    document.getElementById('menu-copy').addEventListener('click', () => {
      this.hideContextMenu();
      window.Workspace.copy();
    });

    document.getElementById('menu-paste').addEventListener('click', () => {
      this.hideContextMenu();
      window.Workspace.paste(window.Workspace.contextMenuX, window.Workspace.contextMenuY);
    });

    document.getElementById('menu-delete-sel').addEventListener('click', () => {
      this.hideContextMenu();
      window.Workspace.deleteSelected();
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
      this.calculateCascade();
    });
  },

  showContextMenu(x, y, block) {
    this.activeBlock = block;
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.classList.remove('hidden');

    const selBlocksCount = window.Workspace.selectedBlocks.size;
    const selWiresCount = window.Workspace.selectedWires.size;
    const hasSelection = selBlocksCount > 0 || selWiresCount > 0;
    const hasCopied = window.Workspace.clipboard && window.Workspace.clipboard.blocks.length > 0;

    const menuEdit = document.getElementById('menu-edit');
    const menuDelete = document.getElementById('menu-delete');
    const menuCopy = document.getElementById('menu-copy');
    const menuPaste = document.getElementById('menu-paste');
    const menuDeleteSel = document.getElementById('menu-delete-sel');

    if (block && selBlocksCount <= 1 && selWiresCount === 0) {
      menuEdit.style.display = 'block';
      menuDelete.style.display = 'block';
    } else {
      menuEdit.style.display = 'none';
      menuDelete.style.display = 'none';
    }

    if (selBlocksCount > 0) {
      menuCopy.style.display = 'block';
    } else {
      menuCopy.style.display = 'none';
    }

    if (hasCopied) {
      menuPaste.style.display = 'block';
    } else {
      menuPaste.style.display = 'none';
    }

    if (hasSelection) {
      menuDeleteSel.style.display = 'block';
    } else {
      menuDeleteSel.style.display = 'none';
    }
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
      let blockTotalOip3Linear = Infinity;
      let blockFrequencies = [];
      
      const incomingWires = wires.filter(w => w.targetId === block.id);
      
      if (incomingWires.length === 0) {
        // Source node
        blockPin = block.params.Power_dBm !== undefined ? block.params.Power_dBm : -100;
        let blockNF = block.params.NF_dB || 0;
        blockTotalF = Math.pow(10, blockNF / 10);
        blockTotalGainLinear = 1;
        blockTotalOip3Linear = Infinity;
        
        let startFreq = block.params.Frequency_MHz !== undefined ? block.params.Frequency_MHz : 2400;
        blockFrequencies = [startFreq];
        
        log += `  Initial Power: ${blockPin.toFixed(2)} dBm\n`;
      } else if (block.type === 'Combiner') {
        // Combiner sums linear power and combines frequencies
        let sumMw = 0;
        let sumInvOip3 = 0;
        let combinedFreqs = [];
        incomingWires.forEach(w => {
          let sig = inputSignals[block.id][w.targetPort];
          if (sig) {
            sumMw += Math.pow(10, sig.power_dBm / 10);
            if (sig.totalF > blockTotalF) blockTotalF = sig.totalF;
            if (sig.totalGainLinear > blockTotalGainLinear) blockTotalGainLinear = sig.totalGainLinear;
            sumInvOip3 += 1 / (sig.totalOip3Linear || Infinity);
            if (sig.frequencies) {
              combinedFreqs.push(...sig.frequencies);
            }
          }
        });
        blockPin = 10 * Math.log10(sumMw);
        blockTotalOip3Linear = sumInvOip3 > 0 ? 1 / sumInvOip3 : Infinity;
        blockFrequencies = [...new Set(combinedFreqs)].sort((a, b) => a - b);
        log += `  Combined Pin: ${blockPin.toFixed(2)} dBm\n`;
      } else if (block.type === 'Mixer') {
        // Mixer takes RF from 'rf' input port, LO from 'lo' input port
        const sigRF = inputSignals[block.id]['rf'];
        const sigLO = inputSignals[block.id]['lo'];
        
        if (sigRF) {
          blockPin = sigRF.power_dBm;
          blockTotalF = sigRF.totalF;
          blockTotalGainLinear = sigRF.totalGainLinear;
          blockTotalOip3Linear = sigRF.totalOip3Linear || Infinity;
          blockFrequencies = sigRF.frequencies || [];
        } else {
          blockPin = -100;
          blockTotalF = 1;
          blockTotalGainLinear = 1;
          blockTotalOip3Linear = Infinity;
          blockFrequencies = [];
        }
        
        let loFreq = 0;
        if (sigLO && sigLO.frequencies && sigLO.frequencies.length > 0) {
          loFreq = sigLO.frequencies[0];
        }
        log += `  RF Pin: ${blockPin.toFixed(2)} dBm\n`;
        log += `  LO Freq: ${loFreq} MHz\n`;
        block.currentLOFreq = loFreq;
      } else {
        // Standard block (1 input)
        let sig = inputSignals[block.id][incomingWires[0].targetPort];
        if (sig) {
          blockPin = sig.power_dBm;
          blockTotalF = sig.totalF;
          blockTotalGainLinear = sig.totalGainLinear;
          blockTotalOip3Linear = sig.totalOip3Linear !== undefined ? sig.totalOip3Linear : Infinity;
          blockFrequencies = sig.frequencies || [];
        }
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
      } else if (block.type === 'Mixer') {
        let convGain = block.params.Conversion_Gain_dB !== undefined ? block.params.Conversion_Gain_dB : -6.0;
        power_dBm += convGain;
        nextBlockGain = convGain;
        nextBlockNF = block.params.NF_dB !== undefined ? block.params.NF_dB : 6.0;
        log += `  Conv. Gain: ${convGain.toFixed(2)} dB -> Pout: ${power_dBm.toFixed(2)} dBm\n`;
        
        // Frequency translation
        let loFreq = block.currentLOFreq || 0;
        let mixedFreqs = [];
        blockFrequencies.forEach(f => {
          mixedFreqs.push(f + loFreq);
          let diff = Math.abs(f - loFreq);
          if (diff > 0) {
            mixedFreqs.push(diff);
          }
        });
        blockFrequencies = [...new Set(mixedFreqs)].sort((a, b) => a - b);
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
        
        let nextBlockOIP3_dBm = 100;
        if (block.params.OIP3_dBm !== undefined) {
          nextBlockOIP3_dBm = block.params.OIP3_dBm;
        } else if (block.type === 'Amplifier') {
          nextBlockOIP3_dBm = 30;
        } else if (block.type === 'Mixer') {
          nextBlockOIP3_dBm = 15;
        }
        let oip3_i = Math.pow(10, nextBlockOIP3_dBm / 10);
        blockTotalOip3Linear = 1 / ( (1 / oip3_i) + (1 / (g_i * blockTotalOip3Linear)) );
      }
      
      block.calculatedPOut = power_dBm;
      block.calculatedNF = 10 * Math.log10(blockTotalF);
      
      block.calculatedOIP3 = blockTotalOip3Linear !== Infinity ? 10 * Math.log10(blockTotalOip3Linear) : Infinity;
      block.calculatedIIP3 = block.calculatedOIP3 !== Infinity ? block.calculatedOIP3 - (10 * Math.log10(blockTotalGainLinear)) : Infinity;
      block.calculatedFrequencies = blockFrequencies;
      
      let oip3LogVal = block.calculatedOIP3 !== Infinity ? block.calculatedOIP3.toFixed(2) + ' dBm' : 'inf';
      let iip3LogVal = block.calculatedIIP3 !== Infinity ? block.calculatedIIP3.toFixed(2) + ' dBm' : 'inf';
      let freqLogVal = blockFrequencies.length > 0 ? blockFrequencies.join(', ') + ' MHz' : 'none';
      log += `  Cascaded OIP3: ${oip3LogVal}\n`;
      log += `  Cascaded IIP3: ${iip3LogVal}\n`;
      log += `  Frequencies: ${freqLogVal}\n`;
      
      block.updateParamDisplay();
      
      processed.add(block.id);
      
      const outWires = wires.filter(w => w.sourceId === block.id);
      outWires.forEach(w => {
        inputSignals[w.targetId][w.targetPort] = {
          power_dBm: power_dBm,
          totalF: blockTotalF,
          totalGainLinear: blockTotalGainLinear,
          totalOip3Linear: blockTotalOip3Linear,
          frequencies: blockFrequencies
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
