/**
 * File utility functions
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Load JSON file
 */
async function loadJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save JSON file
 */
async function saveJSON(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load configuration
 */
async function loadConfig(targetDir, providedConfig = {}) {
  const defaultConfig = {
    originalUrl: null,
    targetDir: targetDir,
    mode: "auto",
    update: {
      backupBeforeUpdate: true,
      cleanupRemovedAssets: false,
      preserveUnchangedAssets: true,
      hashVerification: true
    },
    assetPaths: {
      fonts: "images/fonts/",
      images: "images/",
      css: "styles/"
    },
    verification: {
      fontLoading: true,
      imageLoading: true,
      cssMatchThreshold: 100.0
    },
    comparison: {
      properties: [
        "fontFamily", "fontSize", "fontWeight", "lineHeight",
        "color", "backgroundColor", "margin", "padding",
        "textAlign", "textTransform", "letterSpacing"
      ],
      tolerance: {
        numeric: 0.01,
        color: "exact"
      }
    }
  };

  // Try to load config from target directory
  const configPath = path.join(targetDir, 'reconstruction-config.json');
  const fileConfig = await loadJSON(configPath);

  // Merge: default < file < provided
  return {
    ...defaultConfig,
    ...fileConfig,
    ...providedConfig
  };
}

module.exports = {
  loadJSON,
  saveJSON,
  fileExists,
  loadConfig
};

