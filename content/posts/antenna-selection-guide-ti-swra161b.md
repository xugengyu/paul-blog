---
title: "Choosing the Right Antenna: A Summary of TI's SWRA161B Application Note"
date: 2026-05-24
excerpt: "A deep dive into Texas Instruments' SWRA161B (AN058) guide, comparing PCB trace, chip, and whip antennas for short-range wireless designs."
tags: RF Engineering, Antenna Design, Tutorial
---

Designing a short-range wireless device presents engineers with a classic multidimensional optimization problem: how to balance **cost**, **size**, and **performance** when selecting and integrating an antenna. 

Texas Instruments’ application note **SWRA161B** (historically referred to as **AN058**), titled *"Antenna Selection Guide,"* serves as an essential primer for navigating these trade-offs. This post summarizes the key parameters, antenna comparisons, and practical design recommendations outlined in the guide.

---

## 1. Core Antenna Parameters & Metrics

Before selecting a form factor, it is critical to understand the primary metrics used to characterize antenna performance:

*   **Impedance Matching:** Most short-range RF ICs and transmission lines are designed for a 50 Ω characteristic impedance. Impedance mismatches at the antenna feed point cause RF energy to reflect back to the source rather than radiate.
*   **VSWR & Return Loss:** The Voltage Standing Wave Ratio (VSWR) and Return Loss measure how well the antenna is matched. The application note defines the **usable bandwidth** of an antenna as the frequency range where **VSWR ≤ 2.0** (which corresponds to a **Return Loss ≥ 9.5 dB**). At this threshold, approximately 10% or less of the incident power is reflected.
*   **Radiation Pattern & Gain:** The radiation pattern describes how an antenna distributes energy in 3D space. While isotropic radiators distribute energy equally in all directions (0 dBi), practical antennas focus energy in specific directions, yielding gain.

---

## 2. Comparing Antenna Types

SWRA161B classifies antennas for short-range devices into three major categories: **PCB Trace Antennas**, **Ceramic Chip Antennas**, and **External Whip Antennas**.

| Antenna Type | Unit Cost | Physical Size | Performance | Primary Pros | Primary Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PCB Trace (IFA/MIFA)** | Lowest ($0.00) | Large to Medium | Good | No BOM cost; high repeatability in fabrication. | Requires significant PCB real estate; hard to design/simulate. |
| **Ceramic Chip** | Medium ($0.10 - $1.00) | Smallest | Medium to Good | Extremely compact; easy off-the-shelf placement. | Higher BOM cost; narrower bandwidth; high sensitivity to nearby components. |
| **External Whip** | Highest | Largest | Excellent | Maximum range; omnidirectional; independent of board size. | Expensive; requires an RF connector (e.g., SMA/U.FL); bulky. |

### PCB Trace Antennas: IFA vs. MIFA
PCB trace antennas are etched directly onto the circuit board copper layer.
*   **Inverted-F Antenna (IFA):** Typically has high efficiency and wider bandwidth, making it very forgiving to tune. However, it requires a larger layout area.
*   **Meandered Inverted-F Antenna (MIFA):** By folding the radiating element into a serpentine pattern, the physical length is compacted. MIFAs are widely used in space-constrained 2.4 GHz designs like USB dongles, wireless mice, and wearable devices, though they have narrower bandwidth.

### Ceramic Chip Antennas
Chip antennas are tiny, surface-mount components that contain high-permittivity dielectric materials to artificially reduce the wavelength inside the component. They are the go-to solution for miniaturized electronics, particularly at frequencies below 1 GHz where a PCB trace antenna would occupy the entire board.

### Whip Antennas
A whip antenna is an external wire monopole. Because it is physically separated from the PCB ground plane and stands out in free space, it offers the best radiation efficiency and range. However, it requires a connector, a cable/assembly, and mechanical mounting, driving up material and assembly costs.

---

## 3. Practical Layout & Integration Rules

The guide highlights that an antenna is not a self-contained component; it is a system that interacts dynamically with its physical surroundings.

### The Ground Plane is Part of the Antenna
For monopole-type antennas (including IFA, MIFA, and chip antennas), the PCB ground plane acts as the second half of the dipole (the "counterpoise"). 
*   **Ground Plane Size:** The length and width of the ground plane directly affect the radiation pattern, resonant frequency, and impedance of the antenna. 
*   **Enclosure Effects:** Plastic housings, batteries, and metallic enclosures near the radiating element will shift the resonance down in frequency due to their higher dielectric constant compared to air.

### Keep the Clearance Area Clean
Antennas require a "clearance area"—a dedicated region on all layers of the PCB where no copper traces, ground planes, components, or mounting screws are present. Placing metal within this near-field zone will severely detune the antenna and absorb radiated energy.

### Always Implement a π-Matching Network
Even if an antenna is advertised as "50 Ω matched," the specific dielectric of your PCB stackup, trace widths, and enclosure will shift its impedance. 

TI strongly recommends placing a **π-matching network** (consisting of two shunt components and one series component) as close to the antenna feed point as possible. This allows you to tune the network using a vector network analyzer (VNA) post-manufacturing without revising the PCB layout.

---

## 4. Summary Checklist for Designers

1.  **Select the type** based on budget and space: use a PCB trace antenna (MIFA/IFA) if space permits to save BOM costs; opt for a chip antenna if space is extremely tight; use a whip antenna if max range is the overriding requirement.
2.  **Copy reference layouts exactly:** Do not alter the width, length, or clearance dimensions of TI’s reference designs (e.g., DN007 or AN043) unless you have the simulation tools to re-characterize them.
3.  **Ensure a solid ground plane** is connected back to the antenna ground feed point.
4.  **Allocate space for the matching network** close to the feed point to ensure you can tune out parasitic effects from the enclosure.
