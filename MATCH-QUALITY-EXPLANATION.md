# Match Quality System - How It Works

## Overview

The match quality system is a **combination of automated detection (Phase 6) and manual scoring rules (Visual Feedback Script)**.

## Part 1: Automated Severity Detection (Phase 6)

The **Phase 6 visual comparison script** (`phase6-visual-comparison.js`) automatically assigns severity levels based on the **type** of difference:

### Severity Assignment Rules (in Phase 6):

```javascript
// Dimension mismatches → HIGH severity
if (dimDiff.length > 0) {
  differences.push({
    type: 'dimension_mismatch',
    severity: 'high',  // ← Automatically assigned
    ...
  });
}

// Position mismatches → HIGH if grid coordinates differ, MEDIUM if just pixels
if (posDiff.length > 0) {
  differences.push({
    type: 'position_mismatch',
    severity: posDiff.some(d => d.includes('grid')) ? 'high' : 'medium',
    ...
  });
}

// Visual/typography mismatches → MEDIUM severity
if (visualDiff.length > 0) {
  differences.push({
    type: 'visual_mismatch',
    severity: 'medium',  // ← Automatically assigned
    ...
  });
}
```

### Severity Breakdown:
- **HIGH**: Dimension mismatches, grid coordinate mismatches, count mismatches, missing elements
- **MEDIUM**: Visual property mismatches, typography mismatches, small position differences
- **LOW**: (Not currently used, but reserved for very minor differences)

## Part 2: Manual Score Mapping (Visual Feedback Script)

I **manually created** the score mapping in `creator-mode-visual-feedback.js`:

```javascript
// Lines 73-81: Manual score assignment
let severityScore = 1.0;
if (diff.severity === 'high') {
  severityScore = 0.2;  // ← I chose this value
} else if (diff.severity === 'medium') {
  severityScore = 0.6;  // ← I chose this value
} else if (diff.severity === 'low') {
  severityScore = 0.8;  // ← I chose this value
}
```

### Score to Color Mapping (also manual):

```javascript
// Lines 116-153: Manual color thresholds
if (score >= 0.9) {
  return green;      // 90-100% = Good match
} else if (score >= 0.7) {
  return lightGreen; // 70-90% = Minor issues
} else if (score >= 0.5) {
  return yellow;     // 50-70% = Medium issues
} else if (score >= 0.3) {
  return orange;     // 30-50% = Significant issues
} else {
  return red;        // 0-30% = Major issues
}
```

## Summary

**What's Automated:**
- ✅ Phase 6 detects differences and assigns severity (high/medium/low)
- ✅ Severity is based on difference type (dimension = high, typography = medium, etc.)

**What I Created Manually:**
- ✅ Score mapping: high=0.2, medium=0.6, low=0.8
- ✅ Color thresholds: 0.9=green, 0.7=yellow, 0.5=orange, 0.3=red
- ✅ Color values (RGB/opacity)

## Could This Be Improved?

Yes! We could make it more data-driven:

1. **Calculate scores based on actual difference magnitude:**
   - Instead of fixed 0.2/0.6/0.8, calculate based on pixel differences
   - Example: 568px height difference → lower score than 5px difference

2. **Weight different difference types:**
   - Dimension mismatches might be more critical than typography
   - Position mismatches might be more visible than font fallbacks

3. **Use percentage-based scoring:**
   - Calculate: `score = 1 - (actualDifference / maxTolerance)`
   - More accurate representation of match quality

4. **Aggregate multiple differences per cell:**
   - Currently uses `Math.min()` (worst score wins)
   - Could average or weight multiple issues

Would you like me to enhance the scoring system to be more data-driven?

