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

    // Check if all used fonts are loaded (only fail if fonts that are actually used are not loaded)
    if (config.verification?.fontLoading && data.summary) {
      // Check if all used fonts are loaded
      if (data.summary.usedFonts !== undefined) {
        if (!data.summary.allUsedFontsLoaded) {
          // Find which used fonts are not loaded
          const failedFonts = [];
          if (data.comparison) {
            Object.entries(data.comparison).forEach(([family, comp]) => {
              if (comp.used && comp.local && !comp.local.loaded) {
                failedFonts.push(family);
              }
            });
          }
          if (failedFonts.length > 0) {
            errors.push(`Used fonts not loaded: ${failedFonts.join(', ')}`);
          } else {
            // If usedFontsLoaded doesn't match, but we can't find specific failures, warn
            console.warn('⚠️  Some used fonts may not be loaded, but specific fonts not identified');
          }
        }
      } else if (!data.summary.allFontsLoaded) {
        // Fallback: if we don't have used font info, just warn
        console.warn('⚠️  Some fonts not loaded, but they may not be used in the page');
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
};

