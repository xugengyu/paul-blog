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
      portEl.style.top = p.offsetY + 'px';
      this.element.appendChild(portEl);
    });

    this.outputs.forEach(p => {
      const portEl = document.createElement('div');
      portEl.className = 'port port--out';
      portEl.dataset.portId = p.id;
      portEl.dataset.blockId = this.id;
      portEl.style.top = p.offsetY + 'px';
      this.element.appendChild(portEl);
    });

    return this.element;
  }

  updateParamDisplay() {
    if (!this.paramDisplay) return;
    const lines = Object.entries(this.params).map(([key, val]) => {
      const cleanKey = key.replace(/_/g, ' ');
      return `${cleanKey}: ${val}`;
    });

    if (this.calculatedPIn !== undefined) {
      lines.push(`Pin: ${this.calculatedPIn.toFixed(2)} dBm`);
    }
    if (this.calculatedPOut !== undefined) {
      lines.push(`Pout: ${this.calculatedPOut.toFixed(2)} dBm`);
    }
    if (this.calculatedNF !== undefined) {
      lines.push(`NF: ${this.calculatedNF.toFixed(2)} dB`);
    }

    this.paramDisplay.innerHTML = lines.join('<br>');
  }

  clearCalculations() {
    this.calculatedPIn = undefined;
    this.calculatedPOut = undefined;
    this.calculatedNF = undefined;
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

class Antenna extends Block {
  setupParams() {
    this.params = {
      Gain_dBi: 10,
      Temp_K: 290,
      NF_dB: 0
    };
  }
  setupPorts() {
    this.inputs = [{ id: 'in1', offsetY: 40 }];
    this.outputs = [{ id: 'out1', offsetY: 40 }];
  }
  getBodyHTML() {
    return `Y`;
  }
}

window.RFBlocks = {
  Block,
  Amplifier,
  Attenuator,
  Filter,
  SignalSource,
  Antenna
};
