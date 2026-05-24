---
title: "Link Budget"
category: "Satellite Comms"
connections:
  - fspl
  - antenna-gain
  - snr
  - leo-vs-geo
---

A link budget tallies every gain and loss from transmitter to receiver: <code>C/N₀ = EIRP − FSPL − Losses + G/T − k</code>.

Key contributors: transmit power, antenna gains, free-space path loss, atmospheric attenuation, pointing errors, and receiver noise temperature. The margin between available and required C/N₀ determines link reliability.