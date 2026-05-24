---
title: "Antenna Design Fundamentals for Satellite Links"
date: "2025-12-05"
tags:
  - Satellite Comms
  - RF Engineering
excerpt: "Understanding gain, beam-width, polarisation, and radiation patterns for satellite communication antennas."
---

The antenna is both the first and last element in any satellite link. On the spacecraft it radiates power toward Earth; on the ground it collects vanishingly small power densities and funnels them into the receiver. Understanding antenna fundamentals is essential for any satellite engineer.



        ## Gain and beam-width
        Antenna gain measures how effectively an antenna concentrates energy in a particular direction compared to an ideal isotropic radiator. For a circular aperture antenna (like a parabolic dish):


        <pre><code>G = η × (π × D / λ)²</code></pre>
        where η is aperture efficiency (typically 0.55–0.70), D is diameter, and λ is wavelength. The half-power beam-width is approximately:


        <pre><code>θ₃dB ≈ 70 × λ / D   (degrees)</code></pre>
        A 2.4 m dish at Ku-band (12 GHz) yields about 45 dBi gain with a 0.7° beam-width — tight enough that pointing accuracy becomes critical.



        ## Polarisation
        Satellite links use either linear (horizontal/vertical) or circular (RHCP/LHCP) polarisation. Circular polarisation is preferred for mobile and LEO links because it's immune to Faraday rotation in the ionosphere and doesn't require the terminal to maintain rotational alignment.


        Cross-polarisation discrimination (XPD) typically needs to exceed 25 dB to enable frequency reuse through orthogonal polarisations — effectively doubling the available spectrum.



        ## Antenna types in satellite systems
        <ul>
          <li><strong>Parabolic reflector</strong> — the workhorse for ground stations. Simple, high gain, mechanically steered. Diameters from 0.45 m (consumer DTH) to 13 m+ (teleport gateways).</li>
          <li><strong>Horn antenna</strong> — used as feeds for reflectors and directly on spacecraft for global-beam coverage. Moderate gain, wide bandwidth.</li>
          <li><strong>Patch / microstrip array</strong> — lightweight, conformal, suitable for flat-panel terminals. Used extensively in LEO constellation user terminals.</li>
          <li><strong>Phased array</strong> — electronically steered beam with no moving parts. Essential for LEO tracking terminals and multi-beam spacecraft. Can form multiple simultaneous beams.</li>
          <li><strong>Helix antenna</strong> — naturally produces circular polarisation. Common in UHF/L-band satellite handsets and IoT devices.</li>
        </ul>

        ## The ground station matters
        It's tempting to focus on the spacecraft antenna, but in many systems the ground station G/T ratio is the link bottleneck. Upgrading a ground station dish from 1.2 m to 2.4 m doubles the diameter and quadruples the effective area — adding 6 dB to G/T. That's 6 dB more link margin without touching the satellite.



        <blockquote>In satellite comms, the cheapest dB is almost always on the ground.</blockquote>

        ## Practical considerations
        <ul>
          <li>Wind loading — large dishes need robust pedestals and radomes in exposed locations</li>
          <li>Surface accuracy — dish surface errors should be ≤ λ/16 to maintain rated gain</li>
          <li>Feed horn design — illumination taper, phase centre position, and spillover loss all affect system G/T</li>
          <li>Near-field interactions — at large apertures, ensure no obstructions within the Fresnel zone</li>
        </ul>

        A well-designed antenna is an elegant piece of applied electromagnetics. Whether it's a 60 cm consumer dish or a 500-element phased array, the physics is the same — only the engineering changes.

