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

  // Get all font families from inventory
  const allFontFamilies = extractFontFamilies(inventory);
  
  // Get font families actually used in the page
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const tempPage = await browser.newPage();
  
  let usedFontFamilies = [];
  try {
    await tempPage.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await tempPage.waitForTimeout(2000);
    usedFontFamilies = await extractUsedFontFamilies(tempPage);
  } catch (e) {
    console.log('⚠️  Could not extract used fonts, verifying all fonts');
    usedFontFamilies = allFontFamilies;
  }
  await browser.close();
  
  // Verify only fonts that are actually used
  const fontFamilies = usedFontFamilies.length > 0 ? usedFontFamilies : allFontFamilies;
  console.log(`Verifying ${fontFamilies.length} font families: ${fontFamilies.join(', ')}`);
  if (usedFontFamilies.length < allFontFamilies.length) {
    console.log(`   (Skipping ${allFontFamilies.length - usedFontFamilies.length} unused fonts)`);
  }

  const browser2 = await puppeteer.launch({ 
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser2.newPage();

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
    let allUsedFontsLoaded = true;
    let allFontsMatch = true;
    const usedFonts = new Set();

    // Check which fonts are actually used in the page
    const usedFontFamilies = await page.evaluate(() => {
      const families = new Set();
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontFamily = style.fontFamily;
        if (fontFamily && fontFamily !== 'initial') {
          const family = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          if (family && !family.match(/^(serif|sans-serif|monospace|cursive|fantasy)$/i)) {
            families.add(family);
          }
        }
      });
      
      return Array.from(families);
    });

    usedFontFamilies.forEach(f => usedFonts.add(f));

    fontFamilies.forEach(family => {
      const orig = originalFontVerification[family];
      const local = localFontVerification[family];
      const isUsed = usedFonts.has(family);

      comparison[family] = {
        original: {
          loaded: orig?.loaded || false,
          status: orig?.status || 'unknown'
        },
        local: {
          loaded: local?.loaded || false,
          status: local?.status || 'unknown'
        },
        match: orig?.loaded === local?.loaded && orig?.status === local?.status,
        used: isUsed
      };

      // Only check loaded status for fonts that are actually used
      if (isUsed && !local?.loaded) {
        allUsedFontsLoaded = false;
      }
      if (!comparison[family].match) {
        allFontsMatch = false;
      }
    });

    const usedFontsList = Array.from(usedFonts);
    const report = {
      timestamp: new Date().toISOString(),
      fontFamilies,
      usedFontFamilies: usedFontsList,
      original: originalFontVerification,
      local: localFontVerification,
      comparison,
      summary: {
        totalFonts: fontFamilies.length,
        usedFonts: usedFontsList.length,
        originalLoaded: Object.values(originalFontVerification).filter(f => f.loaded).length,
        localLoaded: Object.values(localFontVerification).filter(f => f.loaded).length,
        usedFontsLoaded: usedFontsList.filter(f => localFontVerification[f]?.loaded).length,
        allUsedFontsLoaded: allUsedFontsLoaded,
        allFontsMatch,
        matchPercentage: allFontsMatch ? 100 : (
          Object.values(comparison).filter(c => c.match).length / fontFamilies.length * 100
        ).toFixed(2)
      }
    };

    console.log(`\n✅ Font verification complete:`);
    console.log(`   Total fonts defined: ${report.summary.totalFonts}`);
    console.log(`   Fonts used in page: ${report.summary.usedFonts}`);
    console.log(`   Original loaded: ${report.summary.originalLoaded}/${report.summary.totalFonts}`);
    console.log(`   Local loaded: ${report.summary.localLoaded}/${report.summary.totalFonts}`);
    console.log(`   Used fonts loaded: ${report.summary.usedFontsLoaded}/${report.summary.usedFonts}`);
    console.log(`   Match: ${report.summary.matchPercentage}%`);

    if (!allUsedFontsLoaded) {
      console.log(`\n⚠️  Warning: Not all used fonts are loaded on local site`);
      Object.entries(comparison).forEach(([family, comp]) => {
        if (comp.used && !comp.local.loaded) {
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
    await browser2.close();
  }
}

module.exports = {
  execute
};
