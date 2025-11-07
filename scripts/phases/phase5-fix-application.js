/**
 * Phase 5: Automated Fix Application
 * 
 * Applies fixes automatically based on comparison report
 */

const fs = require('fs').promises;
const path = require('path');
const { loadJSON, fileExists } = require('../utils/file-utils');

/**
 * Apply CSS fixes to HTML from Phase 3 CSS comparison
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
    // Group properties by selector for better CSS organization
    const selectorFixes = [];
    for (const [property, propCompare] of Object.entries(comparison.properties || {})) {
      if (!propCompare.match) {
        selectorFixes.push({ property, value: propCompare.original, original: propCompare.original, local: propCompare.local });
      }
    }
    
    // Generate combined CSS rule for all properties of this selector
    if (selectorFixes.length > 0) {
      const propertiesStr = selectorFixes.map(f => `${f.property}: ${f.value}`).join('; ');
      const cssRule = `${selector} { ${propertiesStr}; }`;
      
      // Add to style block if not already present
      if (!styleBlock.includes(cssRule) && !styleBlock.includes(`${selector} {`)) {
        styleBlock += `\n        ${cssRule}`;
        
        selectorFixes.forEach(fix => {
          fixes.push({
            selector,
            property: fix.property,
            original: fix.original,
            local: fix.local,
            fix: fix.value
          });
        });
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
 * Apply visual comparison fixes from Phase 6
 */
async function applyVisualComparisonFixes(htmlContent, visualComparisonReport, config) {
  let fixedHTML = htmlContent;
  const fixes = [];

  // Extract style block or create one
  let styleBlock = '';
  const styleMatch = fixedHTML.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    styleBlock = styleMatch[1];
  }

  // Group differences by selector
  const selectorFixes = {};
  
  // Process high-priority differences first, then medium
  const highPriority = visualComparisonReport.differences.filter(d => d.severity === 'high');
  const mediumPriority = visualComparisonReport.differences.filter(d => d.severity === 'medium');
  const allDifferences = [...highPriority, ...mediumPriority];

  allDifferences.forEach(diff => {
    if (!selectorFixes[diff.selector]) {
      selectorFixes[diff.selector] = {};
    }

    // Extract remote values from differences
    if (diff.type === 'dimension_mismatch' || diff.type === 'visual_mismatch') {
      diff.differences.forEach(propDiff => {
        // Parse: "width: Remote \"1296px\", Local \"800px\"" or "Width: Remote 1296px, Local 800px (diff: 496px)"
        let match = propDiff.match(/(\w+):\s*Remote\s*"([^"]+)"/);
        if (!match) {
          // Try alternative format: "Width: Remote 1296px, Local 800px"
          match = propDiff.match(/(\w+):\s*Remote\s*(\d+(?:\.\d+)?)px/);
          if (match) {
            const [, property, remoteValue] = match;
            selectorFixes[diff.selector][property.toLowerCase()] = `${remoteValue}px`;
          }
        } else {
          const [, property, remoteValue] = match;
          selectorFixes[diff.selector][property] = remoteValue;
        }
      });
    }

    if (diff.type === 'typography_mismatch') {
      diff.differences.forEach(propDiff => {
        // Parse: "fontFamily: Remote \"AkkoRoundedPro\", Local \"Arial\"" or "fontSize: Remote \"16px\", Local \"14px\""
        const match = propDiff.match(/(\w+):\s*Remote\s*"([^"]+)"/);
        if (match) {
          const [, property, remoteValue] = match;
          // Convert camelCase to kebab-case for CSS
          const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
          selectorFixes[diff.selector][cssProperty] = remoteValue;
        }
      });
    }

    // For position mismatches, we need to calculate margin adjustments
    if (diff.type === 'position_mismatch' && diff.differences) {
      diff.differences.forEach(propDiff => {
        // Parse position differences
        const xMatch = propDiff.match(/X position:.*?diff: ([\d-]+)px/);
        const yMatch = propDiff.match(/Y position:.*?diff: ([\d-]+)px/);
        
        if (xMatch) {
          const xDiff = parseInt(xMatch[1]);
          // Adjust margin-left or transform
          if (!selectorFixes[diff.selector].marginLeft) {
            selectorFixes[diff.selector].marginLeft = `${-xDiff}px`;
          }
        }
        if (yMatch) {
          const yDiff = parseInt(yMatch[1]);
          // Adjust margin-top
          if (!selectorFixes[diff.selector].marginTop) {
            selectorFixes[diff.selector].marginTop = `${-yDiff}px`;
          }
        }
      });
    }
  });

  // Apply fixes
  for (const [selector, properties] of Object.entries(selectorFixes)) {
    if (Object.keys(properties).length > 0) {
      const propertiesStr = Object.entries(properties)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');
      const cssRule = `${selector} { ${propertiesStr}; }`;
      
      // Check if rule already exists and update it, or add new
      const existingRuleRegex = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`, 'g');
      if (styleBlock.match(existingRuleRegex)) {
        // Update existing rule
        styleBlock = styleBlock.replace(existingRuleRegex, cssRule);
      } else {
        // Add new rule
        styleBlock += `\n        ${cssRule}`;
      }

      Object.entries(properties).forEach(([property, value]) => {
        fixes.push({
          selector,
          property,
          fix: value,
          source: 'visual_comparison'
        });
      });
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
    visualFixes: [],
    pathUpdates: [],
    summary: {
      cssFixesApplied: 0,
      visualFixesApplied: 0,
      pathUpdatesApplied: 0
    }
  };

  // Apply CSS fixes from Phase 3
  if (comparisonReport && comparisonReport.comparison) {
    console.log('Applying CSS fixes from Phase 3...');
    const { fixedHTML, fixes } = await applyCSSFixes(htmlContent, comparisonReport, config);
    htmlContent = fixedHTML;
    report.cssFixes = fixes;
    report.summary.cssFixesApplied = fixes.length;
    console.log(`  Applied ${fixes.length} CSS fixes`);
  }

  // Apply visual comparison fixes from Phase 6
  const visualComparisonPath = path.join(targetDir, 'visual-comparison-report.json');
  const visualComparisonReport = await loadJSON(visualComparisonPath);
  
  if (visualComparisonReport && visualComparisonReport.differences && visualComparisonReport.differences.length > 0) {
    console.log('Applying visual comparison fixes from Phase 6...');
    const { fixedHTML, fixes: visualFixes } = await applyVisualComparisonFixes(htmlContent, visualComparisonReport, config);
    htmlContent = fixedHTML;
    report.visualFixes = visualFixes;
    report.summary.visualFixesApplied = visualFixes.length;
    console.log(`  Applied ${visualFixes.length} visual fixes`);
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
  console.log(`   Visual fixes: ${report.summary.visualFixesApplied}`);
  console.log(`   Path updates: ${report.summary.pathUpdatesApplied}`);

  return {
    success: true,
    data: report
  };
}

module.exports = {
  execute
};
