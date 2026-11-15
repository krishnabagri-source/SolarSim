# SolarSim — Virtual Laboratory & Engineering Simulator
## Numerical Integration of Solar Panel Energy Output and Consumption Using Simpson's 1/3 Rule

### Overview
**SolarSim** is an interactive educational virtual laboratory designed for the **Computational Methods Laboratory** internal assessment project. It models and numerically integrates discrete telemetry data from a 10 kW peak rooftop solar photovoltaic (PV) installation and its connected building demand load across a 12-hour daylight cycle (06:00 to 18:00).

### Key Features
1. **Prominent Problem Formulation ("What Problem Are We Solving?")**:
   - Explains the challenge in simple, student-friendly language.
   - Clarifies the dimensional distinction between instantaneous power (kW) and cumulative electrical energy (kWh).
   - Features an interactive, animated solar path canvas with a moving sun, dynamic daylight sky, and continuous area integration.
   - Explains **"Why Can't We Simply Add the Power Readings?"** using dimensional analysis ($1\text{ kW} \neq 1\text{ kWh}$) and the need for numerical integration.

2. **Default Benchmark Dataset (Always Loaded Immediately)**:
   - Evaluates the project report dataset immediately upon opening:
     - **Total Generated Energy ($E_{\text{gen}}$)**: `62.9667 kWh`
     - **Total Consumed Energy ($E_{\text{cons}}$)**: `46.3000 kWh`
     - **Net Energy Balance ($E_{\text{net}}$)**: `+16.6667 kWh` (Surplus Export)
     - **Peak Solar Power ($P_{\text{peak}}$)**: `9.40 kW`
   - Comparison with Trapezoidal Rule:
     - Generated: `62.9000 kWh` (Discrepancy: `+0.0667 kWh`)
     - Consumed: `46.2500 kWh` (Discrepancy: `+0.0500 kWh`)
     - Net: `+16.6500 kWh` (Discrepancy: `+0.0167 kWh`)

3. **Two Distinct Operational Modes**:
   - **Mode A: Use Default Data**: Selected automatically on page load, allowing users to explore all calculations, step-by-step arithmetic, and graphs without entering anything.
   - **Mode B: Enter Your Own Data**:
     - Live editable telemetry table (Time, Generation, Consumption, Net Power).
     - Pre-populated with default values so users can tweak single readings easily.
     - CSV Upload and CSV Download.
     - Start Time and Sampling Interval ($h$) selectors.
     - Quick presets: High Irradiance Summer, Winter Short Day, Overcast, Industrial Load.
     - Reset to Default Data button.
     - Validation requiring at least 3 points, uniform spacing, and an even number of subintervals ($n$ even).

4. **Dedicated Methodological Section ("Why We Chose Simpson's 1/3 Rule")**:
   - Parabolic quadratic approximation vs. straight line linear chords.
   - Fourth-order error convergence: $E_S = -\frac{(b-a)h^4}{180} f^{(4)}(\xi) = \mathcal{O}(h^4)$.
   - Visual explanation of alternating quadrature weights: `1, 4, 2, 4, 2, ..., 4, 1`.
   - Proof of why the number of subintervals $n$ must be even.
   - Interactive visual comparison of parabolic arches vs. trapezoidal chords across the midday solar peak.

5. **Full Suite of 6 Experiments (Working in Both Modes)**:
   - **Experiment 1**: Solar Energy Generation ($E_{\text{gen}}$)
   - **Experiment 2**: Building Energy Consumption ($E_{\text{cons}}$)
   - **Experiment 3**: Generation vs Consumption & Net Balance (Regimes: Morning Import, Midday Export, Evening Import)
   - **Experiment 4**: Comparative Audit (Simpson vs Trapezoidal)
   - **Experiment 5**: Effect of Sampling Interval on Convergence ($\mathcal{O}(h^4)$ slope 4 vs $\mathcal{O}(h^2)$ slope 2)
   - **Experiment 6**: Meteorological Simulation (Clear Sunny, Partly Cloudy with transients, Overcast Day)
   - Each experiment includes: Aim, Problem Solved, Input Data, Mathematical Method, Interactive Graph, Step-by-Step Calculation, Final Result, Observation, Conclusion, and "What Does This Result Mean?".

6. **"What Does This Result Mean?" Physical Interpretations**:
   - Explains that net balance (+16.67 kWh) is not the same as actual physical grid export.
   - Explains the temporal mismatch between morning/evening import (~5.15 kWh) and midday export (~21.82 kWh).
   - Highlights the sizing role of Battery Energy Storage Systems (BESS).

7. **Official Academic Laboratory Assessment Report Generator**:
   - Student metadata fields (Name, Roll No., Department, Semester, Course, Faculty Evaluator).
   - Instant "Print / Save PDF" feature with academic print formatting, tables, formulas, and signature lines.
   - Export CSV and Export JSON telemetry functionality.

### How to Run
Simply open `index.html` in any web browser (Chrome, Edge, Firefox, Safari) or double click the file:
```bash
# Path
c:\Users\DELL\OneDrive\Desktop\SolarSim\index.html
```
No build steps or npm installations are required. It operates 100% offline with zero dependencies.
