/**
 * Verification: CSS Comparison
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
      errors.push('Comparison data missing or invalid');
    }

    if (!data.summary) {
      errors.push('Summary missing');
    }

    if (data.summary && config.verification?.cssMatchThreshold) {
      const matchPercentage = parseFloat(data.summary.overallMatchPercentage);
      const threshold = config.verification.cssMatchThreshold;
      if (matchPercentage < threshold) {
        errors.push(`Match percentage ${matchPercentage}% below threshold ${threshold}%`);
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
};

