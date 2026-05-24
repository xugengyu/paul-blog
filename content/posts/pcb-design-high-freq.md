---
title: "PCB Design for High-Frequency Circuits"
date: "2026-04-08"
tags:
  - PCB Design
  - RF Engineering
excerpt: "Practical tips for laying out RF traces, choosing substrates, and managing impedance in multi-GHz board design."
---

Once your operating frequency crosses a few hundred MHz, PCB layout stops being a wiring exercise and becomes an electromagnetic design problem. Every trace is a transmission line, every via is an inductor, and every copper pour has resonant modes you didn't ask for.



        ## Substrate selection matters
        Standard FR-4 has a loss tangent (tan δ) of about 0.02 at 1 GHz — which may be acceptable for digital signals but introduces significant insertion loss for RF paths at Ku-band and above. Consider:


        <ul>
          <li><strong>Rogers RO4350B</strong> (tan δ ≈ 0.004) — a popular mid-range RF laminate</li>
          <li><strong>Rogers RT/duroid 5880</strong> (tan δ ≈ 0.0009) — excellent for mmWave, but fragile and expensive</li>
          <li><strong>Megtron 6</strong> (tan δ ≈ 0.004) — good for mixed-signal boards with both high-speed digital and RF</li>
        </ul>

        ## Controlled impedance
        Use a 2D field solver (not the rough IPC formula) to calculate trace widths for your target impedance. A typical 50 Ω microstrip on 8-mil RO4350B (εr = 3.66) needs a trace width of about 17.5 mil. Always request impedance coupons from your fabricator and verify with TDR.



        ## Via transitions
        Every signal via is a discontinuity. At frequencies above 5 GHz, the inductance of a single via can cause 1–2 dB of return loss. Mitigations include:


        <ul>
          <li>Using multiple ground vias (stitching vias) around each signal via</li>
          <li>Back-drilling unused via stubs to reduce resonance</li>
          <li>Adding anti-pads optimised for the transition impedance</li>
        </ul>

        ## Grounding and decoupling
        Maintain a continuous ground plane directly beneath all RF traces. Any slot in the ground — from a misplaced trace on an adjacent layer — creates a slot antenna that radiates and couples.


        Place decoupling capacitors as close to IC power pins as physically possible, and use the lowest-inductance pad geometry. At >1 GHz, the capacitor's ESL (equivalent series inductance) often matters more than its capacitance value.



        ## Practical checklist
        <ul>
          <li>Minimise trace length on RF paths — every mm counts at mmWave</li>
          <li>Avoid right-angle bends; use 45° mitred bends or smooth arcs</li>
          <li>Keep RF traces away from digital switching noise</li>
          <li>Use ground-backed coplanar waveguide (GCPW) for better shielding</li>
          <li>Simulate in a 3D EM tool (HFSS, CST) before committing to fabrication</li>
        </ul>

        <blockquote>The best RF PCB is one where every design choice has a simulation behind it.</blockquote>

        High-frequency PCB design is part art, part physics. The good news: with modern simulation tools and low-loss laminates, it's never been more accessible.

