/**
 * Phase 6: Visual Layout Comparison ("Fehlersuch Bild")
 * 
 * CMM3-Compliant visual difference detection between remote and local pages.
 * 
 * Compares:
 * - Element positions (using grid coordinates)
 * - Element dimensions (width, height)
 * - Visual properties (colors, fonts, spacing)
 * - Layout structure
 * 
 * Generates a detailed difference report for iterative improvement.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { loadJSON, fileExists } = require('../utils/file-utils');

/**
 * Grid-based coordinate system (matching Creator Mode)
 */
const GRID_SIZE = 100;
const GRID_COLS = 12; // A-L

/**
 * Extract element positions and visual properties (browser-side)
 */
const extractVisualPropertiesScript = `
  (function() {
    const GRID_SIZE = ${GRID_SIZE};
    const GRID_COLS = ${GRID_COLS};
    
    function getGridCoordinate(x, y) {
      const col = Math.floor(x / (window.innerWidth / GRID_COLS));
      const row = Math.floor(y / GRID_SIZE);
      const colLabel = String.fromCharCode(65 + Math.min(col, GRID_COLS - 1));
      return colLabel + row;
    }
    
    function extractElementInfo(element, selector) {
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      // Calculate grid coordinates
      const topLeft = getGridCoordinate(rect.left + scrollX, rect.top + scrollY);
      const bottomRight = getGridCoordinate(rect.right + scrollX, rect.bottom + scrollY);
      
      return {
        selector: selector,
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        id: element.id || '',
        position: {
          x: rect.left + scrollX,
          y: rect.top + scrollY,
          width: rect.width,
          height: rect.height,
          right: rect.right + scrollX,
          bottom: rect.bottom + scrollY
        },
        gridCoordinates: {
          topLeft: topLeft,
          bottomRight: bottomRight,
          range: topLeft + '-' + bottomRight
        },
        visual: {
          width: style.width,
          height: style.height,
          maxWidth: style.maxWidth,
          maxHeight: style.maxHeight,
          margin: style.margin,
          padding: style.padding,
          display: style.display,
          position: style.position,
          textAlign: style.textAlign
        },
        typography: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          color: style.color
        },
        background: {
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          background: style.background
        }
      };
    }
    
    // Selectors to compare (key elements)
    const selectors = [
      'nav',
      'nav li',
      'nav .nav-item',
      '.intro',
      '.intro figure',
      '.intro .heading',
      '.intro .container p',
      '.video-container',
      '.video-container iframe',
      '.highlights',
      '.highlights h4',
      '.highlights img',
      'h2',
      'section',
      'footer'
    ];
    
    const results = {};
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results[selector] = Array.from(elements).map((el, index) => {
          const uniqueSelector = elements.length > 1 ? \`\${selector}:nth-of-type(\${index + 1})\` : selector;
          return extractElementInfo(el, uniqueSelector);
        });
      } else {
        results[selector] = [];
      }
    });
    
    // Also extract all iframes and videos
    const iframes = document.querySelectorAll('iframe');
    results['iframe'] = Array.from(iframes).map((el, index) => {
      return extractElementInfo(el, \`iframe[\${index}]\`);
    });
    
    const videos = document.querySelectorAll('video');
    results['video'] = Array.from(videos).map((el, index) => {
      return extractElementInfo(el, \`video[\${index}]\`);
    });
    
    // Get viewport dimensions
    results._viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    };
    
    return results;
  })();
`;

/**
 * Compare visual properties between remote and local
 */
function compareVisualProperties(remoteData, localData) {
  const differences = [];
  const allSelectors = new Set([
    ...Object.keys(remoteData).filter(k => !k.startsWith('_')),
    ...Object.keys(localData).filter(k => !k.startsWith('_'))
  ]);
  
  allSelectors.forEach(selector => {
    const remoteElements = remoteData[selector] || [];
    const localElements = localData[selector] || [];
    
    // Compare element counts
    if (remoteElements.length !== localElements.length) {
      differences.push({
        type: 'count_mismatch',
        selector: selector,
        remote: remoteElements.length,
        local: localElements.length,
        severity: 'high',
        message: `Element count mismatch: Remote has ${remoteElements.length}, Local has ${localElements.length}`
      });
    }
    
    // Compare each element
    const maxLength = Math.max(remoteElements.length, localElements.length);
    for (let i = 0; i < maxLength; i++) {
      const remote = remoteElements[i];
      const local = localElements[i];
      
      if (!remote && local) {
        differences.push({
          type: 'missing_remote',
          selector: selector,
          index: i,
          local: local.gridCoordinates,
          severity: 'high',
          message: `Element exists locally but not on remote: ${selector}[${i}]`
        });
        continue;
      }
      
      if (remote && !local) {
        differences.push({
          type: 'missing_local',
          selector: selector,
          index: i,
          remote: remote.gridCoordinates,
          severity: 'high',
          message: `Element exists on remote but not locally: ${selector}[${i}]`
        });
        continue;
      }
      
      if (!remote || !local) continue;
      
      // Compare positions
      const posDiff = comparePositions(remote.position, local.position, remote.gridCoordinates, local.gridCoordinates);
      if (posDiff.length > 0) {
        differences.push({
          type: 'position_mismatch',
          selector: selector,
          index: i,
          remote: remote.gridCoordinates,
          local: local.gridCoordinates,
          differences: posDiff,
          severity: posDiff.some(d => d.includes('grid')) ? 'high' : 'medium',
          message: `Position mismatch for ${selector}[${i}]: Remote ${remote.gridCoordinates.range}, Local ${local.gridCoordinates.range}`
        });
      }
      
      // Compare dimensions
      const dimDiff = compareDimensions(remote.position, local.position);
      if (dimDiff.length > 0) {
        differences.push({
          type: 'dimension_mismatch',
          selector: selector,
          index: i,
          remote: remote.gridCoordinates,
          local: local.gridCoordinates,
          differences: dimDiff,
          severity: 'high',
          message: `Dimension mismatch for ${selector}[${i}]: ${dimDiff.join(', ')}`
        });
      }
      
      // Compare visual properties
      const visualDiff = compareVisual(remote.visual, local.visual);
      if (visualDiff.length > 0) {
        differences.push({
          type: 'visual_mismatch',
          selector: selector,
          index: i,
          remote: remote.gridCoordinates,
          local: local.gridCoordinates,
          differences: visualDiff,
          severity: 'medium',
          message: `Visual property mismatch for ${selector}[${i}]: ${visualDiff.join(', ')}`
        });
      }
      
      // Compare typography
      const typoDiff = compareTypography(remote.typography, local.typography);
      if (typoDiff.length > 0) {
        differences.push({
          type: 'typography_mismatch',
          selector: selector,
          index: i,
          remote: remote.gridCoordinates,
          local: local.gridCoordinates,
          differences: typoDiff,
          severity: 'medium',
          message: `Typography mismatch for ${selector}[${i}]: ${typoDiff.join(', ')}`
        });
      }
    }
  });
  
  return differences;
}

function comparePositions(remotePos, localPos, remoteGrid, localGrid) {
  const diffs = [];
  const threshold = 5; // 5px tolerance
  
  if (Math.abs(remotePos.x - localPos.x) > threshold) {
    diffs.push(`X position: Remote ${remotePos.x}px, Local ${localPos.x}px (diff: ${Math.round(remotePos.x - localPos.x)}px)`);
  }
  
  if (Math.abs(remotePos.y - localPos.y) > threshold) {
    diffs.push(`Y position: Remote ${remotePos.y}px, Local ${localPos.y}px (diff: ${Math.round(remotePos.y - localPos.y)}px)`);
  }
  
  if (remoteGrid.range !== localGrid.range) {
    diffs.push(`Grid coordinates: Remote ${remoteGrid.range}, Local ${localGrid.range}`);
  }
  
  return diffs;
}

function compareDimensions(remotePos, localPos) {
  const diffs = [];
  const threshold = 5; // 5px tolerance
  
  if (Math.abs(remotePos.width - localPos.width) > threshold) {
    diffs.push(`Width: Remote ${Math.round(remotePos.width)}px, Local ${Math.round(localPos.width)}px (diff: ${Math.round(remotePos.width - localPos.width)}px)`);
  }
  
  if (Math.abs(remotePos.height - localPos.height) > threshold) {
    diffs.push(`Height: Remote ${Math.round(remotePos.height)}px, Local ${Math.round(localPos.height)}px (diff: ${Math.round(remotePos.height - localPos.height)}px)`);
  }
  
  return diffs;
}

function compareVisual(remote, local) {
  const diffs = [];
  const props = ['width', 'height', 'maxWidth', 'maxHeight', 'margin', 'padding', 'textAlign'];
  
  props.forEach(prop => {
    if (remote[prop] !== local[prop]) {
      diffs.push(`${prop}: Remote "${remote[prop]}", Local "${local[prop]}"`);
    }
  });
  
  return diffs;
}

function compareTypography(remote, local) {
  const diffs = [];
  const props = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color'];
  
  props.forEach(prop => {
    if (remote[prop] !== local[prop]) {
      diffs.push(`${prop}: Remote "${remote[prop]}", Local "${local[prop]}"`);
    }
  });
  
  return diffs;
}

/**
 * Generate human-readable difference report
 */
function generateDifferenceReport(differences, remoteData, localData) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDifferences: differences.length,
      byType: {},
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0
      }
    },
    differences: differences,
    recommendations: []
  };
  
  // Count by type and severity
  differences.forEach(diff => {
    report.summary.byType[diff.type] = (report.summary.byType[diff.type] || 0) + 1;
    report.summary.bySeverity[diff.severity] = (report.summary.bySeverity[diff.severity] || 0) + 1;
  });
  
  // Generate recommendations
  const highPriority = differences.filter(d => d.severity === 'high');
  if (highPriority.length > 0) {
    report.recommendations.push({
      priority: 'high',
      action: 'Fix high-priority differences first',
      count: highPriority.length,
      examples: highPriority.slice(0, 5).map(d => d.message)
    });
  }
  
  // Group by selector for easier fixing
  const bySelector = {};
  differences.forEach(diff => {
    if (!bySelector[diff.selector]) {
      bySelector[diff.selector] = [];
    }
    bySelector[diff.selector].push(diff);
  });
  
  report.bySelector = bySelector;
  
  return report;
}

/**
 * Execute Phase 6: Visual Comparison
 */
async function execute({ originalUrl, targetDir, config, updateSetup, previousResults }) {
  console.log('Phase 6: Visual Layout Comparison (Fehlersuch Bild)');
  console.log('='.repeat(60));
  
  const localHTMLPath = path.join(targetDir, 'index.html');
  
  // Check if local HTML exists
  if (!(await fileExists(localHTMLPath))) {
    throw new Error(`Local HTML not found: ${localHTMLPath}. Run Phase 2 first.`);
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  try {
    // Extract from remote site
    console.log('📡 Extracting visual properties from remote site...');
    const remotePage = await browser.newPage();
    await remotePage.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await remotePage.waitForTimeout(2000); // Wait for any dynamic content
    
    const remoteData = await remotePage.evaluate(extractVisualPropertiesScript);
    await remotePage.close();
    
    // Extract from local site
    console.log('📡 Extracting visual properties from local site...');
    const localPage = await browser.newPage();
    const absoluteLocalHTMLPath = path.resolve(localHTMLPath);
    const localHTMLUrl = `file://${absoluteLocalHTMLPath}`;
    await localPage.goto(localHTMLUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await localPage.waitForTimeout(2000);
    
    const localData = await localPage.evaluate(extractVisualPropertiesScript);
    await localPage.close();
    
    // Compare
    console.log('🔍 Comparing remote vs local...');
    const differences = compareVisualProperties(remoteData, localData);
    
    // Generate report
    const report = generateDifferenceReport(differences, remoteData, localData);
    
    // CMM3: Always save report to ensure correct state
    const reportPath = path.join(targetDir, 'visual-comparison-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n💾 Saved visual comparison report to: ${reportPath}`);
    
    console.log(`\n📊 Comparison Results:`);
    console.log(`   Total Differences: ${report.summary.totalDifferences}`);
    console.log(`   High Priority: ${report.summary.bySeverity.high}`);
    console.log(`   Medium Priority: ${report.summary.bySeverity.medium}`);
    console.log(`   Low Priority: ${report.summary.bySeverity.low}`);
    
    if (report.summary.totalDifferences > 0) {
      console.log(`\n⚠️  Differences found:`);
      report.summary.byType && Object.entries(report.summary.byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      
      // Show top 10 differences
      console.log(`\n🔎 Top differences:`);
      differences.slice(0, 10).forEach((diff, i) => {
        console.log(`   ${i + 1}. [${diff.severity.toUpperCase()}] ${diff.message}`);
      });
    } else {
      console.log(`\n✅ No differences found! Pages are visually identical.`);
    }
    
    return {
      success: true,
      data: {
        remote: remoteData,
        local: localData,
        differences: differences,
        report: report
      },
      timestamp: new Date().toISOString()
    };
    
  } finally {
    await browser.close();
  }
}

module.exports = {
  execute
};


