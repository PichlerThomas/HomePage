# Visual Comparison ("Fehlersuch Bild") Guide

## Overview

Phase 6 of the reconstruction script automatically compares the remote and local pages to identify visual differences - like a "spot the difference" puzzle. This enables systematic, iterative improvement.

## How It Works

1. **Extracts visual properties** from both remote and local pages
2. **Maps elements to grid coordinates** (matching Creator Mode: A0-L19)
3. **Compares** positions, dimensions, visual properties, and typography
4. **Generates a detailed report** with prioritized differences

## Running Visual Comparison

### As Part of Full Reconstruction:
```bash
cd scripts
node reconstruct-page.js --url https://ceruleancircle.com/ --target ../test
```

### Standalone (on existing page):
```bash
cd scripts
node -e "
const phase6 = require('./phases/phase6-visual-comparison');
phase6.execute({
  originalUrl: 'https://ceruleancircle.com/',
  targetDir: '..',
  config: {},
  previousResults: {}
}).then(result => {
  console.log('Differences:', result.data.differences.length);
  console.log('High Priority:', result.data.report.summary.bySeverity.high);
});
"
```

## Understanding the Report

The `visual-comparison-report.json` contains:

### Summary:
```json
{
  "summary": {
    "totalDifferences": 126,
    "byType": {
      "position_mismatch": 25,
      "dimension_mismatch": 25,
      "visual_mismatch": 26,
      "typography_mismatch": 27
    },
    "bySeverity": {
      "high": 48,
      "medium": 78
    }
  }
}
```

### Difference Types:

1. **position_mismatch**: Element is in different grid coordinates
   - Example: `Remote RF8-RI8, Local LE8-LH8`
   - **Fix**: Adjust CSS positioning/margins

2. **dimension_mismatch**: Element has different width/height
   - Example: `Width: Remote 1296px, Local 800px (diff: 496px)`
   - **Fix**: Update width/height CSS properties

3. **visual_mismatch**: Different visual properties (margin, padding, text-align)
   - Example: `margin: Remote "0px 0px 8px", Local "32px 158px"`
   - **Fix**: Update CSS visual properties

4. **typography_mismatch**: Different fonts, sizes, or colors
   - Example: `fontFamily: Remote "AkkoRoundedPro", Local "Arial"`
   - **Fix**: Update font declarations and CSS

5. **count_mismatch**: Different number of elements
   - Example: `Remote has 1, Local has 3`
   - **Fix**: Check HTML structure

## Iterative Improvement Process

### Step 1: Run Comparison
```bash
node reconstruct-page.js --url https://ceruleancircle.com/ --target ../test
```

### Step 2: Review High-Priority Issues
```bash
cat test/visual-comparison-report.json | jq '.differences[] | select(.severity=="high") | .message' | head -10
```

### Step 3: Fix Issues
Edit `index.html` or CSS based on the report

### Step 4: Re-run and Verify
```bash
# Re-run Phase 6 only
node -e "const phase6 = require('./phases/phase6-visual-comparison'); phase6.execute({originalUrl: 'https://ceruleancircle.com/', targetDir: '../test', config: {}, previousResults: {}}).then(r => console.log('Remaining:', r.data.differences.length));"
```

### Step 5: Iterate
Repeat until `totalDifferences: 0`

## Example: Video Container Fix

**Before:**
- Position: Remote `RF8-RI8`, Local `LE8-LH8` ❌
- Width: Remote `1296px`, Local `800px` ❌

**After Fix:**
- Position: Remote `RF8-RI8`, Local `RF8-RI8` ✅
- Width: Remote `1296px`, Local `1296px` ✅

## Tips

1. **Focus on High Priority First**: Position and dimension mismatches are most visible
2. **Use Grid Coordinates**: Reference Creator Mode coordinates (e.g., "Fix element at RF8")
3. **Group by Selector**: The report groups differences by selector for easier fixing
4. **Check Recommendations**: The report includes fix recommendations

## Integration with Creator Mode

The grid coordinate system matches Creator Mode:
- **Remote coordinates**: Use `R` prefix (e.g., `RA1`, `RF8-RI8`)
- **Local coordinates**: Use `L` prefix (e.g., `LA1`, `LF8-LI8`)

This enables precise communication:
- "Fix video at RF8-RI8" (remote reference)
- "Video should be at RF8-RI8, currently at LE8-LH8" (comparison)

---

**CMM3 Compliant**: Systematic, reproducible, objective difference detection for iterative improvement.



