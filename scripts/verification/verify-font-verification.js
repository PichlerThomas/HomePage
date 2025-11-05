/**
 * Verification: Font Verification
 */

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

    if (!data.comparison || typeof data.comparison !== 'object') {
      errors.push('Font comparison data missing or invalid');
    }

    if (!data.summary) {
      errors.push('Summary missing');
    }

    // Check if all fonts are loaded
    if (config.verification?.fontLoading && data.summary) {
      if (!data.summary.allFontsLoaded) {
        errors.push('Not all fonts are loaded on local site');
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
};

