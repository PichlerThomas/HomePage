#!/usr/bin/env node

/**
 * Iterative Improvement Script ("Fehlersuch Bild" Loop)
 * 
 * Runs Phase 6 (Visual Comparison) → Phase 5 (Fix Application) → Phase 6
 * in a loop until differences = 0 or max iterations reached.
 * 
 * Usage:
 *   node iterative-improvement.js --url https://ceruleancircle.com/ --target ../test --max-iterations 100
 */

const phase5FixApplication = require('./phases/phase5-fix-application');
const phase6VisualComparison = require('./phases/phase6-visual-comparison');
const { loadJSON } = require('./utils/file-utils');
const path = require('path');
const fs = require('fs').promises;

/**
 * Main iterative improvement loop
 */
async function iterativeImprovement(originalUrl, targetDir, options = {}) {
  const { maxIterations = 100, minImprovement = 0 } = options;
  
  console.log('\n' + '='.repeat(60));
  console.log('Iterative Improvement Loop ("Fehlersuch Bild")');
  console.log('='.repeat(60));
  console.log(`Original URL: ${originalUrl}`);
  console.log(`Target Directory: ${targetDir}`);
  console.log(`Max Iterations: ${maxIterations}`);
  console.log('='.repeat(60) + '\n');

  let iteration = 0;
  let previousDifferences = Infinity;
  let allResults = [];

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Iteration ${iteration}/${maxIterations}`);
    console.log('='.repeat(60));

    try {
      // Step 1: Run Phase 6 - Visual Comparison
      console.log('\n📊 Step 1: Running Visual Comparison (Phase 6)...');
      const comparisonResult = await phase6VisualComparison.execute({
        originalUrl,
        targetDir,
        config: {},
        previousResults: {}
      });

      if (!comparisonResult.success) {
        console.error('❌ Phase 6 failed');
        break;
      }

      const currentDifferences = comparisonResult.data.differences.length;
      const highPriority = comparisonResult.data.report.summary.bySeverity.high || 0;
      const mediumPriority = comparisonResult.data.report.summary.bySeverity.medium || 0;

      // Save visual comparison report for Phase 5 to use
      const reportPath = path.join(targetDir, 'visual-comparison-report.json');
      await fs.writeFile(reportPath, JSON.stringify(comparisonResult.data.report, null, 2));

      console.log(`\n📊 Current Status:`);
      console.log(`   Total Differences: ${currentDifferences}`);
      console.log(`   High Priority: ${highPriority}`);
      console.log(`   Medium Priority: ${mediumPriority}`);

      // Check if we're done
      if (currentDifferences === 0) {
        console.log(`\n🎉 SUCCESS! No differences found after ${iteration} iterations!`);
        allResults.push({
          iteration,
          differences: currentDifferences,
          status: 'complete'
        });
        break;
      }

      // Check if we're improving
      const improvement = previousDifferences - currentDifferences;
      if (improvement < minImprovement && iteration > 1) {
        console.log(`\n⚠️  No significant improvement (${improvement} differences). Stopping.`);
        allResults.push({
          iteration,
          differences: currentDifferences,
          status: 'no_improvement'
        });
        break;
      }

      previousDifferences = currentDifferences;

      // Step 2: Run Phase 5 - Apply Fixes
      console.log(`\n🔧 Step 2: Applying Fixes (Phase 5)...`);
      const fixResult = await phase5FixApplication.execute({
        originalUrl,
        targetDir,
        config: {},
        previousResults: {
          'Visual Comparison': comparisonResult
        }
      });

      if (!fixResult.success) {
        console.error('❌ Phase 5 failed');
        break;
      }

      const fixesApplied = (fixResult.data.summary.visualFixesApplied || 0) + 
                          (fixResult.data.summary.cssFixesApplied || 0);
      console.log(`   Applied ${fixesApplied} fixes`);

      // Save iteration results
      allResults.push({
        iteration,
        differences: currentDifferences,
        highPriority,
        mediumPriority,
        fixesApplied,
        improvement
      });

      // Show top differences for awareness
      if (currentDifferences > 0) {
        console.log(`\n🔍 Top 5 High-Priority Differences:`);
        comparisonResult.data.differences
          .filter(d => d.severity === 'high')
          .slice(0, 5)
          .forEach((diff, i) => {
            console.log(`   ${i + 1}. ${diff.message}`);
          });
      }

      // Brief pause between iterations
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`\n❌ Error in iteration ${iteration}:`, error.message);
      allResults.push({
        iteration,
        error: error.message,
        status: 'error'
      });
      break;
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Final Summary');
  console.log('='.repeat(60));
  console.log(`Total Iterations: ${iteration}`);
  console.log(`Final Differences: ${previousDifferences}`);
  
  if (previousDifferences === 0) {
    console.log(`\n✅ SUCCESS: Page fully recreated!`);
  } else if (iteration >= maxIterations) {
    console.log(`\n⚠️  Reached max iterations (${maxIterations}). ${previousDifferences} differences remain.`);
  }

  // Save iteration history
  const historyPath = path.join(targetDir, 'iteration-history.json');
  await fs.writeFile(historyPath, JSON.stringify({
    originalUrl,
    targetDir,
    maxIterations,
    totalIterations: iteration,
    finalDifferences: previousDifferences,
    results: allResults
  }, null, 2));

  console.log(`\n📄 Iteration history saved to: ${historyPath}`);

  return {
    success: previousDifferences === 0,
    iterations: iteration,
    finalDifferences: previousDifferences,
    results: allResults
  };
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  
  let originalUrl = null;
  let targetDir = './test-iterative';
  let maxIterations = 100;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' || args[i] === '-u') {
      originalUrl = args[++i];
    } else if (args[i] === '--target' || args[i] === '-t') {
      targetDir = args[++i];
    } else if (args[i] === '--max-iterations' || args[i] === '-m') {
      maxIterations = parseInt(args[++i]) || 100;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node iterative-improvement.js [options]

Options:
  --url, -u <url>              Original site URL (required)
  --target, -t <dir>           Target directory (default: ./test-iterative)
  --max-iterations, -m <num>   Maximum iterations (default: 100)
  --help, -h                   Show this help message

Examples:
  node iterative-improvement.js --url https://ceruleancircle.com/ --target ../test
  node iterative-improvement.js --url https://ceruleancircle.com/ --max-iterations 50
      `);
      process.exit(0);
    }
  }

  if (!originalUrl) {
    console.error('❌ Error: --url is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  try {
    const result = await iterativeImprovement(originalUrl, targetDir, { maxIterations });
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { iterativeImprovement };

