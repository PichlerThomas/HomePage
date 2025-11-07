#!/usr/bin/env node

/**
 * Run Phase 6: Visual Comparison
 * Regenerates visual-comparison-report.json with grid coordinates
 */

const phase6VisualComparison = require('./scripts/phases/phase6-visual-comparison');
const path = require('path');

async function runPhase6() {
  const originalUrl = 'https://ceruleancircle.com/';
  const targetDir = __dirname; // Current directory (HomePage)
  
  console.log('🔄 Regenerating visual comparison report...');
  console.log(`   URL: ${originalUrl}`);
  console.log(`   Target: ${targetDir}`);
  console.log('');
  
  try {
    const result = await phase6VisualComparison.execute({
      originalUrl,
      targetDir,
      config: {},
      previousResults: {}
    });
    
    if (result.success) {
      console.log('\n✅ Visual comparison report regenerated successfully!');
      console.log(`   Report saved to: ${path.join(targetDir, 'visual-comparison-report.json')}`);
      console.log(`   Total differences: ${result.data.report.summary.totalDifferences}`);
    } else {
      console.error('\n❌ Failed to regenerate report');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

runPhase6();

