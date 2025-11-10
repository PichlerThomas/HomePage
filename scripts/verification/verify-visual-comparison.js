/**
 * Verification for Phase 6: Visual Comparison
 */

async function verify(result, context) {
  const errors = [];
  const warnings = [];
  
  if (!result || !result.success) {
    errors.push('Phase 6 execution failed');
    return { passed: false, errors, warnings };
  }
  
  if (!result.data) {
    errors.push('Phase 6 result missing data');
    return { passed: false, errors, warnings };
  }
  
  if (!result.data.remote) {
    errors.push('Remote data not extracted');
  }
  
  if (!result.data.local) {
    errors.push('Local data not extracted');
  }
  
  if (!Array.isArray(result.data.differences)) {
    errors.push('Differences array missing or invalid');
  }
  
  if (!result.data.report) {
    errors.push('Difference report missing');
  }
  
  // Warnings for high-priority differences
  if (result.data.report && result.data.report.summary) {
    const highPriority = result.data.report.summary.bySeverity?.high || 0;
    if (highPriority > 0) {
      warnings.push(`${highPriority} high-priority visual differences detected`);
    }
  }
  
  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  verify
};



