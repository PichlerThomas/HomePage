/**
 * Verification: Asset Download
 */

const fs = require('fs').promises;
const path = require('path');

module.exports = {
  verify: async (phaseResult, { targetDir, config }) => {
    if (!phaseResult.success) {
      return {
        passed: false,
        errors: ['Phase execution failed']
      };
    }

    const data = phaseResult.data;
    const errors = [];

    // Verify download report structure
    if (!data.fonts || !Array.isArray(data.fonts)) {
      errors.push('Fonts array missing or invalid');
    }

    if (!data.images || !Array.isArray(data.images)) {
      errors.push('Images array missing or invalid');
    }

    if (!data.summary) {
      errors.push('Summary missing');
    }

    // Verify downloaded files exist
    if (data.fonts) {
      for (const font of data.fonts) {
        if (font.status === 'downloaded' && font.localPath) {
          const filePath = path.join(targetDir, font.localPath);
          try {
            await fs.access(filePath);
          } catch (e) {
            errors.push(`Font file not found: ${font.localPath}`);
          }
        }
      }
    }

    if (data.images) {
      for (const image of data.images) {
        if (image.status === 'downloaded' && image.localPath) {
          const filePath = path.join(targetDir, image.localPath);
          try {
            await fs.access(filePath);
          } catch (e) {
            errors.push(`Image file not found: ${image.localPath}`);
          }
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
};

