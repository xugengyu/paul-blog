---
title: Signal Integrity in High-Speed Digital Design
date: "2026-01-30"
tags:
  - Signal Processing
  - PCB Design
excerpt: Managing reflections, crosstalk, and power-delivery noise on 10+ Gbps SerDes lanes — eye diagrams, S-parameters, and stackup choices.
---

When your data rate crosses 5 Gbps, your PCB traces stop being simple wires and start behaving like transmission lines. Welcome to the world of signal integrity — where impedance discontinuities, dielectric loss, and crosstalk conspire to close your eye diagrams.

## When does SI matter?
A useful rule of thumb: SI analysis is necessary when the trace length exceeds 1/6 of the signal's wavelength at its highest significant frequency. For a 10 Gbps NRZ signal, the Nyquist frequency is 5 GHz (λ ≈ 30 mm in FR-4). Any trace longer than ~5 mm needs controlled impedance and careful routing.

## Reflections
Impedance mismatches cause partial signal reflections. The reflection coefficient at a discontinuity is:

```text
Γ = (Z_L − Z_0) / (Z_L + Z_0)
```

A via transition, connector, or IC package pad can each introduce a few ohms of impedance change. These reflections add up, creating inter-symbol interference (ISI) that degrades the eye opening. TDR (time-domain reflectometry) is the primary tool for finding and quantifying discontinuities.

## Dielectric and conductor loss
At multi-GHz frequencies, insertion loss matters. Two mechanisms dominate:

- **Dielectric loss** — proportional to frequency and the laminate's loss tangent (tan δ). Standard FR-4 has tan δ ≈ 0.02; low-loss materials like Megtron 6 offer tan δ ≈ 0.004.
- **Conductor loss** — increases with √f due to the skin effect. Smoother copper (reverse-treated foil, VLP) reduces conductor loss at high frequencies.

## Crosstalk
Adjacent traces couple through mutual capacitance and inductance. Near-end crosstalk (NEXT) appears at the driven end; far-end crosstalk (FEXT) at the far end. Mitigation strategies:

- Maintain ≥ 3× trace-width spacing (the "3W rule")
- Use differential signalling — common-mode noise rejection helps
- Route sensitive lanes on different layers with orthogonal orientations
- Ground-reference both sides of critical traces (stripline vs microstrip)

## Eye diagrams and channel simulation
The eye diagram is the ultimate pass/fail metric. You overlay thousands of bit intervals and look at the eye opening — the clear region in the middle. The opening must exceed the receiver's sensitivity threshold with margin.

Modern SerDes channels are simulated using S-parameter models of each segment (package, via, trace, connector), cascaded together and convolved with a bit pattern. Tools like Keysight ADS, Ansys HFSS, and Cadence Sigrity make this workflow increasingly accessible.

> In high-speed design, the channel is the enemy and equalisation is your weapon. But a good channel is always cheaper than a complex equaliser.

Signal integrity is where analog, digital, and electromagnetic disciplines converge. If you're designing boards above 5 Gbps, invest the time to learn it properly — your eye diagrams will thank you.
