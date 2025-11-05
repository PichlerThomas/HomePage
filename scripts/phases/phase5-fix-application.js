/**
 * Phase 5: Automated Fix Application
 * 
 * Applies fixes automatically based on comparison report
 */

const fs = require('fs').promises;
const path = require('path');
const { loadJSON, fileExists } = require('../utils/file-utils');

/**
 * Apply CSS fixes to HTML
 */
async function applyCSSFixes(htmlContent, comparisonReport, config) {
  let fixedHTML = htmlContent;
  const fixes = [];

  // Extract style block or create one
  let styleBlock = '';
  const styleMatch = fixedHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    styleBlock = styleMatch[1];
  }

  // Apply fixes for each selector
  for (const [selector, comparison] of Object.entries(comparisonReport.comparison || {})) {
    for (const [property, propCompare] of Object.entries(comparison.properties || {})) {
      if (!propCompare.match) {
        // Generate CSS rule to fix this property
        const value = propCompare.original;
        const cssRule = `${selector} { ${property}: ${value}; }`;
        
        // Add to style block if not already present
        if (!styleBlock.includes(cssRule) && !styleBlock.includes(`${selector}`)) {
          styleBlock += `\n        ${cssRule}`;
          
          fixes.push({
            selector,
            property,
            original: propCompare.original,
            local: propCompare.local,
            fix: value
          });
        }
      }
    }
  }

  // Update style block in HTML
  if (styleMatch) {
    fixedHTML = fixedHTML.replace(
      /<style[^>]*>[\s\S]*?<\/style>/,
      `<style>${styleBlock}\n    </style>`
    );
  } else {
    // Insert style block before </head>
    const headMatch = fixedHTML.match(/<\/head>/);
    if (headMatch) {
      fixedHTML = fixedHTML.replace(
        '</head>',
        `    <style>${styleBlock}\n    </style>\n</head>`
      );
    }
  }

  return { fixedHTML, fixes };
}

/**
 * Update asset paths in HTML
 */
async function updateAssetPaths(htmlContent, downloadReport, config) {
  let updatedHTML = htmlContent;
  const pathUpdates = [];

  // Update font paths in @font-face declarations
  if (downloadReport.fonts) {
    downloadReport.fonts.forEach(font => {
      if (font.localPath && font.src) {
        // Replace absolute URL with relative path
        const regex = new RegExp(font.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (updatedHTML.match(regex)) {
          updatedHTML = updatedHTML.replace(regex, font.localPath);
          pathUpdates.push({
            type: 'font',
            old: font.src,
            new: font.localPath
          });
        }
      }
    });
  }

  // Update image paths
  if (downloadReport.images) {
    downloadReport.images.forEach(image => {
      if (image.localPath && image.src) {
        // Replace absolute URL with relative path
        const regex = new RegExp(image.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (updatedHTML.match(regex)) {
          updatedHTML = updatedHTML.replace(regex, image.localPath);
          pathUpdates.push({
            type: 'image',
            old: image.src,
            new: image.localPath
          });
        }
      }
    });
  }

  return { updatedHTML, pathUpdates };
}

/**
 * Execute Phase 5
 */
async function execute({ originalUrl, targetDir, config, updateSetup, previousResults }) {
  console.log('Phase 5: Automated Fix Application');

  // Load comparison report
  const comparisonPath = path.join(targetDir, 'css-comparison-report.json');
  const comparisonReport = await loadJSON(comparisonPath);

  if (!comparisonReport) {
    console.log('⚠️  CSS comparison report not found, skipping CSS fixes');
  }

  // Load download report
  const downloadPath = path.join(targetDir, 'assets-downloaded.json');
  const downloadReport = await loadJSON(downloadPath);

  if (!downloadReport) {
    console.log('⚠️  Asset download report not found, skipping path updates');
  }

  // Load or create HTML
  const htmlPath = path.join(targetDir, 'index.html');
  let htmlContent;

  if (await fileExists(htmlPath)) {
    htmlContent = await fs.readFile(htmlPath, 'utf8');
    console.log('Loaded existing index.html');
  } else {
    // Try to get HTML from Phase 1 inventory
    const inventoryPath = path.join(targetDir, 'assets-inventory.json');
    const inventory = await loadJSON(inventoryPath);
    
    if (inventory && inventory.htmlContent) {
      console.log('Using HTML from asset inventory');
      htmlContent = inventory.htmlContent;
    } else {
      // Create basic HTML structure if it doesn't exist
      console.log('Creating new index.html');
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reconstructed Page</title>
</head>
<body>
</body>
</html>`;
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    cssFixes: [],
    pathUpdates: [],
    summary: {
      cssFixesApplied: 0,
      pathUpdatesApplied: 0
    }
  };

  // Apply CSS fixes
  if (comparisonReport && comparisonReport.comparison) {
    console.log('Applying CSS fixes...');
    const { fixedHTML, fixes } = await applyCSSFixes(htmlContent, comparisonReport, config);
    htmlContent = fixedHTML;
    report.cssFixes = fixes;
    report.summary.cssFixesApplied = fixes.length;
    console.log(`  Applied ${fixes.length} CSS fixes`);
  }

  // Update asset paths
  if (downloadReport) {
    console.log('Updating asset paths...');
    const { updatedHTML, pathUpdates } = await updateAssetPaths(htmlContent, downloadReport, config);
    htmlContent = updatedHTML;
    report.pathUpdates = pathUpdates;
    report.summary.pathUpdatesApplied = pathUpdates.length;
    console.log(`  Updated ${pathUpdates.length} asset paths`);
  }

  // Save updated HTML
  await fs.writeFile(htmlPath, htmlContent, 'utf8');
  console.log(`✅ Saved updated index.html`);

  console.log(`\n✅ Fix application complete:`);
  console.log(`   CSS fixes: ${report.summary.cssFixesApplied}`);
  console.log(`   Path updates: ${report.summary.pathUpdatesApplied}`);

  return {
    success: true,
    data: report
  };
}

module.exports = {
  execute
};
