---
title: "Understanding Satellite Link Budgets"
date: "2026-05-15"
tags:
  - Satellite Comms
  - RF Engineering
excerpt: "End-to-end link budget analysis for LEO and GEO satellites covering EIRP, path loss, G/T, and C/N₀."
---

A link budget is the single most important analysis in satellite communications engineering. It's a ledger that accounts for every dB of gain and loss between a transmitter and a receiver, ultimately telling you whether your link will close with adequate margin — or not.



        ## The fundamental equation
        At its core the link budget computes the carrier-to-noise-density ratio at the receiver:


        <pre><code>C/N₀ (dB·Hz) = EIRP − FSPL − L_misc + G/T − k</code></pre>
        Where:


        <ul>
          <li><strong>EIRP</strong> — Effective Isotropic Radiated Power (dBW): transmitter power + antenna gain</li>
          <li><strong>FSPL</strong> — Free-Space Path Loss (dB): the inverse-square-law spreading</li>
          <li><strong>L_misc</strong> — Miscellaneous losses: atmospheric, rain, polarisation mismatch, pointing error</li>
          <li><strong>G/T</strong> — Receiver figure of merit (dB/K): antenna gain minus system noise temperature</li>
          <li><strong>k</strong> — Boltzmann's constant: −228.6 dBW/K/Hz</li>
        </ul>

        ## Working a GEO example
        Consider a Ku-band (12 GHz) DTH broadcast from a GEO satellite at 36 000 km. The satellite EIRP is 52 dBW over a shaped beam.


        <pre><code>FSPL = 20 log₁₀(36 000) + 20 log₁₀(12 000) + 32.45
     = 91.1 + 81.6 + 32.45
     = 205.2 dB</code></pre>
        With a 60 cm consumer dish (G ≈ 33 dBi, T_sys ≈ 150 K → G/T ≈ 11.2 dB/K), clear-sky atmospheric loss of 0.5 dB, and pointing loss of 0.3 dB:


        <pre><code>C/N₀ = 52 − 205.2 − 0.8 + 11.2 − (−228.6)
     = 85.8 dB·Hz</code></pre>
        For a DVB-S2 QPSK rate-3/4 carrier occupying 36 MHz, the required Eb/N₀ is about 4.7 dB, which translates to a required C/N₀ of roughly 81 dB·Hz. That gives us a healthy <strong>4.8 dB margin</strong> — enough to ride through moderate rain fade.



        ## LEO constellation considerations
        LEO links benefit from 15–20 dB less path loss compared to GEO, but introduce challenges:


        <ul>
          <li>Doppler shift can exceed ±500 kHz at Ka-band</li>
          <li>Elevation angle varies continuously, changing atmospheric path length</li>
          <li>Handover between satellites must be seamless</li>
          <li>Ground antennas need tracking capability (phased arrays or mechanically steered)</li>
        </ul>
        Despite these complexities, the lower path loss means LEO systems can use smaller spacecraft antennas and lower transmit power while still achieving high data rates — a key advantage driving the current mega-constellation boom.



        ## Rain fade and availability
        Rain attenuation increases roughly with frequency squared. At Ka-band, a moderate 25 mm/hr rainfall can attenuate the signal by 8–12 dB, consuming your entire clear-sky margin. Operators combat this with:


        <ul>
          <li><strong>Adaptive Coding &amp; Modulation (ACM)</strong> — dynamically reducing throughput to maintain the link</li>
          <li><strong>Site diversity</strong> — routing traffic to geographically separated ground stations</li>
          <li><strong>Power control</strong> — the spacecraft increases EIRP toward affected beams</li>
        </ul>

        ## Conclusion
        A well-constructed link budget is more than arithmetic — it forces you to confront every assumption about your system. Get comfortable with building and iterating on link budgets early; it's the lingua franca of satellite system engineering.

