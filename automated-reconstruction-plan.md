# Automated Page Reconstruction Script - CMM3 Plan

## **Learning from Experience**

### **Critical Failures Identified:**
1. **Font Loading:** Did not check for @font-face declarations initially - fonts were referenced but not loaded
2. **Asset Extraction:** Did not systematically extract all assets (fonts, images, CSS) in one pass
3. **Property Comparison:** Compared CSS properties individually instead of programmatically extracting all properties
4. **Verification:** Did not verify font loading status with Font Loading API before assuming fonts matched
5. **Assumptions:** Made assumptions about font availability instead of programmatically checking

### **What Worked:**
1. Step-by-step element-by-element comparison methodology
2. Programmatic CSS extraction using browser automation
3. Systematic property-by-property verification
4. Local development server for fast feedback

## **CMM3 Process Definition**

### **CMM3 Requirements:**
- **Defined Process:** Documented, standardized procedure
- **Repeatable:** Same inputs produce same outputs
- **Verifiable:** Objective verification at each step
- **Traceable:** Each step can be traced to requirements
- **Measurable:** Success criteria defined quantitatively

## **Automated Reconstruction Script Plan**

### **Phase 1: Asset Discovery and Extraction**

**Objective:** Programmatically discover and extract all assets from the original site.

**Process Steps:**
1. **CSS Extraction**
   - Extract all @font-face declarations
   - Extract all @import statements
   - Extract all CSS rules with their selectors
   - Document font-family, font-weight, src URLs
   - Document background-image URLs
   - Document any external resource references

2. **Font Asset Discovery**
   - Parse @font-face src URLs
   - Extract font file paths
   - Record font-family, font-weight, font-style mappings
   - Verify font file accessibility (HTTP status check)

3. **Image Asset Discovery**
   - Extract all `<img src>` attributes
   - Extract all CSS `background-image` URLs
   - Extract all `<link rel="icon">` and favicon references
   - Extract all `<source>` elements for responsive images
   - Extract inline data URIs (document but don't download)

4. **Asset Inventory**
   - Create structured JSON inventory:
     ```json
     {
       "fonts": [
         {
           "family": "Synchroplain",
           "weight": "normal|500",
           "style": "normal",
           "src": "url(...)",
           "localPath": "images/fonts/...",
           "httpStatus": 200
         }
       ],
       "images": [
         {
           "element": "img.logo",
           "src": "url(...)",
           "localPath": "images/...",
           "httpStatus": 200,
           "dimensions": { "width": 322, "height": 322 }
         }
       ],
       "css": {
         "externalStylesheets": [...],
         "inlineStyles": "...",
         "computedStyles": {...}
       }
     }
     ```

**Verification Criteria:**
- ✅ All @font-face declarations extracted
- ✅ All font file URLs accessible (HTTP 200)
- ✅ All image URLs extracted
- ✅ All image URLs accessible (HTTP 200)
- ✅ Asset inventory JSON created and validated

**Output:** `assets-inventory.json`

---

### **Phase 2: Asset Download and Localization**

**Objective:** Download all external assets and update paths to local references.

**Process Steps:**
1. **Font Download**
   - Create `images/fonts/` directory structure
   - Download each font file with proper filename handling
   - Verify file integrity (file type, size)
   - Generate @font-face declarations with local paths

2. **Image Download**
   - Create appropriate directory structure (`images/`, `images/books/`, etc.)
   - Download each image with proper filename
   - Verify file integrity (image format, dimensions)
   - Preserve relative path structure

3. **Path Update**
   - Update all @font-face src URLs to local paths
   - Update all `<img src>` attributes to local paths
   - Update all CSS background-image URLs to local paths
   - Update favicon references

**Verification Criteria:**
- ✅ All font files downloaded and verified
- ✅ All image files downloaded and verified
- ✅ All paths updated to local references
- ✅ No broken asset references (404 errors)

**Output:** Updated HTML with local asset paths

---

### **Phase 3: CSS Property Extraction and Comparison**

**Objective:** Extract all CSS properties from original site and compare with local site.

**Process Steps:**
1. **Element Identification**
   - Identify all styled elements using CSS selectors
   - Create element mapping: `{ selector: ".intro .heading", element: <HTMLElement> }`
   - Document element hierarchy and relationships

2. **Property Extraction**
   - For each element, extract all computed styles:
     - Typography: font-family, font-size, font-weight, line-height, letter-spacing, text-transform, text-align
     - Colors: color, background-color, background-image
     - Layout: margin, padding, width, height, display, position
     - Visual: border, box-shadow, opacity, transform
   - Extract from both original and local sites
   - Normalize values (e.g., "white" → "rgb(255, 255, 255)")

3. **Property Comparison**
   - Compare each property programmatically
   - Generate comparison report:
     ```json
     {
       "selector": ".intro .heading",
       "properties": {
         "fontFamily": { "original": "Synchroplain", "local": "Synchroplain", "match": true },
         "fontSize": { "original": "60px", "local": "60px", "match": true },
         "fontWeight": { "original": "500", "local": "500", "match": true },
         "textAlign": { "original": "center", "local": "start", "match": false }
       },
       "matchPercentage": 75.0
     }
     ```

**Verification Criteria:**
- ✅ All styled elements identified
- ✅ All relevant CSS properties extracted
- ✅ Comparison report generated with match percentages
- ✅ Discrepancies clearly documented

**Output:** `css-comparison-report.json`

---

### **Phase 4: Font Loading Verification**

**Objective:** Verify that custom fonts are actually loaded and rendering.

**Process Steps:**
1. **Font Loading Check**
   - Use Font Loading API: `document.fonts.check()`
   - Verify each font-family is loaded
   - Check font-weight variants are available
   - Document font loading status

2. **Font Rendering Verification**
   - Compare computed font-family with expected
   - Verify no fallback fonts are being used
   - Check font metrics (if available via API)

**Verification Criteria:**
- ✅ All custom fonts loaded (Font Loading API check)
- ✅ No fallback fonts detected
- ✅ Font-family matches expected values

**Output:** `font-verification-report.json`

---

### **Phase 5: Automated Fix Application**

**Objective:** Apply fixes automatically based on comparison report.

**Process Steps:**
1. **Fix Generation**
   - For each discrepancy in comparison report, generate fix:
     - CSS property update
     - HTML attribute update
     - Asset path update
   - Document fix rationale

2. **Fix Application**
   - Apply CSS fixes to `<style>` block or external stylesheet
   - Apply HTML fixes to element attributes
   - Verify fix applied correctly

3. **Re-verification**
   - Re-run comparison after fixes
   - Verify match percentage improved
   - Document fix effectiveness

**Verification Criteria:**
- ✅ All identified discrepancies addressed
- ✅ Match percentage improved (target: 100%)
- ✅ Re-verification confirms fixes

**Output:** Updated HTML/CSS files, `fix-application-report.json`

---

## **Script Architecture**

### **Main Script: `reconstruct-page.js`**

```javascript
// CMM3-compliant page reconstruction script
// Input: Original site URL, Target directory
// Output: Reconstructed HTML + assets + verification reports

const phases = [
  {
    name: "Asset Discovery",
    script: "phase1-asset-discovery.js",
    verification: "verify-asset-discovery.js",
    output: "assets-inventory.json"
  },
  {
    name: "Asset Download",
    script: "phase2-asset-download.js",
    verification: "verify-asset-download.js",
    output: "assets-downloaded.json"
  },
  {
    name: "CSS Comparison",
    script: "phase3-css-comparison.js",
    verification: "verify-css-comparison.js",
    output: "css-comparison-report.json"
  },
  {
    name: "Font Verification",
    script: "phase4-font-verification.js",
    verification: "verify-font-verification.js",
    output: "font-verification-report.json"
  },
  {
    name: "Fix Application",
    script: "phase5-fix-application.js",
    verification: "verify-fix-application.js",
    output: "fix-application-report.json"
  }
];

// Execute phases sequentially with verification
async function reconstructPage(originalUrl, targetDir) {
  const results = {};
  
  for (const phase of phases) {
    console.log(`\n=== Phase: ${phase.name} ===`);
    
    // Execute phase script
    const phaseResult = await executePhase(phase.script, originalUrl, targetDir);
    results[phase.name] = phaseResult;
    
    // Verify phase completion
    const verification = await verifyPhase(phase.verification, phaseResult);
    if (!verification.passed) {
      throw new Error(`Phase ${phase.name} verification failed: ${verification.errors}`);
    }
    
    // Save phase output
    await saveOutput(phase.output, phaseResult);
  }
  
  return results;
}
```

### **Verification Scripts**

Each phase has a corresponding verification script that:
1. Checks phase output format
2. Validates all required data present
3. Verifies success criteria met
4. Returns pass/fail with detailed error messages

### **Configuration**

```json
{
  "originalUrl": "https://ceruleancircle.com/",
  "targetDir": "./reconstructed",
  "assetPaths": {
    "fonts": "images/fonts/",
    "images": "images/",
    "css": "styles/"
  },
  "verification": {
    "fontLoading": true,
    "imageLoading": true,
    "cssMatchThreshold": 100.0
  },
  "comparison": {
    "properties": [
      "fontFamily", "fontSize", "fontWeight", "lineHeight",
      "color", "backgroundColor", "margin", "padding",
      "textAlign", "textTransform", "letterSpacing"
    ],
    "tolerance": {
      "numeric": 0.01,
      "color": "exact"
    }
  }
}
```

---

## **CMM3 Compliance Checklist**

### **Process Definition:**
- ✅ Each phase has defined inputs, outputs, and verification criteria
- ✅ Process is documented and repeatable
- ✅ Each step has measurable success criteria

### **Verification:**
- ✅ Objective verification at each phase
- ✅ Automated verification scripts
- ✅ Verification reports generated

### **Traceability:**
- ✅ Each fix traces to specific discrepancy
- ✅ Asset inventory documents all dependencies
- ✅ Comparison reports show exact property differences

### **Reproducibility:**
- ✅ Same inputs produce same outputs
- ✅ Configuration file enables reproducibility
- ✅ All external dependencies documented

---

## **Implementation Priority**

1. **Phase 1 (Asset Discovery)** - CRITICAL - Must extract fonts immediately
2. **Phase 2 (Asset Download)** - CRITICAL - Must download fonts before CSS comparison
3. **Phase 4 (Font Verification)** - HIGH - Must verify fonts loaded before assuming match
4. **Phase 3 (CSS Comparison)** - HIGH - Systematic comparison prevents assumptions
5. **Phase 5 (Fix Application)** - MEDIUM - Can be manual initially, automate later

---

## **Key Lessons Applied**

1. **Check @font-face FIRST** - Don't assume fonts are available
2. **Extract ALL assets programmatically** - Don't rely on manual inspection
3. **Verify font loading** - Use Font Loading API, don't assume
4. **Compare systematically** - Extract all properties, compare programmatically
5. **Document everything** - Create structured reports for traceability

---

## **Next Steps**

1. Implement Phase 1 (Asset Discovery) script
2. Implement Phase 2 (Asset Download) script
3. Implement Phase 4 (Font Verification) script
4. Test with Cerulean Circle homepage
5. Refine based on results

