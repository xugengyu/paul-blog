const fs = require('fs');
const path = require('path');

const data = {
  "displayOptions": {
    "showBlockParams": true,
    "showCascadedParams": true,
    "showFrequency": false,
    "showLogs": true
  },
  "blocks": [
    // --- TX Side ---
    {
      "id": "tx_if",
      "type": "SignalSource",
      "x": 40,
      "y": 160,
      "name": "TX IF Source",
      "params": {
        "Frequency_MHz": 100,
        "Power_dBm": -10,
        "NF_dB": 0
      }
    },
    {
      "id": "tx_lo",
      "type": "SignalSource",
      "x": 240,
      "y": 40,
      "name": "TX LO",
      "params": {
        "Frequency_MHz": 2300,
        "Power_dBm": 10,
        "NF_dB": 0
      }
    },
    {
      "id": "tx_mix",
      "type": "Mixer",
      "x": 240,
      "y": 160,
      "name": "Upconvertor",
      "params": {
        "Type": "Upconvertor",
        "Conversion_Gain_dB": -6,
        "NF_dB": 6,
        "P1dB_dBm": 5,
        "OIP3_dBm": 15
      }
    },
    {
      "id": "tx_filt",
      "type": "Filter",
      "x": 440,
      "y": 160,
      "name": "TX RF Filter",
      "params": {
        "Type": "Bandpass",
        "Lower_Cutoff_MHz": 2350,
        "Upper_Cutoff_MHz": 2450,
        "In_Band_Loss_dB": 2,
        "Out_of_Band_Attenuation_dB": 40
      }
    },
    {
      "id": "tx_pa",
      "type": "Amplifier",
      "x": 640,
      "y": 160,
      "name": "Power Amp",
      "params": {
        "Gain_dB": 20,
        "NF_dB": 5,
        "P1dB_dBm": 25,
        "OIP3_dBm": 35
      }
    },
    
    // --- Free Space Link ---
    {
      "id": "fsl",
      "type": "FreeSpaceLink",
      "x": 840,
      "y": 160,
      "name": "Air",
      "params": {
        "Distance_m": 10000,
        "Tx_Gain_Freqs_MHz": "2400",
        "Tx_Gain_dBi": "5",
        "Rx_Gain_Freqs_MHz": "2400",
        "Rx_Gain_dBi": "5"
      }
    },

    // --- RX Side ---
    {
      "id": "rx_lna",
      "type": "Amplifier",
      "x": 1040,
      "y": 160,
      "name": "LNA",
      "params": {
        "Gain_dB": 15,
        "NF_dB": 2,
        "P1dB_dBm": 10,
        "OIP3_dBm": 20
      }
    },
    {
      "id": "rx_filt",
      "type": "Filter",
      "x": 1240,
      "y": 160,
      "name": "RX RF Filter",
      "params": {
        "Type": "Bandpass",
        "Lower_Cutoff_MHz": 2350,
        "Upper_Cutoff_MHz": 2450,
        "In_Band_Loss_dB": 2,
        "Out_of_Band_Attenuation_dB": 40
      }
    },
    {
      "id": "rx_lo",
      "type": "SignalSource",
      "x": 1440,
      "y": 40,
      "name": "RX LO",
      "params": {
        "Frequency_MHz": 2300,
        "Power_dBm": 10,
        "NF_dB": 0
      }
    },
    {
      "id": "rx_mix",
      "type": "Mixer",
      "x": 1440,
      "y": 160,
      "name": "Downconvertor",
      "params": {
        "Type": "Downconvertor",
        "Conversion_Gain_dB": -6,
        "NF_dB": 6,
        "P1dB_dBm": 5,
        "OIP3_dBm": 15
      }
    },
    {
      "id": "rx_if_amp",
      "type": "Amplifier",
      "x": 1640,
      "y": 160,
      "name": "IF Amp",
      "params": {
        "Gain_dB": 20,
        "NF_dB": 4,
        "P1dB_dBm": 15,
        "OIP3_dBm": 25
      }
    },
    {
      "id": "rx_load",
      "type": "Load",
      "x": 1840,
      "y": 160,
      "name": "ADC Load",
      "params": {}
    }
  ],
  "wires": [
    // TX Side
    { "sourceId": "tx_if", "sourcePort": "out1", "targetId": "tx_mix", "targetPort": "rf" },
    { "sourceId": "tx_lo", "sourcePort": "out1", "targetId": "tx_mix", "targetPort": "lo" },
    { "sourceId": "tx_mix", "sourcePort": "out1", "targetId": "tx_filt", "targetPort": "in1" },
    { "sourceId": "tx_filt", "sourcePort": "out1", "targetId": "tx_pa", "targetPort": "in1" },
    
    // Link
    { "sourceId": "tx_pa", "sourcePort": "out1", "targetId": "fsl", "targetPort": "in1" },
    { "sourceId": "fsl", "sourcePort": "out1", "targetId": "rx_lna", "targetPort": "in1" },
    
    // RX Side
    { "sourceId": "rx_lna", "sourcePort": "out1", "targetId": "rx_filt", "targetPort": "in1" },
    { "sourceId": "rx_filt", "sourcePort": "out1", "targetId": "rx_mix", "targetPort": "rf" },
    { "sourceId": "rx_lo", "sourcePort": "out1", "targetId": "rx_mix", "targetPort": "lo" },
    { "sourceId": "rx_mix", "sourcePort": "out1", "targetId": "rx_if_amp", "targetPort": "in1" },
    { "sourceId": "rx_if_amp", "sourcePort": "out1", "targetId": "rx_load", "targetPort": "in1" }
  ]
};

const dir = path.join(__dirname, 'apps/rf-cascade/examples');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(path.join(dir, 'superheterodyne.json'), JSON.stringify(data, null, 2));
console.log('Created examples/superheterodyne.json');
