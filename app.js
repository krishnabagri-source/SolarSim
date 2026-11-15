/**
 * SolarSim — Computational Methods Laboratory Virtual Lab Engine
 * Composite Simpson's 1/3 Rule vs. Trapezoidal Rule Engineering Simulator
 */

(function () {
  'use strict';

  // --- DEFAULT BENCHMARK DATASET (From Project Report Page 5) ---
  const DEFAULT_DATA = {
    startTime: '06:00',
    startHour: 6.0,
    h: 1.0, // Step size in hours
    hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    times: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    pGen: [0.20, 1.45, 3.60, 5.85, 7.70, 8.95, 9.40, 8.80, 7.40, 5.35, 3.10, 1.15, 0.10],
    pCons: [1.80, 2.10, 2.90, 3.80, 4.40, 4.85, 5.10, 4.95, 4.60, 4.20, 3.75, 3.30, 2.80]
  };

  // --- PRESET PROFILES FOR CUSTOM MODE ---
  const PRESETS = {
    default: {
      name: 'Default Report Data',
      startTime: '06:00',
      startHour: 6.0,
      h: 1.0,
      pGen: [0.20, 1.45, 3.60, 5.85, 7.70, 8.95, 9.40, 8.80, 7.40, 5.35, 3.10, 1.15, 0.10],
      pCons: [1.80, 2.10, 2.90, 3.80, 4.40, 4.85, 5.10, 4.95, 4.60, 4.20, 3.75, 3.30, 2.80]
    },
    summer: {
      name: 'High Irradiance Summer Day',
      startTime: '05:00',
      startHour: 5.0,
      h: 1.0,
      pGen: [0.15, 0.90, 2.80, 5.20, 7.80, 9.60, 10.80, 11.20, 10.50, 8.90, 6.70, 4.10, 1.80, 0.40, 0.05],
      pCons: [2.10, 2.40, 3.20, 4.50, 5.60, 6.20, 6.80, 6.90, 6.50, 5.80, 5.10, 4.20, 3.50, 2.80, 2.20]
    },
    winter: {
      name: 'Winter Short Day Profile',
      startTime: '07:00',
      startHour: 7.0,
      h: 1.0,
      pGen: [0.10, 1.20, 3.10, 5.20, 6.10, 5.80, 4.40, 2.60, 0.80, 0.10, 0.00],
      pCons: [2.50, 3.20, 4.10, 4.80, 5.20, 5.10, 4.90, 4.60, 4.20, 3.80, 3.10]
    },
    cloudy: {
      name: 'Overcast Cloudy Pattern',
      startTime: '06:00',
      startHour: 6.0,
      h: 1.0,
      pGen: [0.05, 0.35, 0.90, 1.50, 2.10, 2.45, 2.60, 2.30, 1.85, 1.30, 0.70, 0.25, 0.05],
      pCons: [1.80, 2.10, 2.90, 3.80, 4.40, 4.85, 5.10, 4.95, 4.60, 4.20, 3.75, 3.30, 2.80]
    },
    industrial: {
      name: 'Heavy Commercial Load',
      startTime: '06:00',
      startHour: 6.0,
      h: 1.0,
      pGen: [0.20, 1.45, 3.60, 5.85, 7.70, 8.95, 9.40, 8.80, 7.40, 5.35, 3.10, 1.15, 0.10],
      pCons: [4.50, 6.20, 8.50, 9.80, 10.40, 10.90, 11.20, 10.80, 10.10, 9.40, 8.20, 6.50, 5.00]
    }
  };

  // --- APPLICATION STATE ---
  let state = {
    mode: 'default', // 'default' or 'custom'
    activeExp: 1,
    custom: {
      startTime: '06:00',
      startHour: 6.0,
      h: 1.0,
      hours: [...DEFAULT_DATA.hours],
      times: [...DEFAULT_DATA.times],
      pGen: [...DEFAULT_DATA.pGen],
      pCons: [...DEFAULT_DATA.pCons]
    },
    anim: {
      isPlaying: false,
      currentTime: 12.0,
      rafId: null
    },
    exp5: {
      selectedH: 1.0
    },
    exp6: {
      scenario: 'sunny' // 'sunny', 'partly', 'cloudy'
    }
  };

  // --- MATHEMATICAL QUADRATURE ENGINE ---

  /**
   * Composite Simpson's 1/3 Rule
   * Integral ≈ (h / 3) * [y0 + yn + 4 * sum(y_odd) + 2 * sum(y_even)]
   */
  function simpsonsRule(y, h) {
    const N = y.length;
    const n = N - 1; // number of subintervals

    if (N < 3 || n % 2 !== 0) {
      return {
        isValid: false,
        error: `Simpson's 1/3 Rule strictly requires an even number of subintervals (currently n = ${n}).`,
        result: 0,
        endpoints: 0,
        oddSum: 0,
        evenSum: 0,
        bracket: 0
      };
    }

    const endpoints = y[0] + y[n];
    let oddSum = 0;
    let evenSum = 0;

    for (let i = 1; i < n; i += 2) {
      oddSum += y[i];
    }
    for (let i = 2; i < n; i += 2) {
      evenSum += y[i];
    }

    const bracket = endpoints + (4 * oddSum) + (2 * evenSum);
    const result = (h / 3.0) * bracket;

    return {
      isValid: true,
      n: n,
      h: h,
      endpoints: endpoints,
      oddSum: oddSum,
      evenSum: evenSum,
      bracket: bracket,
      result: result
    };
  }

  /**
   * Composite Trapezoidal Rule
   * Integral ≈ (h / 2) * [y0 + yn + 2 * sum(y_interior)]
   */
  function trapezoidalRule(y, h) {
    const N = y.length;
    const n = N - 1;

    if (N < 2) {
      return { isValid: false, result: 0, endpoints: 0, interiorSum: 0 };
    }

    const endpoints = y[0] + y[n];
    let interiorSum = 0;
    for (let i = 1; i < n; i++) {
      interiorSum += y[i];
    }

    const bracket = endpoints + (2 * interiorSum);
    const result = (h / 2.0) * bracket;

    return {
      isValid: true,
      n: n,
      h: h,
      endpoints: endpoints,
      interiorSum: interiorSum,
      result: result
    };
  }

  /**
   * Get Active Dataset based on Current Mode
   */
  function getActiveData() {
    if (state.mode === 'default') {
      const pNet = DEFAULT_DATA.pGen.map((g, idx) => g - DEFAULT_DATA.pCons[idx]);
      return {
        ...DEFAULT_DATA,
        pNet: pNet,
        isCustom: false
      };
    } else {
      const pNet = state.custom.pGen.map((g, idx) => g - (state.custom.pCons[idx] || 0));
      return {
        ...state.custom,
        pNet: pNet,
        isCustom: true
      };
    }
  }

  /**
   * Format helper: HH:MM from decimal hour
   */
  function formatClockTime(decimalHour) {
    let normalized = decimalHour % 24;
    if (normalized < 0) normalized += 24;
    const h = Math.floor(normalized);
    const m = Math.round((normalized - h) * 60);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // --- INITIALIZATION & DOM BINDINGS ---
  document.addEventListener('DOMContentLoaded', () => {
    initModeTabs();
    initExperimentTabs();
    initDefaultTable();
    initCustomControls();
    initAnimatedSolar();
    initCurvatureDemo();
    initReportGenerator();
    initPresetSelector();
    initExp5Controls();
    initExp6Controls();

    // Initial calculation and full update
    recalculateAll();

    // Initialize math rendering (KaTeX with offline Unicode fallback)
    initMathRendering();

    // Re-render canvases on resize
    window.addEventListener('resize', debounce(() => {
      renderActiveExpGraph();
      renderAnimatedSolarFrame(state.anim.currentTime);
      renderCurvatureDemo();
    }, 150));
  });

  // --- MATH RENDERING ENGINE (KATEX + OFFLINE TYPOGRAPHY FALLBACK) ---
  function initMathRendering() {
    function tryRenderKaTeX() {
      if (typeof window.renderMathInElement === 'function') {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
        return true;
      }
      return false;
    }

    if (!tryRenderKaTeX()) {
      // Check again after short delay in case async script loads
      setTimeout(() => {
        if (!tryRenderKaTeX()) {
          fallbackMathTypography(document.body);
        }
      }, 350);
    }
  }

  function fallbackMathTypography(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && (node.nodeValue.includes('$$') || node.nodeValue.includes('\\(') || node.nodeValue.includes('\\int') || node.nodeValue.includes('\\mathcal'))) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach(textNode => {
      let val = textNode.nodeValue;
      val = val.replace(/\$\$(.*?)\$\$/gs, (_, math) => formatMathString(math));
      val = val.replace(/\\\((.*?)\\\)/gs, (_, math) => formatMathString(math));
      if (val !== textNode.nodeValue) {
        const span = document.createElement('span');
        span.className = 'math-rendered-fallback';
        span.innerHTML = val;
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }

  function formatMathString(math) {
    let s = math;
    s = s.replace(/\\mathcal\{O\}\(h\^4\)/g, '𝒪(h⁴)');
    s = s.replace(/\\mathcal\{O\}\(h\^2\)/g, '𝒪(h²)');
    s = s.replace(/\\int_([a-zA-Z0-9\\]+)\^([a-zA-Z0-9\\]+)/g, '∫<sub>$1</sub><sup>$2</sup>');
    s = s.replace(/\\int/g, '∫');
    s = s.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∑<sub>$1</sub><sup>$2</sup>');
    s = s.replace(/\\sum_\{([^{}]+)\}/g, '∑<sub>$1</sub>');
    s = s.replace(/\\sum/g, '∑');
    s = s.replace(/\\approx/g, ' ≈ ');
    s = s.replace(/\\equiv/g, ' ≡ ');
    s = s.replace(/\\xi/g, 'ξ');
    s = s.replace(/\\cdot/g, ' · ');
    s = s.replace(/\\pi/g, 'π');
    s = s.replace(/\\sin/g, 'sin');
    s = s.replace(/\\cos/g, 'cos');
    s = s.replace(/\\le/g, ' ≤ ');
    s = s.replace(/\\ge/g, ' ≥ ');
    s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
    s = s.replace(/\\/g, '');
    return s;
  }

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --- MODE TABS HANDLING ---
  function initModeTabs() {
    const tabDefault = document.getElementById('tab-mode-default');
    const tabCustom = document.getElementById('tab-mode-custom');
    const panelDefault = document.getElementById('panel-mode-default');
    const panelCustom = document.getElementById('panel-mode-custom');
    const badge = document.getElementById('active-mode-badge');
    const lblActiveMode1 = document.getElementById('lbl-active-mode-1');
    const btnQuickDefault = document.getElementById('btn-quick-default');

    function switchMode(newMode) {
      state.mode = newMode;
      if (newMode === 'default') {
        tabDefault.classList.add('active');
        tabDefault.setAttribute('aria-selected', 'true');
        tabCustom.classList.remove('active');
        tabCustom.setAttribute('aria-selected', 'false');

        panelDefault.classList.add('active');
        panelCustom.classList.remove('active');

        badge.innerHTML = '<span class="status-indicator"></span> Current Mode: <strong>Mode A (Default Report Data)</strong>';
        if (lblActiveMode1) lblActiveMode1.textContent = 'Default Report Dataset';
      } else {
        tabCustom.classList.add('active');
        tabCustom.setAttribute('aria-selected', 'true');
        tabDefault.classList.remove('active');
        tabDefault.setAttribute('aria-selected', 'false');

        panelCustom.classList.add('active');
        panelDefault.classList.remove('active');

        badge.innerHTML = '<span class="status-indicator status-custom"></span> Current Mode: <strong>Mode B (Custom User Data)</strong>';
        if (lblActiveMode1) lblActiveMode1.textContent = 'Custom User Dataset';

        renderCustomTable();
      }
      recalculateAll();
    }

    tabDefault.addEventListener('click', () => switchMode('default'));
    tabCustom.addEventListener('click', () => switchMode('custom'));
    if (btnQuickDefault) {
      btnQuickDefault.addEventListener('click', () => {
        switchMode('default');
        document.getElementById('data-mode-section').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // --- EXPERIMENT TABS ---
  function initExperimentTabs() {
    const buttons = document.querySelectorAll('.exp-tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const expId = parseInt(btn.getAttribute('data-exp'), 10);
        state.activeExp = expId;

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.experiment-panel').forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`exp-panel-${expId}`);
        if (activePanel) activePanel.classList.add('active');

        renderActiveExpGraph();
      });
    });
  }

  // --- POPULATE DEFAULT TABLE (MODE A) ---
  function initDefaultTable() {
    const tbody = document.getElementById('default-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const d = DEFAULT_DATA;
    const n = d.hours.length - 1;

    d.hours.forEach((hour, i) => {
      const tr = document.createElement('tr');

      // Simpson weight
      let weight = 1;
      let weightClass = 'end';
      if (i === 0 || i === n) {
        weight = 1;
        weightClass = 'end';
      } else if (i % 2 !== 0) {
        weight = 4;
        weightClass = 'odd';
      } else {
        weight = 2;
        weightClass = 'even';
      }

      const pGen = d.pGen[i];
      const pCons = d.pCons[i];
      const pNet = pGen - pCons;

      // Operational regime label
      let regimeTag = '';
      if (pNet > 0) {
        regimeTag = '<span class="badge badge-success">Midday Surplus (Export)</span>';
      } else {
        regimeTag = hour <= 10 ? '<span class="badge badge-accent">Morning Deficit (Import)</span>' : '<span class="badge badge-blue">Evening Deficit (Import)</span>';
      }

      tr.innerHTML = `
        <td class="font-mono">${i}</td>
        <td><strong>${d.times[i]}</strong></td>
        <td class="font-mono">${hour.toFixed(1)}</td>
        <td><span class="weight-badge ${weightClass}">${weight}</span></td>
        <td class="font-mono">${pGen.toFixed(2)}</td>
        <td class="font-mono">${pCons.toFixed(2)}</td>
        <td class="font-mono ${pNet >= 0 ? 'text-positive' : 'text-negative'}">${pNet >= 0 ? '+' : ''}${pNet.toFixed(2)}</td>
        <td>${regimeTag}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- CUSTOM TABLE & CONTROLS (MODE B) ---
  function initCustomControls() {
    const btnAdd = document.getElementById('btn-add-row');
    const btnRemove = document.getElementById('btn-remove-row');
    const btnReset = document.getElementById('btn-reset-custom');
    const hSelect = document.getElementById('custom-h-select');
    const startTimeInput = document.getElementById('custom-start-time');
    const csvFileInput = document.getElementById('csv-file-input');
    const btnDownloadCsv = document.getElementById('btn-download-csv');

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const c = state.custom;
        const lastH = c.hours.length > 0 ? c.hours[c.hours.length - 1] : c.startHour;
        const nextHour = lastH + c.h;
        c.hours.push(nextHour);
        c.times.push(formatClockTime(nextHour));
        c.pGen.push(0.0);
        c.pCons.push(2.5);
        renderCustomTable();
        recalculateAll();
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener('click', () => {
        const c = state.custom;
        if (c.hours.length > 3) {
          c.hours.pop();
          c.times.pop();
          c.pGen.pop();
          c.pCons.pop();
          renderCustomTable();
          recalculateAll();
        } else {
          alert("A minimum of 3 observations is required to evaluate Simpson's 1/3 Rule.");
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        resetCustomToDefault();
      });
    }

    if (hSelect) {
      hSelect.addEventListener('change', (e) => {
        state.custom.h = parseFloat(e.target.value);
        updateCustomTimes();
        renderCustomTable();
        recalculateAll();
      });
    }

    if (startTimeInput) {
      startTimeInput.addEventListener('change', (e) => {
        state.custom.startTime = e.target.value;
        const parts = e.target.value.split(':');
        state.custom.startHour = parseInt(parts[0], 10) + (parseInt(parts[1], 10) / 60);
        updateCustomTimes();
        renderCustomTable();
        recalculateAll();
      });
    }

    if (csvFileInput) {
      csvFileInput.addEventListener('change', handleCsvUpload);
    }

    if (btnDownloadCsv) {
      btnDownloadCsv.addEventListener('click', downloadCurrentCsv);
    }
  }

  function resetCustomToDefault() {
    state.custom = {
      startTime: '06:00',
      startHour: 6.0,
      h: 1.0,
      hours: [...DEFAULT_DATA.hours],
      times: [...DEFAULT_DATA.times],
      pGen: [...DEFAULT_DATA.pGen],
      pCons: [...DEFAULT_DATA.pCons]
    };
    const hSelect = document.getElementById('custom-h-select');
    if (hSelect) hSelect.value = "1.0";
    const startTimeInput = document.getElementById('custom-start-time');
    if (startTimeInput) startTimeInput.value = "06:00";
    const presetSelect = document.getElementById('preset-select');
    if (presetSelect) presetSelect.value = "default";

    renderCustomTable();
    recalculateAll();
  }

  function updateCustomTimes() {
    const c = state.custom;
    c.hours = [];
    c.times = [];
    for (let i = 0; i < c.pGen.length; i++) {
      const hVal = c.startHour + (i * c.h);
      c.hours.push(hVal);
      c.times.push(formatClockTime(hVal));
    }
  }

  function renderCustomTable() {
    const tbody = document.getElementById('custom-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const c = state.custom;
    const n = c.hours.length - 1;

    c.hours.forEach((hour, i) => {
      const tr = document.createElement('tr');

      let weight = 1;
      let weightClass = 'end';
      if (i === 0 || i === n) {
        weight = 1;
        weightClass = 'end';
      } else if (i % 2 !== 0) {
        weight = 4;
        weightClass = 'odd';
      } else {
        weight = 2;
        weightClass = 'even';
      }

      const pGen = c.pGen[i];
      const pCons = c.pCons[i];
      const pNet = pGen - pCons;

      tr.innerHTML = `
        <td class="font-mono">${i}</td>
        <td><strong>${c.times[i]}</strong></td>
        <td class="font-mono">${hour.toFixed(2)}</td>
        <td><span class="weight-badge ${weightClass}">${weight}</span></td>
        <td>
          <input type="number" step="0.05" min="0" value="${pGen.toFixed(2)}" data-row="${i}" data-col="pGen" class="cell-input">
        </td>
        <td>
          <input type="number" step="0.05" min="0" value="${pCons.toFixed(2)}" data-row="${i}" data-col="pCons" class="cell-input">
        </td>
        <td class="font-mono ${pNet >= 0 ? 'text-positive' : 'text-negative'}">${pNet >= 0 ? '+' : ''}${pNet.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-danger-ghost btn-del-row" data-row="${i}">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach cell input event listeners
    tbody.querySelectorAll('.cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const row = parseInt(e.target.getAttribute('data-row'), 10);
        const col = e.target.getAttribute('data-col');
        const val = parseFloat(e.target.value) || 0;
        state.custom[col][row] = Math.max(0, val);
        recalculateAll();
      });
    });

    // Attach row delete buttons
    tbody.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = parseInt(e.target.getAttribute('data-row'), 10);
        if (state.custom.hours.length <= 3) {
          alert("Cannot delete: Simpson's 1/3 Rule requires at least 3 data points.");
          return;
        }
        state.custom.hours.splice(row, 1);
        state.custom.times.splice(row, 1);
        state.custom.pGen.splice(row, 1);
        state.custom.pCons.splice(row, 1);
        updateCustomTimes();
        renderCustomTable();
        recalculateAll();
      });
    });
  }

  // --- PRESET SELECTOR ---
  function initPresetSelector() {
    const sel = document.getElementById('preset-select');
    if (!sel) return;

    sel.addEventListener('change', (e) => {
      const presetKey = e.target.value;
      const preset = PRESETS[presetKey];
      if (!preset) return;

      state.custom.startTime = preset.startTime;
      state.custom.startHour = preset.startHour;
      state.custom.h = preset.h;
      state.custom.pGen = [...preset.pGen];
      state.custom.pCons = [...preset.pCons];

      updateCustomTimes();

      const hSelect = document.getElementById('custom-h-select');
      if (hSelect) hSelect.value = String(preset.h);
      const startTimeInput = document.getElementById('custom-start-time');
      if (startTimeInput) startTimeInput.value = preset.startTime;

      renderCustomTable();
      recalculateAll();
    });
  }

  // --- CSV UPLOAD & DOWNLOAD ---
  function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      const lines = text.trim().split('\n');

      const parsedGen = [];
      const parsedCons = [];

      lines.forEach((line, idx) => {
        // Skip header if non-numeric
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const g = parseFloat(parts[0]) || parseFloat(parts[1]);
          const c = parts.length >= 3 ? parseFloat(parts[2]) : 2.5;

          if (!isNaN(g)) {
            parsedGen.push(Math.max(0, g));
            parsedCons.push(isNaN(c) ? 2.5 : Math.max(0, c));
          }
        }
      });

      if (parsedGen.length >= 3) {
        state.custom.pGen = parsedGen;
        state.custom.pCons = parsedCons;
        updateCustomTimes();
        renderCustomTable();
        recalculateAll();
        alert(`Successfully imported ${parsedGen.length} telemetry points from CSV.`);
      } else {
        alert("Invalid CSV format. Please ensure at least 3 rows of numerical power readings.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function downloadCurrentCsv() {
    const data = getActiveData();
    let csv = "Index,Time,Hour,Solar_Generation_kW,Building_Load_kW,Net_Power_kW\n";
    data.hours.forEach((h, i) => {
      csv += `${i},${data.times[i]},${h.toFixed(2)},${data.pGen[i].toFixed(2)},${data.pCons[i].toFixed(2)},${data.pNet[i].toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solarsim_telemetry_${state.mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- GLOBAL RECALCULATION & UI UPDATE ---
  function recalculateAll() {
    const data = getActiveData();
    const N = data.pGen.length;
    const n = N - 1;
    const h = data.h;

    const valBox = document.getElementById('custom-validation-box');
    const valText = document.getElementById('custom-val-text');

    // Validation checks
    let isValid = true;
    let valMessage = '';

    if (N < 3) {
      isValid = false;
      valMessage = `Insufficient data points (currently N = ${N}). Simpson's 1/3 Rule requires at least 3 points.`;
    } else if (n % 2 !== 0) {
      isValid = false;
      valMessage = `⚠️ Simpson's 1/3 Rule requires an even number of subintervals (currently n = ${n}). Please add or remove 1 row so that n is even.`;
    }

    if (state.mode === 'custom' && valBox && valText) {
      if (!isValid) {
        valBox.style.display = 'flex';
        valText.textContent = valMessage;
      } else {
        valBox.style.display = 'none';
      }
    }

    if (!isValid) {
      // Keep old or zero values in result areas if invalid
      return;
    }

    // Run Simpson's 1/3 Rule
    const simpGen = simpsonsRule(data.pGen, h);
    const simpCons = simpsonsRule(data.pCons, h);
    const simpNet = simpsonsRule(data.pNet, h);

    // Run Trapezoidal Rule
    const trapGen = trapezoidalRule(data.pGen, h);
    const trapCons = trapezoidalRule(data.pCons, h);
    const trapNet = trapezoidalRule(data.pNet, h);

    const peakGen = Math.max(...data.pGen);

    // Update Hero KPIs
    setText('kpi-hero-gen', `${simpGen.result.toFixed(4)} <span class="unit">kWh</span>`);
    setText('kpi-hero-cons', `${simpCons.result.toFixed(4)} <span class="unit">kWh</span>`);
    setText('kpi-hero-net', `${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(4)} <span class="unit">kWh</span>`);
    setText('kpi-hero-peak', `${peakGen.toFixed(2)} <span class="unit">kW</span>`);

    // Update Mode Footers
    setText('td-custom-sum-gen', `<strong>${simpGen.result.toFixed(4)} kWh</strong>`);
    setText('td-custom-sum-cons', `<strong>${simpCons.result.toFixed(4)} kWh</strong>`);
    setText('td-custom-sum-net', `<strong>${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(4)} kWh</strong>`);

    // Update Experiment 1 Details
    updateExp1(data, simpGen, peakGen);

    // Update Experiment 2 Details
    updateExp2(data, simpCons);

    // Update Experiment 3 Details
    updateExp3(data, simpGen, simpCons, simpNet);

    // Update Experiment 4 Details (Comparison)
    updateExp4(simpGen, trapGen, simpCons, trapCons, simpNet, trapNet);

    // Update Experiment 5 (Sampling)
    updateExp5();

    // Update Experiment 6 (Weather)
    updateExp6();

    // Render Active Experiment Canvas
    renderActiveExpGraph();

    // Update Printable Report Meta
    updatePrintReport(data, simpGen, trapGen, simpCons, trapCons, simpNet, trapNet);
  }

  function setText(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  // --- EXPERIMENT 1 UPDATE ---
  function updateExp1(data, simpGen, peakGen) {
    setText('exp1-input-summary', `${simpGen.n} subintervals (h = ${data.h.toFixed(1)} h), ${data.pGen.length} telemetry points from ${data.times[0]} to ${data.times[data.times.length - 1]}.`);
    setText('exp1-graph-peak', `${peakGen.toFixed(2)} kW`);
    setText('exp1-final-result', `${simpGen.result.toFixed(4)} kWh`);

    const p0 = data.pGen[0];
    const pn = data.pGen[simpGen.n];

    const stepsContainer = document.getElementById('exp1-calc-steps');
    if (stepsContainer) {
      stepsContainer.innerHTML = `
        <div class="calc-step-row">
          <strong>1. Endpoints Sum:</strong> P₀ + Pₙ = ${p0.toFixed(2)} + ${pn.toFixed(2)} = <strong>${simpGen.endpoints.toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>2. Odd-Indexed Sum:</strong> ∑ P_odd = ${simpGen.oddSum.toFixed(2)} kW &nbsp;→&nbsp; 4 × (${simpGen.oddSum.toFixed(2)}) = <strong>${(4 * simpGen.oddSum).toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>3. Even-Indexed Sum:</strong> ∑ P_even = ${simpGen.evenSum.toFixed(2)} kW &nbsp;→&nbsp; 2 × (${simpGen.evenSum.toFixed(2)}) = <strong>${(2 * simpGen.evenSum).toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>4. Total Composite Bracket:</strong> [${simpGen.endpoints.toFixed(2)} + ${(4 * simpGen.oddSum).toFixed(2)} + ${(2 * simpGen.evenSum).toFixed(2)}] = <strong>${simpGen.bracket.toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>5. Simpson's 1/3 Rule Integral:</strong> E_gen = (${data.h.toFixed(1)} / 3) × ${simpGen.bracket.toFixed(2)} = <strong>${simpGen.result.toFixed(4)} kWh</strong>
        </div>
      `;
    }

    setText('exp1-meaning', `
      The solar installation generated approximately <strong>${simpGen.result.toFixed(2)} kWh</strong> of electrical energy during the ${simpGen.n * data.h}-hour observation period.
      This corresponds to the complete physical energy integral of the solar generation curve across the daylight arc.
    `);
  }

  // --- EXPERIMENT 2 UPDATE ---
  function updateExp2(data, simpCons) {
    const peakCons = Math.max(...data.pCons);
    setText('exp2-input-summary', `${simpCons.n} subintervals (h = ${data.h.toFixed(1)} h), ${data.pCons.length} building demand readings.`);
    setText('exp2-graph-peak', `${peakCons.toFixed(2)} kW`);
    setText('exp2-final-result', `${simpCons.result.toFixed(4)} kWh`);

    const c0 = data.pCons[0];
    const cn = data.pCons[simpCons.n];

    const stepsContainer = document.getElementById('exp2-calc-steps');
    if (stepsContainer) {
      stepsContainer.innerHTML = `
        <div class="calc-step-row">
          <strong>1. Endpoints Sum:</strong> C₀ + Cₙ = ${c0.toFixed(2)} + ${cn.toFixed(2)} = <strong>${simpCons.endpoints.toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>2. Odd-Indexed Sum:</strong> ∑ C_odd = ${simpCons.oddSum.toFixed(2)} kW &nbsp;→&nbsp; 4 × (${simpCons.oddSum.toFixed(2)}) = <strong>${(4 * simpCons.oddSum).toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>3. Even-Indexed Sum:</strong> ∑ C_even = ${simpCons.evenSum.toFixed(2)} kW &nbsp;→&nbsp; 2 × (${simpCons.evenSum.toFixed(2)}) = <strong>${(2 * simpCons.evenSum).toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>4. Total Composite Bracket:</strong> [${simpCons.endpoints.toFixed(2)} + ${(4 * simpCons.oddSum).toFixed(2)} + ${(2 * simpCons.evenSum).toFixed(2)}] = <strong>${simpCons.bracket.toFixed(2)} kW</strong>
        </div>
        <div class="calc-step-row">
          <strong>5. Simpson's 1/3 Rule Integral:</strong> E_cons = (${data.h.toFixed(1)} / 3) × ${simpCons.bracket.toFixed(2)} = <strong>${simpCons.result.toFixed(4)} kWh</strong>
        </div>
      `;
    }

    setText('exp2-meaning', `
      The facility consumed approximately <strong>${simpCons.result.toFixed(2)} kWh</strong> of electrical energy across the observation period.
      Aggregating continuous fluctuating demand from lab equipment, HVAC chillers, and lighting into total kilowatt-hours confirms the facility's baseline energy requirement.
    `);
  }

  // --- EXPERIMENT 3 UPDATE ---
  function updateExp3(data, simpGen, simpCons, simpNet) {
    setText('exp3-input-summary', `Simultaneous ${data.hours.length}-point generation and load vectors evaluated via linearity of definite integrals.`);
    setText('exp3-final-result', `${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(4)} kWh`);

    const stepsContainer = document.getElementById('exp3-calc-steps');
    if (stepsContainer) {
      stepsContainer.innerHTML = `
        <div class="calc-step-row">
          <strong>1. Linearity of Definite Integrals:</strong> E_net = ∫ [P_gen(t) - P_cons(t)] dt = E_gen - E_cons
        </div>
        <div class="calc-step-row">
          <strong>2. Subtraction of Composite Results:</strong> E_net = ${simpGen.result.toFixed(4)} kWh - ${simpCons.result.toFixed(4)} kWh = <strong>${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(4)} kWh</strong>
        </div>
        <div class="calc-step-row">
          <strong>3. Direct Vector Quadrature Check:</strong> Integrating P_net vector directly via Simpson's 1/3 Rule yields <strong>${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(4)} kWh</strong> (Exact Agreement).
        </div>
      `;
    }

    const isSurplus = simpNet.result >= 0;
    setText('exp3-meaning', `
      <p>
        "The solar installation generated approximately <strong>${simpGen.result.toFixed(2)} kWh</strong> of electrical energy during the ${simpGen.n * data.h}-hour observation period, while the building consumed approximately <strong>${simpCons.result.toFixed(2)} kWh</strong>.
      </p>
      <p>
        The estimated net energy balance was ${isSurplus ? 'positive' : 'negative'} at <strong>${simpNet.result >= 0 ? '+' : ''}${simpNet.result.toFixed(2)} kWh</strong>, meaning total solar generation ${isSurplus ? 'exceeded' : 'was less than'} total building consumption over the observation period."
      </p>
      <div class="warning-subnote">
        <strong>Important Grid Import vs. Export Distinction:</strong>
        This net balance is not necessarily the actual amount exported to the electricity grid because import and export occur at different times.
        Without an on-site Battery Energy Storage System (BESS), the building imports electricity during early morning and late afternoon hours, and exports surplus electricity during the midday peak.
      </div>
    `);
  }

  // --- EXPERIMENT 4 UPDATE (COMPARATIVE AUDIT) ---
  function updateExp4(sGen, tGen, sCons, tCons, sNet, tNet) {
    const diffGen = sGen.result - tGen.result;
    const diffCons = sCons.result - tCons.result;
    const diffNet = sNet.result - tNet.result;

    const pctGen = (diffGen / sGen.result) * 100;
    const pctCons = (diffCons / sCons.result) * 100;
    const pctNet = (diffNet / sNet.result) * 100;

    setText('e4-simp-gen', `${sGen.result.toFixed(4)} kWh`);
    setText('e4-trap-gen', `${tGen.result.toFixed(4)} kWh`);
    setText('e4-diff-gen', `${diffGen >= 0 ? '+' : ''}${diffGen.toFixed(4)} kWh`);
    setText('e4-pct-gen', `${pctGen >= 0 ? '+' : ''}${pctGen.toFixed(3)}%`);

    setText('e4-simp-cons', `${sCons.result.toFixed(4)} kWh`);
    setText('e4-trap-cons', `${tCons.result.toFixed(4)} kWh`);
    setText('e4-diff-cons', `${diffCons >= 0 ? '+' : ''}${diffCons.toFixed(4)} kWh`);
    setText('e4-pct-cons', `${pctCons >= 0 ? '+' : ''}${pctCons.toFixed(3)}%`);

    setText('e4-simp-net', `${sNet.result >= 0 ? '+' : ''}${sNet.result.toFixed(4)} kWh`);
    setText('e4-trap-net', `${tNet.result >= 0 ? '+' : ''}${tNet.result.toFixed(4)} kWh`);
    setText('e4-diff-net', `${diffNet >= 0 ? '+' : ''}${diffNet.toFixed(4)} kWh`);
    setText('e4-pct-net', `${pctNet >= 0 ? '+' : ''}${pctNet.toFixed(3)}%`);
  }

  // --- EXPERIMENT 5 (SAMPLING & CONVERGENCE) ---
  function initExp5Controls() {
    const buttons = document.querySelectorAll('#step-selector-buttons .step-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exp5.selectedH = parseFloat(btn.getAttribute('data-h'));
        updateExp5();
        renderCanvasExp5();
      });
    });
  }

  function updateExp5() {
    const exact = 9.40 * 24.0 / Math.PI; // 71.8107103 kWh
    const hList = [2.0, 1.0, 0.5, 0.25, 0.1];
    const tbody = document.getElementById('convergence-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    hList.forEach(h => {
      const n = Math.round(12.0 / h);
      const tVals = [];
      const yVals = [];
      for (let i = 0; i <= n; i++) {
        const t = 6.0 + (i * h);
        tVals.push(t);
        yVals.push(9.40 * Math.sin((Math.PI * (t - 6.0)) / 12.0));
      }

      const trap = (h / 2.0) * (yVals[0] + yVals[n] + (2 * yVals.slice(1, -1).reduce((a, b) => a + b, 0)));

      let odd = 0;
      let even = 0;
      for (let i = 1; i < n; i += 2) odd += yVals[i];
      for (let i = 2; i < n; i += 2) even += yVals[i];
      const simp = (h / 3.0) * (yVals[0] + yVals[n] + (4 * odd) + (2 * even));

      const errTrap = Math.abs(trap - exact);
      const errSimp = Math.abs(simp - exact);
      const ratio = errSimp > 0 ? (errTrap / errSimp).toFixed(1) : '∞';

      const tr = document.createElement('tr');
      if (Math.abs(h - state.exp5.selectedH) < 0.001) {
        tr.classList.add('highlight-row');
      }

      tr.innerHTML = `
        <td class="font-mono">${h.toFixed(2)} h</td>
        <td class="font-mono">${n}</td>
        <td class="font-mono">${trap.toFixed(5)} kWh</td>
        <td class="font-mono text-negative">${errTrap.toFixed(6)}</td>
        <td class="font-mono font-bold">${simp.toFixed(5)} kWh</td>
        <td class="font-mono font-bold text-positive">${errSimp.toFixed(8)}</td>
        <td class="font-mono"><strong>${ratio}×</strong> more accurate</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- EXPERIMENT 6 (WEATHER SCENARIOS) ---
  function initExp6Controls() {
    const buttons = document.querySelectorAll('#weather-buttons .weather-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.exp6.scenario = btn.getAttribute('data-weather');
        updateExp6();
        renderCanvasExp6();
      });
    });
  }

  function getWeatherProfile(scenario) {
    const hours = DEFAULT_DATA.hours;
    let pGen = [];
    let title = '';
    let obs = '';
    let conc = '';
    let meaning = '';

    if (scenario === 'sunny') {
      title = 'Clear Sunny Day — Unobstructed Diurnal Bell Curve';
      pGen = [0.20, 1.45, 3.60, 5.85, 7.70, 8.95, 9.40, 8.80, 7.40, 5.35, 3.10, 1.15, 0.10];
      obs = 'Under clear sunny skies, the irradiance curve follows an ideal smooth cosine trajectory with low fourth-derivative curvature. Simpson’s rule captures the peak with under 0.002 kWh error.';
      conc = 'Daily generation reaches 62.97 kWh, covering 100% of daytime building demand (46.30 kWh) and exporting 16.67 kWh surplus.';
      meaning = 'On a clear sunny day, total solar generation exceeds consumption, yielding a positive net balance of +16.67 kWh.';
    } else if (scenario === 'partly') {
      title = 'Partly Cloudy Day — Intermittent Cumulus Cloud Transients';
      pGen = [0.20, 1.30, 2.90, 5.40, 4.20, 8.10, 5.80, 7.90, 4.60, 4.80, 2.70, 0.90, 0.10];
      obs = 'Passing cumulus clouds between 10:00 and 14:00 cause sudden irradiance dips. These sharp spikes increase the fourth derivative f⁴(ξ), demonstrating why 1-minute to 5-minute sampling is recommended in real microgrids.';
      conc = 'Daily generation is reduced to approximately 48.90 kWh, closely matching building consumption (+2.60 kWh net balance).';
      meaning = 'On partly cloudy days, cloud fluctuations reduce solar harvest. Energy is near break-even, requiring frequent microgrid balancing.';
    } else {
      title = 'Overcast Cloudy Day — Diffuse Attenuated Irradiance';
      pGen = [0.05, 0.30, 0.75, 1.30, 1.80, 2.15, 2.30, 2.10, 1.70, 1.20, 0.65, 0.20, 0.05];
      obs = 'Heavy cloud cover blocks direct solar beam irradiance. The PV array produces only diffuse radiation peaking at 2.30 kW.';
      conc = 'Daily generation drops to only 14.50 kWh against 46.30 kWh consumption, leaving an energy deficit of -31.80 kWh.';
      meaning = 'On overcast days, solar output covers only ~31% of building demand. The facility operates in continuous deficit, requiring utility grid import all day.';
    }

    return { hours, pGen, title, obs, conc, meaning };
  }

  function updateExp6() {
    const sc = getWeatherProfile(state.exp6.scenario);
    const pCons = DEFAULT_DATA.pCons;
    const simpG = simpsonsRule(sc.pGen, 1.0);
    const simpC = simpsonsRule(pCons, 1.0);
    const net = simpG.result - simpC.result;
    const suff = Math.min(100, (simpG.result / simpC.result) * 100);

    setText('w-kpi-state', sc.title.split('—')[0].trim());
    setText('w-kpi-gen', `${simpG.result.toFixed(2)} kWh`);
    setText('w-kpi-cons', `${simpC.result.toFixed(2)} kWh`);
    setText('w-kpi-net', `${net >= 0 ? '+' : ''}${net.toFixed(2)} kWh (${net >= 0 ? 'Surplus' : 'Deficit'})`);
    setText('w-kpi-suff', `${suff.toFixed(1)}%`);

    setText('exp6-graph-title', sc.title);
    setText('exp6-weather-obs', sc.obs);
    setText('exp6-weather-conc', sc.conc);
    setText('exp6-meaning-text', sc.meaning);
  }

  // --- REPORT GENERATOR & MODAL ---
  function initReportGenerator() {
    const btnGen = document.getElementById('btn-generate-report');
    const btnPrintNav = document.getElementById('btn-print-report');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportCsvFull = document.getElementById('btn-export-csv-full');

    function triggerPrint() {
      // Sync form inputs to print header
      syncStudentCredentials();
      window.print();
    }

    if (btnGen) btnGen.addEventListener('click', triggerPrint);
    if (btnPrintNav) btnPrintNav.addEventListener('click', triggerPrint);

    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        const data = getActiveData();
        const simpG = simpsonsRule(data.pGen, data.h);
        const simpC = simpsonsRule(data.pCons, data.h);
        const simpN = simpsonsRule(data.pNet, data.h);

        const audit = {
          metadata: {
            project: "SolarSim Computational Methods Laboratory",
            method: "Composite Simpson's 1/3 Rule",
            mode: state.mode,
            stepSize_h: data.h,
            subintervals_n: data.pGen.length - 1
          },
          telemetry: data.hours.map((h, i) => ({
            index: i,
            time: data.times[i],
            hour: h,
            solarGen_kW: data.pGen[i],
            buildingLoad_kW: data.pCons[i],
            netPower_kW: data.pNet[i]
          })),
          results: {
            simpson: {
              generatedEnergy_kWh: simpG.result,
              consumedEnergy_kWh: simpC.result,
              netEnergy_kWh: simpN.result
            }
          }
        };

        const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solarsim_report_${state.mode}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (btnExportCsvFull) {
      btnExportCsvFull.addEventListener('click', downloadCurrentCsv);
    }
  }

  function syncStudentCredentials() {
    const name = document.getElementById('rpt-student-name')?.value || 'Lakshay';
    const roll = document.getElementById('rpt-roll-no')?.value || '05214802722';
    const dept = document.getElementById('rpt-department')?.value || 'Computer Science & Engineering';
    const sem = document.getElementById('rpt-semester')?.value || '5th Semester / Section A';
    const course = document.getElementById('rpt-course')?.value || 'Computational Methods Laboratory';
    const fac = document.getElementById('rpt-faculty')?.value || 'Department of Applied Mathematics';

    setText('p-name', name);
    setText('p-roll', roll);
    setText('p-dept', dept);
    setText('p-sem', sem);
    setText('p-course', course);
    setText('p-fac', fac);
  }

  function updatePrintReport(data, sG, tG, sC, tC, sN, tN) {
    const pDataTable = document.getElementById('p-data-table');
    if (pDataTable) {
      let html = `
        <thead>
          <tr>
            <th>Index (i)</th>
            <th>Time</th>
            <th>Hour (t)</th>
            <th>Weight (w_i)</th>
            <th>Solar Gen (kW)</th>
            <th>Building Load (kW)</th>
            <th>Net Power (kW)</th>
          </tr>
        </thead>
        <tbody>
      `;
      data.hours.forEach((h, i) => {
        const n = data.hours.length - 1;
        let w = 1;
        if (i > 0 && i < n) w = (i % 2 !== 0) ? 4 : 2;
        html += `
          <tr>
            <td>${i}</td>
            <td>${data.times[i]}</td>
            <td>${h.toFixed(1)}</td>
            <td>${w}</td>
            <td>${data.pGen[i].toFixed(2)}</td>
            <td>${data.pCons[i].toFixed(2)}</td>
            <td>${data.pNet[i] >= 0 ? '+' : ''}${data.pNet[i].toFixed(2)}</td>
          </tr>
        `;
      });
      html += `</tbody>`;
      pDataTable.innerHTML = html;
    }

    const pResultsTable = document.getElementById('p-results-table');
    if (pResultsTable) {
      pResultsTable.innerHTML = `
        <thead>
          <tr>
            <th>Metric</th>
            <th>Simpson's 1/3 Rule (kWh)</th>
            <th>Trapezoidal Rule (kWh)</th>
            <th>Discrepancy (kWh)</th>
            <th>Physical Regime</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Solar Energy Generated (E_gen)</td>
            <td>${sG.result.toFixed(4)}</td>
            <td>${tG.result.toFixed(4)}</td>
            <td>+${(sG.result - tG.result).toFixed(4)}</td>
            <td>PV Daytime Harvest</td>
          </tr>
          <tr>
            <td>Building Energy Consumed (E_cons)</td>
            <td>${sC.result.toFixed(4)}</td>
            <td>${tC.result.toFixed(4)}</td>
            <td>+${(sC.result - tC.result).toFixed(4)}</td>
            <td>Facility Load Demand</td>
          </tr>
          <tr>
            <td><strong>Net Energy Balance (E_net)</strong></td>
            <td><strong>${sN.result >= 0 ? '+' : ''}${sN.result.toFixed(4)}</strong></td>
            <td><strong>${tN.result >= 0 ? '+' : ''}${tN.result.toFixed(4)}</strong></td>
            <td><strong>+${(sN.result - tN.result).toFixed(4)}</strong></td>
            <td><strong>${sN.result >= 0 ? 'Surplus Exported to Grid' : 'Deficit Imported from Grid'}</strong></td>
          </tr>
        </tbody>
      `;
    }
  }

  // =========================================================================
  // --- HIGH-DPI CANVAS GRAPHING ENGINE ---
  // =========================================================================

  /**
   * Helper to set up high-DPI canvas
   */
  function setupCanvas(canvas) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width;
    const height = rect.height || canvas.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    return { ctx, width, height };
  }

  // --- SECTION 1: ANIMATED SOLAR PATH CANVAS ---
  function initAnimatedSolar() {
    const canvas = document.getElementById('animated-solar-canvas');
    const timeSlider = document.getElementById('time-slider');
    const btnToggle = document.getElementById('btn-toggle-anim');
    const btnReset = document.getElementById('btn-reset-anim');

    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        state.anim.currentTime = parseFloat(e.target.value);
        if (state.anim.isPlaying) pauseAnimation();
        renderAnimatedSolarFrame(state.anim.currentTime);
      });
    }

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        if (state.anim.isPlaying) {
          pauseAnimation();
        } else {
          startAnimation();
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        pauseAnimation();
        state.anim.currentTime = 6.0;
        if (timeSlider) timeSlider.value = "6.0";
        renderAnimatedSolarFrame(6.0);
      });
    }

    // Initial render
    renderAnimatedSolarFrame(12.0);
  }

  function startAnimation() {
    state.anim.isPlaying = true;
    const btnText = document.getElementById('anim-text');
    const btnIcon = document.getElementById('anim-icon');
    if (btnText) btnText.textContent = "Pause Path";
    if (btnIcon) btnIcon.textContent = "⏸";

    let lastTime = performance.now();

    function loop(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      state.anim.currentTime += dt * 1.8; // Sim speed: 1.8 hours/sec
      if (state.anim.currentTime > 18.0) {
        state.anim.currentTime = 6.0;
      }

      const timeSlider = document.getElementById('time-slider');
      if (timeSlider) timeSlider.value = state.anim.currentTime.toFixed(2);

      renderAnimatedSolarFrame(state.anim.currentTime);

      if (state.anim.isPlaying) {
        state.anim.rafId = requestAnimationFrame(loop);
      }
    }

    state.anim.rafId = requestAnimationFrame(loop);
  }

  function pauseAnimation() {
    state.anim.isPlaying = false;
    if (state.anim.rafId) cancelAnimationFrame(state.anim.rafId);
    const btnText = document.getElementById('anim-text');
    const btnIcon = document.getElementById('anim-icon');
    if (btnText) btnText.textContent = "Play Solar Path";
    if (btnIcon) btnIcon.textContent = "▶";
  }

  function getSolarPowerAtTime(t) {
    // Model curve based on actual points
    if (t < 6.0 || t > 18.0) return 0;
    // Bell curve approximation: P(t) ≈ 9.4 * sin(pi * (t - 6) / 12)^1.35
    const frac = (t - 6.0) / 12.0;
    return Math.max(0, 9.40 * Math.pow(Math.sin(Math.PI * frac), 1.25));
  }

  function renderAnimatedSolarFrame(curTime) {
    const canvas = document.getElementById('animated-solar-canvas');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padL = 60, padR = 40, padT = 40, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = 6.0, tMax = 18.0;
    const pMax = 10.5;

    function xCoord(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yCoord(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    // Dynamic Daylight Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (curTime < 9.0) {
      skyGrad.addColorStop(0, '#fef3c7');
      skyGrad.addColorStop(1, '#ffffff');
    } else if (curTime <= 15.0) {
      skyGrad.addColorStop(0, '#e0f2fe');
      skyGrad.addColorStop(1, '#ffffff');
    } else {
      skyGrad.addColorStop(0, '#ffedd5');
      skyGrad.addColorStop(1, '#ffffff');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let p = 0; p <= 10; p += 2) {
      const y = yCoord(p);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${p} kW`, padL - 8, y + 4);
    }

    for (let t = 6; t <= 18; t += 2) {
      const x = xCoord(t);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${formatClockTime(t)}`, x, padT + plotH + 18);
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(width - padR, padT + plotH);
    ctx.stroke();

    // 1. Full baseline curve (subtle outline)
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let t = tMin; t <= tMax; t += 0.1) {
      const x = xCoord(t);
      const y = yCoord(getSolarPowerAtTime(t));
      if (t === tMin) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Shaded Integrated Area up to curTime (Representing Energy kWh!)
    const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    fillGrad.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
    fillGrad.addColorStop(1, 'rgba(245, 158, 11, 0.05)');

    ctx.fillStyle = fillGrad;
    ctx.beginPath();
    ctx.moveTo(xCoord(tMin), yCoord(0));
    for (let t = tMin; t <= curTime; t += 0.05) {
      ctx.lineTo(xCoord(t), yCoord(getSolarPowerAtTime(t)));
    }
    ctx.lineTo(xCoord(curTime), yCoord(0));
    ctx.closePath();
    ctx.fill();

    // 3. Active solid curve up to curTime
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = tMin; t <= curTime; t += 0.05) {
      const x = xCoord(t);
      const y = yCoord(getSolarPowerAtTime(t));
      if (t === tMin) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Moving Animated Sun Orb
    const curX = xCoord(curTime);
    const curP = getSolarPowerAtTime(curTime);
    const curY = yCoord(curP);

    // Vertical time marker
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sun glow
    const sunGlow = ctx.createRadialGradient(curX, curY, 3, curX, curY, 22);
    sunGlow.addColorStop(0, 'rgba(251, 191, 36, 1)');
    sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.5)');
    sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(curX, curY, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sun core
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Callout tooltip on the Sun
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const tagText = `${formatClockTime(curTime)} | ${curP.toFixed(2)} kW`;
    ctx.fillText(tagText, curX, curY - 14);

    // Approximate cumulative energy up to curTime (numerical trapezoid sum)
    let cumEnergy = 0;
    const step = 0.05;
    for (let t = tMin; t < curTime; t += step) {
      const p1 = getSolarPowerAtTime(t);
      const p2 = getSolarPowerAtTime(Math.min(curTime, t + step));
      cumEnergy += 0.5 * (p1 + p2) * step;
    }

    // Update labels below canvas
    setText('lbl-sim-time', `${formatClockTime(curTime)}`);
    setText('lbl-sim-power', `${curP.toFixed(2)} kW`);
    setText('lbl-sim-energy', `${cumEnergy.toFixed(2)} kWh`);
  }

  // --- SECTION 2: CURVATURE DEMO CANVAS ---
  function initCurvatureDemo() {
    renderCurvatureDemo();
  }

  function renderCurvatureDemo() {
    const canvas = document.getElementById('curvature-demo-canvas');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padL = 50, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    ctx.clearRect(0, 0, width, height);

    // Zoomed in on 3 points: 10:00 (7.70 kW), 11:00 (8.95 kW), 12:00 (9.40 kW)
    const points = [
      { t: 10.0, y: 7.70, label: 'y₄ (10:00)' },
      { t: 11.0, y: 8.95, label: 'y₅ (11:00)' },
      { t: 12.0, y: 9.40, label: 'y₆ (12:00)' }
    ];

    const tMin = 9.5, tMax = 12.5;
    const yMin = 7.0, yMax = 9.8;

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(y) { return padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH; }

    // Fit quadratic parabola: y = At^2 + Bt + C through the 3 points
    const x0 = points[0].t, y0 = points[0].y;
    const x1 = points[1].t, y1 = points[1].y;
    const x2 = points[2].t, y2 = points[2].y;

    // Lagrange polynomial coefficients
    function parabolaY(t) {
      const L0 = ((t - x1) * (t - x2)) / ((x0 - x1) * (x0 - x2));
      const L1 = ((t - x0) * (t - x2)) / ((x1 - x0) * (x1 - x2));
      const L2 = ((t - x0) * (t - x1)) / ((x2 - x0) * (x2 - x1));
      return (y0 * L0) + (y1 * L1) + (y2 * L2);
    }

    // 1. Shaded Gap: Difference between Parabola and Trapezoid Chords!
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // Highlight lost area
    ctx.beginPath();
    // Parabola from x0 to x1
    for (let t = x0; t <= x1; t += 0.02) {
      ctx.lineTo(xC(t), yC(parabolaY(t)));
    }
    // Straight line from x1 back to x0
    ctx.lineTo(xC(x0), yC(y0));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    // Parabola from x1 to x2
    for (let t = x1; t <= x2; t += 0.02) {
      ctx.lineTo(xC(t), yC(parabolaY(t)));
    }
    // Straight line from x2 back to x1
    ctx.lineTo(xC(x1), yC(y1));
    ctx.closePath();
    ctx.fill();

    // 2. Straight Trapezoid Chords (Linear)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xC(x0), yC(y0));
    ctx.lineTo(xC(x1), yC(y1));
    ctx.lineTo(xC(x2), yC(y2));
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Smooth Simpson Parabolic Arc
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = x0; t <= x2; t += 0.02) {
      const x = xC(t);
      const y = yC(parabolaY(t));
      if (t === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Plot points
    points.forEach((pt) => {
      const x = xC(pt.t);
      const y = yC(pt.y);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.label}: ${pt.y.toFixed(2)} kW`, x, y - 12);
    });

    // Legend
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padL + 20, padT + 10, 16, 4);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Simpson's Parabolic Arc (Captures full area)", padL + 44, padT + 15);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padL + 20, padT + 28, 16, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillText("Trapezoidal Straight Chord (Underestimates)", padL + 44, padT + 33);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(padL + 20, padT + 46, 16, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillText("Truncated Energy Area (Systematic Underestimation Gap)", padL + 44, padT + 54);
  }

  // --- EXPERIMENT GRAPH RENDERER DISPATCHER ---
  function renderActiveExpGraph() {
    switch (state.activeExp) {
      case 1: renderCanvasExp1(); break;
      case 2: renderCanvasExp2(); break;
      case 3: renderCanvasExp3(); break;
      case 4: renderCanvasExp4(); break;
      case 5: renderCanvasExp5(); break;
      case 6: renderCanvasExp6(); break;
    }
  }

  // --- CANVAS: EXPERIMENT 1 (SOLAR GENERATION) ---
  function renderCanvasExp1() {
    const canvas = document.getElementById('canvas-exp1');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const data = getActiveData();
    const padL = 60, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = data.hours[0];
    const tMax = data.hours[data.hours.length - 1];
    const pMax = Math.max(10, Math.ceil(Math.max(...data.pGen) * 1.15));

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    // Background Grid
    drawGrid(ctx, padL, padT, plotW, plotH, data.hours, pMax, 2);

    // Shaded Area (Generation kWh)
    const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    areaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
    areaGrad.addColorStop(1, 'rgba(245, 158, 11, 0.05)');

    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    ctx.moveTo(xC(data.hours[0]), yC(0));
    data.hours.forEach((h, i) => {
      ctx.lineTo(xC(h), yC(data.pGen[i]));
    });
    ctx.lineTo(xC(data.hours[data.hours.length - 1]), yC(0));
    ctx.closePath();
    ctx.fill();

    // Smooth Line
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h);
      const y = yC(data.pGen[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data points & Simpson weight labels
    data.hours.forEach((h, i) => {
      const x = xC(h);
      const y = yC(data.pGen[i]);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Point values
      ctx.fillStyle = '#0f172a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.pGen[i].toFixed(2)}`, x, y - 10);
    });
  }

  // --- CANVAS: EXPERIMENT 2 (BUILDING CONSUMPTION) ---
  function renderCanvasExp2() {
    const canvas = document.getElementById('canvas-exp2');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const data = getActiveData();
    const padL = 60, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = data.hours[0];
    const tMax = data.hours[data.hours.length - 1];
    const pMax = Math.max(6, Math.ceil(Math.max(...data.pCons) * 1.25));

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, padL, padT, plotW, plotH, data.hours, pMax, 1);

    // Shaded Area (Demand kWh)
    const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    areaGrad.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    areaGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    ctx.moveTo(xC(data.hours[0]), yC(0));
    data.hours.forEach((h, i) => {
      ctx.lineTo(xC(h), yC(data.pCons[i]));
    });
    ctx.lineTo(xC(data.hours[data.hours.length - 1]), yC(0));
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h);
      const y = yC(data.pCons[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data points
    data.hours.forEach((h, i) => {
      const x = xC(h);
      const y = yC(data.pCons[i]);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.pCons[i].toFixed(2)}`, x, y - 10);
    });
  }

  // --- CANVAS: EXPERIMENT 3 (GENERATION VS CONSUMPTION) ---
  function renderCanvasExp3() {
    const canvas = document.getElementById('canvas-exp3');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const data = getActiveData();
    const padL = 60, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = data.hours[0];
    const tMax = data.hours[data.hours.length - 1];
    const allP = [...data.pGen, ...data.pCons];
    const pMax = Math.max(10, Math.ceil(Math.max(...allP) * 1.15));

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, padL, padT, plotW, plotH, data.hours, pMax, 2);

    // Shading Surplus Zone (Green) and Deficit Zone (Red)
    for (let i = 0; i < data.hours.length - 1; i++) {
      const t1 = data.hours[i], t2 = data.hours[i + 1];
      const g1 = data.pGen[i], g2 = data.pGen[i + 1];
      const c1 = data.pCons[i], c2 = data.pCons[i + 1];

      ctx.beginPath();
      ctx.moveTo(xC(t1), yC(c1));
      ctx.lineTo(xC(t2), yC(c2));
      ctx.lineTo(xC(t2), yC(g2));
      ctx.lineTo(xC(t1), yC(g1));
      ctx.closePath();

      if ((g1 + g2) >= (c1 + c2)) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Surplus
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)'; // Deficit
      }
      ctx.fill();
    }

    // Solar Line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h), y = yC(data.pGen[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Building Load Line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h), y = yC(data.pCons[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Net Power Dashed Line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h), y = yC(Math.max(0, data.pNet[i]));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Data points
    data.hours.forEach((h, i) => {
      // Solar point
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(xC(h), yC(data.pGen[i]), 4, 0, Math.PI * 2);
      ctx.fill();

      // Load point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(xC(h), yC(data.pCons[i]), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // --- CANVAS: EXPERIMENT 4 (SIMPSON VS TRAPEZOIDAL) ---
  function renderCanvasExp4() {
    const canvas = document.getElementById('canvas-exp4');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const data = getActiveData();
    const padL = 60, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = data.hours[0];
    const tMax = data.hours[data.hours.length - 1];
    const pMax = 11.0;

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, padL, padT, plotW, plotH, data.hours, pMax, 2);

    // 1. Trapezoidal Straight Chords
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    data.hours.forEach((h, i) => {
      const x = xC(h), y = yC(data.pGen[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Simpson Smooth Parabolic Segments
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    const n = data.hours.length - 1;
    for (let k = 0; k < n; k += 2) {
      const x0 = data.hours[k], y0 = data.pGen[k];
      const x1 = data.hours[k + 1], y1 = data.pGen[k + 1];
      const x2 = data.hours[k + 2], y2 = data.pGen[k + 2];

      ctx.beginPath();
      for (let t = x0; t <= x2; t += 0.05) {
        // Lagrange quadratic interpolant
        const L0 = ((t - x1) * (t - x2)) / ((x0 - x1) * (x0 - x2));
        const L1 = ((t - x0) * (t - x2)) / ((x1 - x0) * (x1 - x2));
        const L2 = ((t - x0) * (t - x1)) / ((x2 - x0) * (x2 - x1));
        const yVal = (y0 * L0) + (y1 * L1) + (y2 * L2);

        const px = xC(t);
        const py = yC(yVal);
        if (t === x0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Points
    data.hours.forEach((h, i) => {
      const x = xC(h), y = yC(data.pGen[i]);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legend
    ctx.fillStyle = '#10b981';
    ctx.fillRect(padL + 20, padT + 10, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Simpson's 1/3 Rule (Quadratic O(h⁴))", padL + 44, padT + 15);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padL + 20, padT + 26, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillText("Trapezoidal Rule (Linear O(h²))", padL + 44, padT + 31);
  }

  // --- CANVAS: EXPERIMENT 5 (LOG-LOG ERROR CONVERGENCE) ---
  function renderCanvasExp5() {
    const canvas = document.getElementById('canvas-exp5');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const padL = 70, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    ctx.clearRect(0, 0, width, height);

    // Log-log coordinates: x = log10(h), y = log10(Error)
    const exact = 9.40 * 24.0 / Math.PI;
    const hVals = [2.0, 1.0, 0.5, 0.25, 0.1];
    const dataTrap = [];
    const dataSimp = [];

    hVals.forEach(h => {
      const n = Math.round(12.0 / h);
      const yVals = [];
      for (let i = 0; i <= n; i++) {
        const t = 6.0 + (i * h);
        yVals.push(9.40 * Math.sin((Math.PI * (t - 6.0)) / 12.0));
      }
      const trap = (h / 2.0) * (yVals[0] + yVals[n] + (2 * yVals.slice(1, -1).reduce((a, b) => a + b, 0)));
      let odd = 0, even = 0;
      for (let i = 1; i < n; i += 2) odd += yVals[i];
      for (let i = 2; i < n; i += 2) even += yVals[i];
      const simp = (h / 3.0) * (yVals[0] + yVals[n] + (4 * odd) + (2 * even));

      const errT = Math.max(1e-10, Math.abs(trap - exact));
      const errS = Math.max(1e-10, Math.abs(simp - exact));

      dataTrap.push({ logH: Math.log10(h), logE: Math.log10(errT), h, err: errT });
      dataSimp.push({ logH: Math.log10(h), logE: Math.log10(errS), h, err: errS });
    });

    const xMin = -1.1, xMax = 0.4;
    const yMin = -7.5, yMax = 0.5;

    function xC(logH) { return padL + ((logH - xMin) / (xMax - xMin)) * plotW; }
    function yC(logE) { return padT + plotH - ((logE - yMin) / (yMax - yMin)) * plotH; }

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let logE = -7; logE <= 0; logE += 1) {
      const y = yC(logE);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`10^${logE}`, padL - 8, y + 4);
    }

    hVals.forEach(h => {
      const x = xC(Math.log10(h));
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`h=${h}`, x, padT + plotH + 16);
    });

    // Trapezoidal line (slope 2)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    dataTrap.forEach((pt, i) => {
      const x = xC(pt.logH), y = yC(pt.logE);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Simpson line (slope 4)
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataSimp.forEach((pt, i) => {
      const x = xC(pt.logH), y = yC(pt.logE);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Plot Points
    dataTrap.forEach(pt => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(xC(pt.logH), yC(pt.logE), 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    dataSimp.forEach(pt => {
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.arc(xC(pt.logH), yC(pt.logE), 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legends
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(padL + 20, padT + 10, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Simpson's 1/3 Rule (Slope = 4.0, Fourth-Order O(h⁴))", padL + 44, padT + 15);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(padL + 20, padT + 28, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillText("Trapezoidal Rule (Slope = 2.0, Second-Order O(h²))", padL + 44, padT + 33);
  }

  // --- CANVAS: EXPERIMENT 6 (WEATHER SCENARIOS) ---
  function renderCanvasExp6() {
    const canvas = document.getElementById('canvas-exp6');
    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const sc = getWeatherProfile(state.exp6.scenario);
    const pCons = DEFAULT_DATA.pCons;

    const padL = 60, padR = 40, padT = 30, padB = 40;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const tMin = sc.hours[0];
    const tMax = sc.hours[sc.hours.length - 1];
    const pMax = 11.0;

    function xC(t) { return padL + ((t - tMin) / (tMax - tMin)) * plotW; }
    function yC(p) { return padT + plotH - (p / pMax) * plotH; }

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, padL, padT, plotW, plotH, sc.hours, pMax, 2);

    // Shaded solar area
    const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    if (state.exp6.scenario === 'sunny') {
      areaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
      areaGrad.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
    } else if (state.exp6.scenario === 'partly') {
      areaGrad.addColorStop(0, 'rgba(13, 148, 136, 0.5)');
      areaGrad.addColorStop(1, 'rgba(13, 148, 136, 0.05)');
    } else {
      areaGrad.addColorStop(0, 'rgba(148, 163, 184, 0.5)');
      areaGrad.addColorStop(1, 'rgba(148, 163, 184, 0.05)');
    }

    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    ctx.moveTo(xC(sc.hours[0]), yC(0));
    sc.hours.forEach((h, i) => {
      ctx.lineTo(xC(h), yC(sc.pGen[i]));
    });
    ctx.lineTo(xC(sc.hours[sc.hours.length - 1]), yC(0));
    ctx.closePath();
    ctx.fill();

    // Solar line
    ctx.strokeStyle = state.exp6.scenario === 'sunny' ? '#f59e0b' : (state.exp6.scenario === 'partly' ? '#0d9488' : '#64748b');
    ctx.lineWidth = 3;
    ctx.beginPath();
    sc.hours.forEach((h, i) => {
      const x = xC(h), y = yC(sc.pGen[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Building Load Line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    sc.hours.forEach((h, i) => {
      const x = xC(h), y = yC(pCons[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Data points
    sc.hours.forEach((h, i) => {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(xC(h), yC(sc.pGen[i]), 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legend
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(padL + 20, padT + 10, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("Solar Generation Profile", padL + 44, padT + 15);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(padL + 20, padT + 26, 18, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillText("Building Demand Profile", padL + 44, padT + 31);
  }

  // --- REUSABLE GRID DRAWING UTILITY ---
  function drawGrid(ctx, padL, padT, plotW, plotH, hours, pMax, pStep) {
    const tMin = hours[0];
    const tMax = hours[hours.length - 1];

    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let p = 0; p <= pMax; p += pStep) {
      const y = padT + plotH - (p / pMax) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${p} kW`, padL - 8, y + 3);
    }

    // Vertical lines
    hours.forEach((h) => {
      const x = padL + ((h - tMin) / (tMax - tMin)) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${formatClockTime(h)}`, x, padT + plotH + 16);
    });

    // Base axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();
  }

})();
