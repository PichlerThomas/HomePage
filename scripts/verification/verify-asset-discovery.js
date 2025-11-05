/**
 * Verification: Asset Discovery
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

    if (!data.fonts || !Array.isArray(data.fonts)) {
      errors.push('Fonts array missing or invalid');
    }

    if (!data.images || !Array.isArray(data.images)) {
      errors.push('Images array missing or invalid');
    }

    if (!data.summary) {
      errors.push('Summary missing');
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
};

