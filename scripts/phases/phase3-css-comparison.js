/**
 * Phase 3: CSS Property Extraction and Comparison
 * 
 * Extracts all CSS properties from original site and compares with local site
 * Supports update mode: three-way comparison (original vs existing vs new)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { loadJSON, fileExists } = require('../utils/file-utils');

/**
 * CSS Property Extraction Script (browser-side)
 */
const extractCSSPropertiesScript = (selectors) => `
  (function() {
    const selectors = ${JSON.stringify(selectors)};
    const results = {};
    
    selectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (!element) {
          results[selector] = { error: 'Element not found' };
          return;
        }
        
        const style = window.getComputedStyle(element);
        const properties = {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          textTransform: style.textTransform,
          textAlign: style.textAlign,
          color: style.color,
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          background: style.background,
          marginTop: style.marginTop,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
          margin: style.margin,
          paddingTop: style.paddingTop,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          padding: style.padding,
          width: style.width,
          height: style.height,
          display: style.display,
          position: style.position,
          top: style.top,
          left: style.left,
          right: style.right,
          bottom: style.bottom,
          border: style.border,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          opacity: style.opacity,
          transform: style.transform,
          zIndex: style.zIndex,
          maxWidth: style.maxWidth,
          maxHeight: style.maxHeight,
          minWidth: style.minWidth,
          minHeight: style.minHeight,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
          aspectRatio: style.aspectRatio,
          transform: style.transform
        };
        
        results[selector] = properties;
      } catch (e) {
        results[selector] = { error: e.message };
      }
    });
    
    return results;
  })();
`;

/**
 * Normalize CSS value
 */
function normalizeValue(value, property) {
  if (!value || value === 'none' || value === 'auto') {
    return value;
  }

  // Normalize color values
  if (property.includes('color') || property.includes('background')) {
    // Convert "white" to "rgb(255, 255, 255)"
    if (value === 'white') return 'rgb(255, 255, 255)';
    if (value === 'black') return 'rgb(0, 0, 0)';
    // Keep as-is if already in rgb/rgba format
    return value;
  }

  return value;
}

/**
 * Compare property values
 */
function compareProperty(original, local, property, tolerance) {
  const orig = normalizeValue(original, property);
  const loc = normalizeValue(local, property);

  if (orig === loc) {
    return { match: true, original: orig, local: loc };
  }

  // Numeric comparison with tolerance
  if (tolerance && tolerance.numeric) {
    const origNum = parseFloat(orig);
    const locNum = parseFloat(loc);
    if (!isNaN(origNum) && !isNaN(locNum)) {
      const diff = Math.abs(origNum - locNum);
      if (diff <= tolerance.numeric) {
        return { match: true, original: orig, local: loc, diff };
      }
    }
  }

  return { match: false, original: orig, local: loc };
}

/**
 * Extract selectors from original site
 */
async function extractSelectors(page) {
  return await page.evaluate(() => {
    const selectors = [];
    const seen = new Set();

    // Common selectors to check (including video/iframe elements)
    const commonSelectors = [
      '.intro .heading',
      '.intro h2',
      '.intro .container p',
      '.intro figure',
      'nav',
      'nav a',
      'h2',
      'h4',
      'p',
      'iframe',
      'video',
      '.video',
      '.video iframe',
      '.video-container',
      '.video-container iframe',
      '[class*="ytp"]',
      '.ytp-cued-thumbnail-overlay',
      '.ytp-cued-thumbnail-overlay-image'
    ];

    // Add all elements with classes or IDs
    document.querySelectorAll('[class], [id]').forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(cls => {
          if (cls) {
            const selector = `.${cls}`;
            if (!seen.has(selector)) {
              selectors.push(selector);
              seen.add(selector);
            }
          }
        });
      }
      if (el.id) {
        const selector = `#${el.id}`;
        if (!seen.has(selector)) {
          selectors.push(selector);
          seen.add(selector);
        }
      }
    });

    // Add common selectors
    commonSelectors.forEach(sel => {
      if (!seen.has(sel)) {
        selectors.push(sel);
        seen.add(sel);
      }
    });

    return selectors;
  });
}

/**
 * Execute Phase 3
 */
async function execute({ originalUrl, targetDir, config, updateSetup, previousResults }) {
  console.log('Phase 3: CSS Property Extraction and Comparison');

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();

  try {
    // Extract CSS from original site
    console.log('Extracting CSS from original site...');
    await page.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);

    const selectors = await extractSelectors(page);
    console.log(`Found ${selectors.length} selectors to compare`);

    const originalProperties = await page.evaluate(extractCSSPropertiesScript(selectors));

    // Extract CSS from local site
    console.log('Extracting CSS from local site...');
    const localHTMLPath = path.join(targetDir, 'index.html');
    
    if (!(await fileExists(localHTMLPath))) {
      console.log('⚠️  Local index.html not found, creating minimal comparison');
      // Return minimal comparison report
      const report = {
        timestamp: new Date().toISOString(),
        originalUrl,
        selectors: [],
        comparison: {},
        summary: {
          totalSelectors: 0,
          totalProperties: 0,
          matchedProperties: 0,
          unmatchedProperties: 0,
          overallMatchPercentage: 0,
          changeCount: 0,
          message: 'Local HTML not found, comparison skipped'
        }
      };
      return {
        success: true,
        data: report
      };
    }

    const localHTML = await fs.readFile(localHTMLPath, 'utf8');
    // Use file:// protocol with absolute path to ensure local CSS files load correctly
    const absoluteLocalHTMLPath = path.resolve(localHTMLPath);
    const localHTMLUrl = `file://${absoluteLocalHTMLPath}`;
    await page.goto(localHTMLUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for CSS and fonts to load

    const localProperties = await page.evaluate(extractCSSPropertiesScript(selectors));

    // Extract CSS from existing site (if update mode)
    let existingProperties = null;
    if (updateSetup && updateSetup.updateConfig && updateSetup.updateConfig.compareWithExisting) {
      const existingHTMLPath = updateSetup.updateConfig.existingHTML || path.join(updateSetup.backupDir, 'index.html');
      
      if (await fileExists(existingHTMLPath)) {
        console.log('Extracting CSS from existing site (update mode)...');
        const existingHTML = await fs.readFile(existingHTMLPath, 'utf8');
        await page.setContent(existingHTML);
        await page.waitForTimeout(1000);
        existingProperties = await page.evaluate(extractCSSPropertiesScript(selectors));
      }
    }

    // Compare properties
    console.log('Comparing CSS properties...');
    const comparison = {};
    const tolerance = config.comparison?.tolerance || {};

    let totalProperties = 0;
    let matchedProperties = 0;
    let changedProperties = 0;

    for (const selector of selectors) {
      const orig = originalProperties[selector];
      const local = localProperties[selector];
      const existing = existingProperties?.[selector];

      if (!orig || orig.error || !local || local.error) {
        continue;
      }

      const propertiesToCompare = config.comparison?.properties || [
        'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
        'color', 'backgroundColor', 'margin', 'padding',
        'textAlign', 'textTransform', 'letterSpacing'
      ];

      const selectorComparison = {
        selector,
        properties: {},
        matchPercentage: 0,
        changeCount: 0
      };

      for (const property of propertiesToCompare) {
        const origValue = orig[property];
        const localValue = local[property];

        if (origValue === undefined || localValue === undefined) {
          continue;
        }

        totalProperties++;
        const propCompare = compareProperty(origValue, localValue, property, tolerance);

        if (existingProperties) {
          // Three-way comparison (update mode)
          const existingValue = existing?.[property];
          const changed = existingValue !== undefined && existingValue !== localValue;
          
          selectorComparison.properties[property] = {
            original: propCompare.original,
            existing: normalizeValue(existingValue, property),
            local: propCompare.local,
            match: propCompare.match,
            changed
          };

          if (changed) {
            changedProperties++;
          }
        } else {
          // Two-way comparison (create mode)
          selectorComparison.properties[property] = propCompare;
        }

        if (propCompare.match) {
          matchedProperties++;
        }
      }

      selectorComparison.matchPercentage = totalProperties > 0 
        ? (matchedProperties / totalProperties) * 100 
        : 0;

      if (selectorComparison.matchPercentage > 0) {
        comparison[selector] = selectorComparison;
      }
    }

    // Calculate overall match percentage
    const overallMatchPercentage = totalProperties > 0 
      ? (matchedProperties / totalProperties) * 100 
      : 0;

    const report = {
      timestamp: new Date().toISOString(),
      originalUrl,
      selectors: Object.keys(comparison),
      comparison,
      summary: {
        totalSelectors: Object.keys(comparison).length,
        totalProperties,
        matchedProperties,
        unmatchedProperties: totalProperties - matchedProperties,
        overallMatchPercentage: overallMatchPercentage.toFixed(2),
        changeCount: changedProperties
      }
    };

    console.log(`\n✅ Comparison complete:`);
    console.log(`   Overall match: ${report.summary.overallMatchPercentage}%`);
    console.log(`   Matched: ${matchedProperties}/${totalProperties} properties`);
    if (changedProperties > 0) {
      console.log(`   Changed: ${changedProperties} properties`);
    }

    return {
      success: true,
      data: report
    };

  } finally {
    await browser.close();
  }
}

module.exports = {
  execute
};
