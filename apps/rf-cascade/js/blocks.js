class Block {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.params = {};
    this.element = null;
    this.inputs = []; // array of port info
    this.outputs = [];
    
    this.setupParams();
    this.setupPorts();
  }

  setupParams() {
    // Override in subclasses
  }

  setupPorts() {
    // Override in subclasses
    this.inputs = [{ id: 'in1', offsetY: 40 }];
    this.outputs = [{ id: 'out1', offsetY: 40 }];
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'rf-block';
    this.element.dataset.id = this.id;
    this.updatePosition();

    // Header
    const header = document.createElement('div');
    header.className = 'rf-block__header';
    header.textContent = this.type;
    this.element.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'rf-block__body';
    body.innerHTML = this.getBodyHTML();
    this.element.appendChild(body);

    // Params display
    this.paramDisplay = document.createElement('div');
    this.paramDisplay.className = 'rf-block__params';
    this.element.appendChild(this.paramDisplay);
    this.updateParamDisplay();

    // Resize Handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    this.element.appendChild(resizeHandle);

    // Ports
    this.inputs.forEach(p => {
      const portEl = document.createElement('div');
      portEl.className = 'port port--in';
      portEl.dataset.portId = p.id;
      portEl.dataset.blockId = this.id;
      portEl.style.top = (p.offsetY - 2) + 'px';
      this.element.appendChild(portEl);
    });

    this.outputs.forEach(p => {
      const portEl = document.createElement('div');
      portEl.className = 'port port--out';
      portEl.dataset.portId = p.id;
      portEl.dataset.blockId = this.id;
      portEl.style.top = (p.offsetY - 2) + 'px';
      this.element.appendChild(portEl);
    });

    return this.element;
  }

  rebuildPorts() {
    if (this.updatePortsBasedOnParams) {
      this.updatePortsBasedOnParams();
    }
    const oldPorts = this.element.querySelectorAll('.port');
    oldPorts.forEach(p => p.remove());

    this.inputs.forEach(p => {
      const portEl = document.createElement('div');
      portEl.className = 'port port--in';
      portEl.dataset.portId = p.id;
      portEl.dataset.blockId = this.id;
      portEl.style.top = (p.offsetY - 2) + 'px';
      this.element.appendChild(portEl);
    });

    this.outputs.forEach(p => {
      const portEl = document.createElement('div');
      portEl.className = 'port port--out';
      portEl.dataset.portId = p.id;
      portEl.dataset.blockId = this.id;
      portEl.style.top = (p.offsetY - 2) + 'px';
      this.element.appendChild(portEl);
    });
    
    if (window.Workspace) window.Workspace.updateWires();
  }

  updateParamDisplay() {
    if (!this.paramDisplay) return;
    const lines = [];

    const opts = (window.Workspace && window.Workspace.displayOptions) || {
      showBlockParams: true,
      showCascadedParams: true,
      showFrequency: true
    };

    if (opts.showBlockParams) {
      Object.entries(this.params).forEach(([key, val]) => {
        const cleanKey = key.replace(/_/g, ' ');
        lines.push(`<span class="rf-block__param-item rf-block__param-item--block-val">${cleanKey}: ${val}</span>`);
      });
    }

    if (opts.showCascadedParams) {
      if (this.calculatedPIn !== undefined) {
        lines.push(`<span class="rf-block__param-item rf-block__param-item--cascading-val">Cascaded Pin: ${this.calculatedPIn.toFixed(2)} dBm</span>`);
      }
      if (this.calculatedPOut !== undefined) {
        lines.push(`<span class="rf-block__param-item rf-block__param-item--cascading-val">Cascaded Pout: ${this.calculatedPOut.toFixed(2)} dBm</span>`);
      }
      if (this.calculatedNF !== undefined) {
        lines.push(`<span class="rf-block__param-item rf-block__param-item--cascading-val">Cascaded NF: ${this.calculatedNF.toFixed(2)} dB</span>`);
      }
      if (this.calculatedOIP3 !== undefined && !isNaN(this.calculatedOIP3)) {
        const oip3Str = isFinite(this.calculatedOIP3) ? this.calculatedOIP3.toFixed(2) + ' dBm' : 'inf';
        lines.push(`<span class="rf-block__param-item rf-block__param-item--cascading-val">Cascaded OIP3: ${oip3Str}</span>`);
      }
      if (this.calculatedIIP3 !== undefined && !isNaN(this.calculatedIIP3)) {
        const iip3Str = isFinite(this.calculatedIIP3) ? this.calculatedIIP3.toFixed(2) + ' dBm' : 'inf';
        lines.push(`<span class="rf-block__param-item rf-block__param-item--cascading-val">Cascaded IIP3: ${iip3Str}</span>`);
      }
    }

    if (opts.showFrequency) {
      if (this.calculatedFrequencies !== undefined && this.calculatedFrequencies.length > 0) {
        const freqStr = this.calculatedFrequencies.length > 3 
          ? `${this.calculatedFrequencies.slice(0, 3).join(', ')}...`
          : this.calculatedFrequencies.join(', ');
        lines.push(`<span class="rf-block__param-item rf-block__param-item--frequency-val">Freq: ${freqStr} MHz</span>`);
      }
    }

    this.paramDisplay.innerHTML = lines.join('');
  }

  clearCalculations() {
    this.calculatedPIn = undefined;
    this.calculatedPOut = undefined;
    this.calculatedNF = undefined;
    this.calculatedOIP3 = undefined;
    this.calculatedIIP3 = undefined;
    this.calculatedFrequencies = undefined;
    this.updateParamDisplay();
  }

  updatePosition() {
    if (this.element) {
      this.element.style.left = this.x + 'px';
      this.element.style.top = this.y + 'px';
    }
  }

  getBodyHTML() {
    // Can override
    return `<span class="block-label">${this.type.substring(0,3).toUpperCase()}</span>`;
  }
}

class Amplifier extends Block {
  setupParams() {
    this.params = {
      Gain_dB: 15,
      NF_dB: 3.0,
      OIP3_dBm: 30
    };
  }
  getBodyHTML() {
    return `&#9654;`; // Triangle right
  }
}

class Attenuator extends Block {
  setupParams() {
    this.params = {
      Loss_dB: 3.0
    };
  }
  getBodyHTML() {
    return `<span style="font-size:24px; font-weight:bold;">&approx;</span>`; // approximate symbol
  }
}

class Filter extends Block {
  setupParams() {
    this.params = {
      Loss_dB: 1.5,
      Type: 'Bandpass'
    };
  }
  getBodyHTML() {
    return `BPF`;
  }
}

class SignalSource extends Block {
  setupParams() {
    this.params = {
      Frequency_MHz: 2400,
      Power_dBm: -50,
      NF_dB: 0
    };
  }
  setupPorts() {
    this.inputs = []; // No input
    this.outputs = [{ id: 'out1', offsetY: 40 }];
  }
  getBodyHTML() {
    return `<span style="font-size:24px;">&#8767;</span>`; // Sine wave symbol
  }
}

class FreeSpaceLink extends Block {
  setupParams() {
    this.params = {
      Tx_Gain_dBi: 10,
      Path_Loss_dB: 100,
      Rx_Gain_dBi: 10
    };
  }
  setupPorts() {
    this.inputs = [{ id: 'in1', offsetY: 40 }];
    this.outputs = [{ id: 'out1', offsetY: 40 }];
  }
  getBodyHTML() {
    return `<span style="font-size:18px;">FSL</span>`;
  }
}

class Splitter extends Block {
  setupParams() {
    this.params = {
      Number_of_Outputs: 2,
      Loss_dB: 3.0
    };
  }
  setupPorts() {
    this.inputs = [{ id: 'in1', offsetY: 40 }];
    this.updatePortsBasedOnParams();
  }
  updatePortsBasedOnParams() {
    let numOuts = Math.max(2, Math.floor(this.params.Number_of_Outputs));
    this.outputs = [];
    const h = this.element ? this.element.offsetHeight : 80;
    for(let i=0; i<numOuts; i++) {
      this.outputs.push({ id: 'out'+(i+1), offsetY: h / (numOuts + 1) * (i + 1) });
    }
  }
  getBodyHTML() {
    return `<span style="font-size:24px;">&#9094;</span>`;
  }
}

class Combiner extends Block {
  setupParams() {
    this.params = {
      Number_of_Inputs: 2,
      Loss_dB: 3.0
    };
  }
  setupPorts() {
    this.outputs = [{ id: 'out1', offsetY: 40 }];
    this.updatePortsBasedOnParams();
  }
  updatePortsBasedOnParams() {
    let numIns = Math.max(2, Math.floor(this.params.Number_of_Inputs));
    this.inputs = [];
    const h = this.element ? this.element.offsetHeight : 80;
    for(let i=0; i<numIns; i++) {
      this.inputs.push({ id: 'in'+(i+1), offsetY: h / (numIns + 1) * (i + 1) });
    }
  }
  getBodyHTML() {
    return `<span style="font-size:24px;">&#8882;</span>`;
  }
}

class Load extends Block {
  setupParams() {
    this.params = {};
  }
  setupPorts() {
    this.inputs = [{ id: 'in1', offsetY: 40 }];
    this.outputs = [];
  }
  getBodyHTML() {
    return `<span style="font-size:20px;">&#8486;</span>`;
  }
}

class Mixer extends Block {
  setupParams() {
    this.params = {
      Conversion_Gain_dB: -6.0,
      NF_dB: 6.0,
      OIP3_dBm: 15.0
    };
  }
  setupPorts() {
    this.inputs = [
      { id: 'rf', offsetY: 30 },
      { id: 'lo', offsetY: 50 }
    ];
    this.outputs = [
      { id: 'if', offsetY: 40 }
    ];
  }
  getBodyHTML() {
    return `<span style="font-size:20px; font-weight:bold;">&#8855;</span>`;
  }
}

window.RFBlocks = {
  Block,
  Amplifier,
  Attenuator,
  Filter,
  SignalSource,
  FreeSpaceLink,
  Splitter,
  Combiner,
  Load,
  Mixer
};
