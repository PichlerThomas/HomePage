/**
 * Creator Mode - Standalone Version (Works on Any Page)
 * 
 * This version can be injected into any webpage, including the original ceruleancircle.com
 * 
 * Usage:
 * 1. Copy the entire content of this file
 * 2. Open browser console (F12)
 * 3. Paste and press Enter
 * 
 * Or use as bookmarklet (see creator-mode-bookmarklet.js)
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.creatorMode && window.creatorMode.isEnabled) {
    console.log('Creator Mode already loaded');
    return;
  }

  // Coordinate prefix: 'L' for Local, 'R' for Remote
  // Can be set via: window.creatorModePrefix = 'R' before loading
  // Default to 'R' for remote (external sites)
  const COORD_PREFIX = (window.creatorModePrefix || 'R').toUpperCase();
  
  let gridEnabled = false;
  let gridOverlay = null;
  const GRID_SIZE = 100; // pixels per grid cell
  const GRID_COLS = 12; // A-L (12 columns)
  let gridRows = 20; // Will be calculated dynamically

  function getDocumentHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  function calculateGridRows() {
    const docHeight = getDocumentHeight();
    return Math.ceil(docHeight / GRID_SIZE);
  }

  function createGridOverlay() {
    // Remove existing overlay if it exists
    if (gridOverlay) {
      gridOverlay.remove();
      gridOverlay = null;
    }

    // Calculate rows needed for full document height
    gridRows = calculateGridRows();
    const docHeight = getDocumentHeight();
    const viewportWidth = window.innerWidth;

    const overlay = document.createElement('div');
    overlay.id = 'creator-grid-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: ${docHeight}px;
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;

    // Create grid cells
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = document.createElement('div');
        const colLabel = String.fromCharCode(65 + col); // A-L
        const rowLabel = row.toString();
        const coord = `${colLabel}${rowLabel}`;
        const prefixedCoord = `${COORD_PREFIX}${coord}`; // LA1, RA1, etc.
        
        cell.className = 'grid-cell';
        cell.dataset.coord = coord; // Store base coord for internal use
        cell.dataset.prefixedCoord = prefixedCoord; // Store prefixed coord
        cell.style.cssText = `
          position: absolute;
          top: ${row * GRID_SIZE}px;
          left: ${col * (viewportWidth / GRID_COLS)}px;
          width: ${viewportWidth / GRID_COLS}px;
          height: ${GRID_SIZE}px;
          border: 1px solid rgba(5, 181, 250, 0.3);
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 2px;
        `;

        // Add coordinate label with prefix
        const label = document.createElement('span');
        label.textContent = prefixedCoord; // Show LA1, RA1, etc.
        label.style.cssText = `
          font-size: 10px;
          color: rgba(5, 181, 250, 0.6);
          background: rgba(255, 255, 255, 0.8);
          padding: 1px 3px;
          border-radius: 2px;
          font-family: monospace;
          font-weight: bold;
        `;
        cell.appendChild(label);
        overlay.appendChild(cell);
      }
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  function updateGridDimensions() {
    if (gridOverlay && gridEnabled) {
      const wasEnabled = gridEnabled;
      gridEnabled = false; // Temporarily disable to recreate
      createGridOverlay();
      if (wasEnabled) {
        gridEnabled = true;
        gridOverlay.style.display = 'block';
      }
    }
  }

  function createToggleButton() {
    // Remove existing button if any
    const existing = document.getElementById('creator-mode-toggle');
    if (existing) existing.remove();

    const button = document.createElement('button');
    button.id = 'creator-mode-toggle';
    button.textContent = 'G';
    button.title = 'Toggle Creator Mode Grid (Press G)';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgb(5, 181, 250);
      color: white;
      border: 2px solid white;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    button.addEventListener('click', toggleGrid);
    document.body.appendChild(button);
    return button;
  }

  function toggleGrid() {
    gridEnabled = !gridEnabled;
    const overlay = createGridOverlay();
    const button = document.getElementById('creator-mode-toggle');
    
    if (gridEnabled) {
      overlay.style.display = 'block';
      button.style.background = 'rgb(5, 237, 152)';
      button.textContent = 'G✓';
      console.log(`✅ Creator Mode: GRID ENABLED (Prefix: ${COORD_PREFIX})`);
      console.log(`📋 Use coordinates like: ${COORD_PREFIX}A2, ${COORD_PREFIX}B3, ${COORD_PREFIX}C0-${COORD_PREFIX}D5`);
    } else {
      overlay.style.display = 'none';
      button.style.background = 'rgb(5, 181, 250)';
      button.textContent = 'G';
      console.log('Creator Mode: Grid disabled');
    }
  }

  function addSectionLabels() {
    // Add data-coord attributes to major sections for programmatic access
    const sections = [
      { selector: 'nav', coord: 'A0-B0', name: 'Navigation' },
      { selector: '.intro', coord: 'A1-E3', name: 'Hero Banner' },
      { selector: '.highlights', coord: 'A4-E6', name: 'Highlights (Meta Structures)' },
      { selector: '.about', coord: 'A7-E8', name: 'About Section' },
      { selector: '.transformations', coord: 'A9-E10', name: 'Transformations' },
      { selector: '.methods', coord: 'A11-E14', name: 'Methods' },
      { selector: '.technology', coord: 'A15-E18', name: 'Technology Stack' },
    ];

    sections.forEach(({ selector, coord, name }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.dataset.coord = coord;
        element.dataset.sectionName = name;
      }
    });
  }

  function getElementAtCoord(coord) {
    // Accept both prefixed (RA1) and non-prefixed (A1) coordinates
    let baseCoord = coord;
    if (coord.startsWith('L') || coord.startsWith('R')) {
      // Remove prefix if present
      baseCoord = coord.substring(1);
    }
    
    // Find element at a specific coordinate
    const cell = document.querySelector(`[data-coord="${baseCoord}"]`);
    if (cell) {
      // Get element below this cell
      const rect = cell.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return document.elementFromPoint(centerX, centerY);
    }
    return null;
  }

  // Initialize
  function init() {
    createToggleButton();
    addSectionLabels();

    // Keyboard shortcut: Press 'G' to toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleGrid();
        }
      }
    });

    // Update grid on resize or scroll (for dynamic content)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateGridDimensions, 250);
    });

    // Update grid when content changes (MutationObserver)
    const observer = new MutationObserver(() => {
      if (gridEnabled) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateGridDimensions, 250);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Expose API to console
    window.creatorMode = {
      toggle: toggleGrid,
      enable: () => { if (!gridEnabled) toggleGrid(); },
      disable: () => { if (gridEnabled) toggleGrid(); },
      getElementAt: getElementAtCoord,
      isEnabled: () => gridEnabled,
      update: updateGridDimensions
    };

    console.log(`🎨 Creator Mode loaded! (Prefix: ${COORD_PREFIX}) Press G to toggle grid.`);
    console.log(`📋 Use: window.creatorMode.getElementAt("${COORD_PREFIX}A2") to find elements`);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

