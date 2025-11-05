#!/usr/bin/env node

/**
 * CMM3-Compliant Page Reconstruction Script
 * 
 * Automatically reconstructs a webpage by:
 * 1. Discovering all assets (fonts, images, CSS)
 * 2. Downloading assets locally
 * 3. Comparing CSS properties
 * 4. Verifying font loading
 * 5. Applying fixes automatically
 * 
 * Supports update mode for incremental updates with backup/rollback
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Import phase modules
const phase1AssetDiscovery = require('./phases/phase1-asset-discovery');
const phase2AssetDownload = require('./phases/phase2-asset-download');
const phase3CSSComparison = require('./phases/phase3-css-comparison');
const phase4FontVerification = require('./phases/phase4-font-verification');
const phase5FixApplication = require('./phases/phase5-fix-application');

// Import verification modules
const verifyAssetDiscovery = require('./verification/verify-asset-discovery');
const verifyAssetDownload = require('./verification/verify-asset-download');
const verifyCSSComparison = require('./verification/verify-css-comparison');
const verifyFontVerification = require('./verification/verify-font-verification');
const verifyFixApplication = require('./verification/verify-fix-application');

// Import utilities
const { detectMode, setupUpdateMode, adaptPhasesForUpdate } = require('./utils/update-mode');
const { loadConfig, saveJSON } = require('./utils/file-utils');

// Phase definitions
const phases = [
  {
    name: "Asset Discovery",
    script: phase1AssetDiscovery,
    verification: verifyAssetDiscovery,
    output: "assets-inventory.json"
  },
  {
    name: "Asset Download",
    script: phase2AssetDownload,
    verification: verifyAssetDownload,
    output: "assets-downloaded.json"
  },
  {
    name: "CSS Comparison",
    script: phase3CSSComparison,
    verification: verifyCSSComparison,
    output: "css-comparison-report.json"
  },
  {
    name: "Font Verification",
    script: phase4FontVerification,
    verification: verifyFontVerification,
    output: "font-verification-report.json"
  },
  {
    name: "Fix Application",
    script: phase5FixApplication,
    verification: verifyFixApplication,
    output: "fix-application-report.json"
  }
];

/**
 * Main reconstruction function
 */
async function reconstructPage(originalUrl, targetDir, options = {}) {
  const { mode = 'auto', config = {} } = options;
  const results = {
    startTime: new Date().toISOString(),
    originalUrl,
    targetDir,
    mode: null,
    phases: {}
  };

  console.log('\n' + '='.repeat(60));
  console.log('CMM3 Page Reconstruction Script');
  console.log('='.repeat(60));
  console.log(`Original URL: ${originalUrl}`);
  console.log(`Target Directory: ${targetDir}`);
  console.log(`Mode: ${mode}`);

  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Phase 0: Mode Detection (if auto)
  if (mode === 'auto') {
    console.log('\n--- Phase 0: Mode Detection ---');
    const modeDetection = await detectMode(targetDir);
    results.mode = modeDetection.mode;
    results.modeDetection = modeDetection;
    console.log(`Detected mode: ${modeDetection.mode}`);
  } else {
    results.mode = mode;
  }

  // Phase 0.5: Update Mode Setup (if update)
  let updateSetup = null;
  let adaptedPhases = phases;
  if (results.mode === 'update') {
    console.log('\n--- Phase 0.5: Update Mode Setup ---');
    updateSetup = await setupUpdateMode(targetDir);
    results.updateSetup = updateSetup;
    adaptedPhases = adaptPhasesForUpdate(phases, updateSetup);
    console.log(`Backup created: ${updateSetup.backupDir}`);
  }

  // Load configuration
  const fullConfig = await loadConfig(targetDir, config);

  // Execute phases sequentially with verification
  for (let i = 0; i < adaptedPhases.length; i++) {
    const phase = adaptedPhases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Phase ${i + 1}: ${phase.name}`);
    console.log('='.repeat(60));

    try {
      // Execute phase script
      const phaseResult = await phase.script.execute({
        originalUrl,
        targetDir,
        config: {
          ...fullConfig,
          ...(phase.config || {}),
          ...(phase.updateConfig ? { updateConfig: phase.updateConfig } : {})
        },
        updateSetup,
        previousResults: results.phases
      });

      results.phases[phase.name] = phaseResult;

      // Verify phase completion
      const verification = await phase.verification.verify(phaseResult, {
        targetDir,
        config: fullConfig
      });

      if (!verification.passed) {
        console.error(`\n❌ Phase ${phase.name} verification failed:`);
        console.error(verification.errors);
        throw new Error(`Phase ${phase.name} verification failed: ${verification.errors.join(', ')}`);
      }

      console.log(`✅ Phase ${phase.name} completed and verified`);

      // Save phase output
      if (phaseResult.data) {
        await saveJSON(path.join(targetDir, phase.output), phaseResult.data);
        console.log(`📄 Saved: ${phase.output}`);
      }

    } catch (error) {
      console.error(`\n❌ Phase ${phase.name} failed:`, error.message);
      
      // Rollback if in update mode
      if (results.mode === 'update' && updateSetup) {
        console.log('\n⚠️  Attempting rollback...');
        await rollback(targetDir, updateSetup.backupDir);
      }
      
      throw error;
    }
  }

  results.endTime = new Date().toISOString();
  results.duration = new Date(results.endTime) - new Date(results.startTime);

  // Save final results
  await saveJSON(path.join(targetDir, 'reconstruction-results.json'), results);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Reconstruction Complete!');
  console.log('='.repeat(60));
  console.log(`Duration: ${(results.duration / 1000).toFixed(2)}s`);
  console.log(`Results saved to: ${path.join(targetDir, 'reconstruction-results.json')}`);

  return results;
}

/**
 * Rollback function
 */
async function rollback(targetDir, backupDir) {
  console.log(`Rolling back to backup: ${backupDir}`);
  try {
    await fs.copyFile(
      path.join(backupDir, 'index.html'),
      path.join(targetDir, 'index.html')
    );
    await fs.copyFile(
      path.join(backupDir, 'assets-inventory.json'),
      path.join(targetDir, 'assets-inventory.json')
    );
    console.log('✅ Rollback successful');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let originalUrl = null;
  let targetDir = './reconstructed';
  let mode = 'auto';
  let configPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' || args[i] === '-u') {
      originalUrl = args[++i];
    } else if (args[i] === '--target' || args[i] === '-t') {
      targetDir = args[++i];
    } else if (args[i] === '--mode' || args[i] === '-m') {
      mode = args[++i];
    } else if (args[i] === '--config' || args[i] === '-c') {
      configPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: node reconstruct-page.js [options]

Options:
  --url, -u <url>        Original site URL (required)
  --target, -t <dir>     Target directory (default: ./reconstructed)
  --mode, -m <mode>      Mode: auto|create|update (default: auto)
  --config, -c <file>    Configuration file path
  --help, -h             Show this help message

Examples:
  node reconstruct-page.js --url https://ceruleancircle.com/ --target ./reconstructed
  node reconstruct-page.js --url https://ceruleancircle.com/ --mode update
  node reconstruct-page.js --url https://ceruleancircle.com/ --mode create --config config.json
      `);
      process.exit(0);
    }
  }

  if (!originalUrl) {
    console.error('❌ Error: --url is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  if (!['auto', 'create', 'update'].includes(mode)) {
    console.error(`❌ Error: Invalid mode "${mode}". Must be: auto, create, or update`);
    process.exit(1);
  }

  // Load config if provided
  let config = {};
  if (configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configContent);
    } catch (error) {
      console.error(`❌ Error loading config file: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    await reconstructPage(originalUrl, targetDir, { mode, config });
  } catch (error) {
    console.error('\n❌ Reconstruction failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { reconstructPage };

