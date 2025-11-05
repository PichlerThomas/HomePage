/**
 * Update mode detection and setup utilities
 */

const fs = require('fs').promises;
const path = require('path');
const { loadJSON, fileExists } = require('./file-utils');

/**
 * Detect mode (create vs update)
 */
async function detectMode(targetDir) {
  const indexExists = await fileExists(path.join(targetDir, 'index.html'));
  const inventoryExists = await fileExists(path.join(targetDir, 'assets-inventory.json'));

  return {
    mode: indexExists && inventoryExists ? 'update' : 'create',
    indexExists,
    inventoryExists,
    timestamp: new Date().toISOString()
  };
}

/**
 * Setup update mode
 */
async function setupUpdateMode(targetDir) {
  // Load existing inventory
  const existingInventory = await loadJSON(path.join(targetDir, 'assets-inventory.json'));
  
  if (!existingInventory) {
    throw new Error('Cannot setup update mode: assets-inventory.json not found');
  }

  // Create backup directory
  const backupDir = path.join(targetDir, '.backup', Date.now().toString());
  await fs.mkdir(backupDir, { recursive: true });

  // Backup files
  const filesToBackup = ['index.html', 'assets-inventory.json'];
  for (const file of filesToBackup) {
    const sourcePath = path.join(targetDir, file);
    if (await fileExists(sourcePath)) {
      await fs.copyFile(sourcePath, path.join(backupDir, file));
    }
  }

  return {
    existingInventory,
    backupDir,
    backupTimestamp: new Date().toISOString()
  };
}

/**
 * Adapt phases for update mode
 */
function adaptPhasesForUpdate(phases, updateSetup) {
  // Create a copy of phases array
  const adaptedPhases = phases.map(phase => ({ ...phase }));

  // Modify Phase 2 (Asset Download) for update mode
  if (adaptedPhases[1]) {
    adaptedPhases[1].config = {
      existingInventory: updateSetup.existingInventory,
      downloadOnly: ["new", "modified"],
      preserveUnchanged: true
    };
  }

  // Modify Phase 3 (CSS Comparison) for update mode
  if (adaptedPhases[2]) {
    adaptedPhases[2].config = {
      compareWithExisting: true,
      existingHTML: path.join(updateSetup.backupDir, 'index.html')
    };
  }

  return adaptedPhases;
}

module.exports = {
  detectMode,
  setupUpdateMode,
  adaptPhasesForUpdate
};

