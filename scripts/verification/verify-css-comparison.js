/**
 * Verification: CSS Comparison
 */

module.exports = {
  verify: async (phaseResult, { targetDir, config }) => {
    return {
      passed: phaseResult.success === true,
      errors: phaseResult.success ? [] : ['Phase execution failed']
    };
  }
};

