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
1. **Asset Comparison (Update Mode Only)**
   - Compare new asset inventory with existing `assets-inventory.json`
   - Calculate hash for existing files
   - Identify new, modified, and unchanged assets
   - Generate download list: only new/modified assets

2. **Font Download**
   - Create `images/fonts/` directory structure
   - Download each font file (all in create mode, only new/modified in update mode)
   - Verify file integrity (file type, size)
   - Preserve existing font files if unchanged (update mode)
   - Generate @font-face declarations with local paths

3. **Image Download**
   - Create appropriate directory structure (`images/`, `images/books/`, etc.)
   - Download each image (all in create mode, only new/modified in update mode)
   - Verify file integrity (image format, dimensions)
   - Preserve existing images if unchanged (update mode)
   - Preserve relative path structure

4. **Path Update**
   - Update all @font-face src URLs to local paths
   - Update all `<img src>` attributes to local paths
   - Update all CSS background-image URLs to local paths
   - Update favicon references
   - Preserve existing paths if unchanged (update mode)

**Verification Criteria:**
- ✅ All font files downloaded and verified (or preserved if unchanged)
- ✅ All image files downloaded and verified (or preserved if unchanged)
- ✅ All paths updated to local references
- ✅ No broken asset references (404 errors)
- ✅ Existing assets preserved with hash verification (update mode)
- ✅ Only changed assets downloaded (update mode)

**Output:** Updated HTML with local asset paths, `asset-download-report.json`

---

### **Phase 3: CSS Property Extraction and Comparison**

**Objective:** Extract all CSS properties from original site and compare with local site.

**Process Steps:**
1. **Element Identification**
   - Identify all styled elements using CSS selectors
   - Create element mapping: `{ selector: ".intro .heading", element: <HTMLElement> }`
   - Document element hierarchy and relationships
   - In update mode: also load existing element mapping from previous run

2. **Property Extraction**
   - For each element, extract all computed styles:
     - Typography: font-family, font-size, font-weight, line-height, letter-spacing, text-transform, text-align
     - Colors: color, background-color, background-image
     - Layout: margin, padding, width, height, display, position
     - Visual: border, box-shadow, opacity, transform
   - Extract from both original and local sites
   - In update mode: also extract from existing local HTML (before update)
   - Normalize values (e.g., "white" → "rgb(255, 255, 255)")

3. **Property Comparison**
   - Compare each property programmatically
   - In update mode: Three-way comparison (original vs existing local vs new local)
   - Generate comparison report:
     ```json
     {
       "selector": ".intro .heading",
       "properties": {
         "fontFamily": { 
           "original": "Synchroplain", 
           "existing": "Synchroplain", 
           "local": "Synchroplain", 
           "match": true,
           "changed": false
         },
         "textAlign": { 
           "original": "center", 
           "existing": "start", 
           "local": "center", 
           "match": true,
           "changed": true
         }
       },
       "matchPercentage": 100.0,
       "changeCount": 1
     }
     ```

**Verification Criteria:**
- ✅ All styled elements identified
- ✅ All relevant CSS properties extracted
- ✅ Comparison report generated with match percentages
- ✅ Discrepancies clearly documented
- ✅ Change tracking (update mode): identifies what changed from previous version

**Output:** `css-comparison-report.json`, `css-change-diff.json` (update mode)

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

## **Update Mode - Incremental Updates**

### **Update Mode Detection**

**Objective:** Detect if target page already exists and determine if update mode is needed.

**Process Steps:**
1. **Existence Check**
   - Check if `index.html` exists in target directory
   - Check if `assets-inventory.json` exists (from previous run)
   - Check if `css-comparison-report.json` exists (from previous run)
   - Determine mode: `create` (new) or `update` (existing)

2. **Version Detection**
   - Extract version/timestamp from existing `assets-inventory.json`
   - Compare with original site's modification date (if available)
   - Determine if update is needed or if current version matches

3. **Change Detection**
   - Compare original site's current state with existing `assets-inventory.json`
   - Identify new assets (fonts, images)
   - Identify removed assets
   - Identify modified assets (via hash comparison)

**Verification Criteria:**
- ✅ Mode correctly detected (create vs update)
- ✅ Existing assets inventory loaded
- ✅ Change detection completed
- ✅ Update plan generated

**Output:** `update-mode-detection.json`

---

### **Update Mode Process**

**Objective:** Update existing page incrementally, preserving unchanged assets and only updating what changed.

**Process Steps:**
1. **Asset Comparison**
   - Compare new asset inventory with existing `assets-inventory.json`
   - Identify:
     - New assets (download)
     - Removed assets (mark for cleanup, optional)
     - Modified assets (re-download)
     - Unchanged assets (preserve existing files)

2. **CSS Comparison with Existing**
   - Compare original site CSS with:
     - Existing local HTML's CSS
     - Previous `css-comparison-report.json`
   - Identify:
     - New CSS properties
     - Changed CSS properties
     - Removed CSS properties
     - Unchanged CSS properties

3. **Incremental Updates**
   - Download only new/modified assets
   - Update only changed CSS properties
   - Preserve existing structure where unchanged
   - Generate diff report showing what changed

4. **Backup and Rollback**
   - Create backup of existing `index.html` and assets
   - Store backup timestamp
   - Enable rollback if update fails verification

**Verification Criteria:**
- ✅ Only changed assets downloaded
- ✅ Existing assets preserved (hash verification)
- ✅ CSS updates applied correctly
- ✅ Backup created before changes
- ✅ Rollback mechanism available

**Output:** `update-diff-report.json`, `backup-timestamp.json`

---

## **Script Architecture**

### **Main Script: `reconstruct-page.js`**

```javascript
// CMM3-compliant page reconstruction script
// Input: Original site URL, Target directory, Mode (auto|create|update)
// Output: Reconstructed/Updated HTML + assets + verification reports

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
async function reconstructPage(originalUrl, targetDir, mode = 'auto') {
  const results = {};
  
  // Phase 0: Mode Detection (if auto)
  if (mode === 'auto') {
    const modeDetection = await detectMode(targetDir);
    mode = modeDetection.mode;
    results.modeDetection = modeDetection;
  }
  
  // Phase 0.5: Update Mode Setup (if update)
  if (mode === 'update') {
    const updateSetup = await setupUpdateMode(targetDir);
    results.updateSetup = updateSetup;
    // Modify phases for update mode
    phases = adaptPhasesForUpdate(phases, updateSetup);
  }
  
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
  "mode": "auto",
  "update": {
    "backupBeforeUpdate": true,
    "cleanupRemovedAssets": false,
    "preserveUnchangedAssets": true,
    "hashVerification": true
  },
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

### **Update Mode Functions**

```javascript
// Mode Detection
async function detectMode(targetDir) {
  const indexExists = await fs.exists(path.join(targetDir, 'index.html'));
  const inventoryExists = await fs.exists(path.join(targetDir, 'assets-inventory.json'));
  
  return {
    mode: indexExists && inventoryExists ? 'update' : 'create',
    indexExists,
    inventoryExists,
    timestamp: new Date().toISOString()
  };
}

// Update Mode Setup
async function setupUpdateMode(targetDir) {
  // Load existing inventory
  const existingInventory = await loadJSON(path.join(targetDir, 'assets-inventory.json'));
  
  // Create backup
  const backupDir = path.join(targetDir, '.backup', Date.now().toString());
  await fs.mkdir(backupDir, { recursive: true });
  await fs.copy(path.join(targetDir, 'index.html'), path.join(backupDir, 'index.html'));
  await fs.copy(path.join(targetDir, 'assets-inventory.json'), path.join(backupDir, 'assets-inventory.json'));
  
  return {
    existingInventory,
    backupDir,
    backupTimestamp: new Date().toISOString()
  };
}

// Adapt Phases for Update Mode
function adaptPhasesForUpdate(phases, updateSetup) {
  // Phase 2: Only download new/modified assets
  phases[1].script = "phase2-asset-download-update.js";
  phases[1].config = {
    existingInventory: updateSetup.existingInventory,
    downloadOnly: ["new", "modified"]
  };
  
  // Phase 3: Compare with existing CSS
  phases[2].script = "phase3-css-comparison-update.js";
  phases[2].config = {
    compareWithExisting: true,
    existingHTML: path.join(updateSetup.backupDir, 'index.html')
  };
  
  return phases;
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
3. **Phase 0 (Mode Detection)** - HIGH - Enables update mode functionality
4. **Phase 4 (Font Verification)** - HIGH - Must verify fonts loaded before assuming match
5. **Phase 3 (CSS Comparison)** - HIGH - Systematic comparison prevents assumptions
6. **Phase 5 (Fix Application)** - MEDIUM - Can be manual initially, automate later
7. **Update Mode Features** - MEDIUM - Incremental updates, backup/rollback

## **Update Mode Usage**

### **Automatic Mode Detection**
```bash
# Auto-detect: create new or update existing
node reconstruct-page.js --url https://ceruleancircle.com/ --target ./reconstructed
```

### **Force Create Mode**
```bash
# Force create new (overwrites existing)
node reconstruct-page.js --url https://ceruleancircle.com/ --target ./reconstructed --mode create
```

### **Force Update Mode**
```bash
# Force update existing
node reconstruct-page.js --url https://ceruleancircle.com/ --target ./reconstructed --mode update
```

### **Update Mode Benefits**
- **Efficiency:** Only downloads changed assets
- **Preservation:** Preserves unchanged assets and structure
- **Safety:** Backup and rollback mechanism
- **Tracking:** Detailed diff reports of changes
- **Verification:** Hash verification ensures integrity

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

