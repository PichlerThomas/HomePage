/**
 * Phase 4: Font Loading Verification
 * 
 * Verifies that custom fonts are actually loaded and rendering
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { loadJSON, fileExists } = require('../utils/file-utils');

/**
 * Font Verification Script (browser-side)
 */
const verifyFontsScript = (fontFamilies) => `
  (function() {
    const fontFamilies = ${JSON.stringify(fontFamilies)};
    const results = {};
    
    // Wait for fonts to load
    return document.fonts.ready.then(() => {
      fontFamilies.forEach(fontFamily => {
        const fontLoaded = document.fonts.check('12px "' + fontFamily + '"');
        const fontStatus = Array.from(document.fonts).find(f => f.family === fontFamily);
        
        results[fontFamily] = {
          loaded: fontLoaded,
          status: fontStatus ? fontStatus.status : 'unloaded',
          family: fontFamily
        };
      });
      
      return results;
    });
  })();
`;

/**
 * Extract font families from asset inventory
 */
function extractFontFamilies(inventory) {
  const families = new Set();
  
  if (inventory.fonts) {
    inventory.fonts.forEach(font => {
      // Remove quotes and fallbacks
      const family = font.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
      if (family) {
        families.add(family);
      }
    });
  }
  
  return Array.from(families);
}

/**
 * Execute Phase 4
 */
async function execute({ originalUrl, targetDir, config, updateSetup, previousResults }) {
  console.log('Phase 4: Font Loading Verification');

  // Load asset inventory
  const inventoryPath = path.join(targetDir, 'assets-inventory.json');
  const inventory = await loadJSON(inventoryPath);

  if (!inventory || !inventory.fonts) {
    console.log('⚠️  No fonts found in inventory');
    return {
      success: true,
      data: {
        message: 'No fonts to verify',
        fonts: []
      }
    };
  }

  const fontFamilies = extractFontFamilies(inventory);
  console.log(`Verifying ${fontFamilies.length} font families: ${fontFamilies.join(', ')}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Verify fonts on original site
    console.log('Verifying fonts on original site...');
    await page.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for fonts to load

    const originalFontVerification = await page.evaluate(verifyFontsScript(fontFamilies));

    // Verify fonts on local site
    console.log('Verifying fonts on local site...');
    const localHTMLPath = path.join(targetDir, 'index.html');

    if (!(await fileExists(localHTMLPath))) {
      console.log('⚠️  Local index.html not found, skipping local verification');
      return {
        success: true,
        data: {
          original: originalFontVerification,
          local: null,
          message: 'Local HTML not found'
        }
      };
    }

    const localHTML = await fs.readFile(localHTMLPath, 'utf8');
    await page.setContent(localHTML);
    await page.waitForTimeout(3000); // Wait for fonts to load

    const localFontVerification = await page.evaluate(verifyFontsScript(fontFamilies));

    // Compare verification results
    const comparison = {};
    let allFontsLoaded = true;
    let allFontsMatch = true;

    fontFamilies.forEach(family => {
      const orig = originalFontVerification[family];
      const local = localFontVerification[family];

      comparison[family] = {
        original: {
          loaded: orig?.loaded || false,
          status: orig?.status || 'unknown'
        },
        local: {
          loaded: local?.loaded || false,
          status: local?.status || 'unknown'
        },
        match: orig?.loaded === local?.loaded && orig?.status === local?.status
      };

      if (!local?.loaded) {
        allFontsLoaded = false;
      }
      if (!comparison[family].match) {
        allFontsMatch = false;
      }
    });

    const report = {
      timestamp: new Date().toISOString(),
      fontFamilies,
      original: originalFontVerification,
      local: localFontVerification,
      comparison,
      summary: {
        totalFonts: fontFamilies.length,
        originalLoaded: Object.values(originalFontVerification).filter(f => f.loaded).length,
        localLoaded: Object.values(localFontVerification).filter(f => f.loaded).length,
        allFontsLoaded,
        allFontsMatch,
        matchPercentage: allFontsMatch ? 100 : (
          Object.values(comparison).filter(c => c.match).length / fontFamilies.length * 100
        ).toFixed(2)
      }
    };

    console.log(`\n✅ Font verification complete:`);
    console.log(`   Original: ${report.summary.originalLoaded}/${report.summary.totalFonts} fonts loaded`);
    console.log(`   Local: ${report.summary.localLoaded}/${report.summary.totalFonts} fonts loaded`);
    console.log(`   Match: ${report.summary.matchPercentage}%`);

    if (!allFontsLoaded) {
      console.log(`\n⚠️  Warning: Not all fonts are loaded on local site`);
      Object.entries(comparison).forEach(([family, comp]) => {
        if (!comp.local.loaded) {
          console.log(`   - ${family}: ${comp.local.status}`);
        }
      });
    }

    if (!allFontsMatch) {
      console.log(`\n⚠️  Warning: Font status mismatch detected`);
      Object.entries(comparison).forEach(([family, comp]) => {
        if (!comp.match) {
          console.log(`   - ${family}: original=${comp.original.status}, local=${comp.local.status}`);
        }
      });
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
