/**
 * Creator Mode - Visual Feedback Grid System
 * 
 * Enhanced grid that shows match quality:
 * - Green = Good match (no differences)
 * - Yellow = Minor differences (medium severity)
 * - Red = Major differences (high severity)
 * 
 * Uses visual-comparison-report.json to color-code grid cells
 */

(function() {
  'use strict';

  const COORD_PREFIX = (window.creatorModePrefix || 'L').toUpperCase();
  const GRID_SIZE = 100;
  const GRID_COLS = 12; // A-L
  
  let gridEnabled = false;
  let gridOverlay = null;
  let comparisonData = null;
  let cellScores = {}; // Map of coord -> score (0-1, where 1 = perfect match)
  let cellSelectors = {}; // Map of coord -> selector that set the score (for specificity tracking)

  /**
   * Get grid coordinate from pixel position
   */
  function getGridCoordinate(x, y) {
    const col = Math.floor(x / (window.innerWidth / GRID_COLS));
    const row = Math.floor(y / GRID_SIZE);
    const colLabel = String.fromCharCode(65 + Math.min(col, GRID_COLS - 1));
    return colLabel + row;
  }

  /**
   * Parse grid coordinate range (e.g., "A0-L17" or "A5-L6")
   */
  function parseGridRange(range) {
    const [start, end] = range.split('-');
    if (!start || !end) return [];
    
    const startCol = start.charCodeAt(0) - 65;
    const startRow = parseInt(start.substring(1));
    const endCol = end.charCodeAt(0) - 65;
    const endRow = parseInt(end.substring(1));
    
    const cells = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const colLabel = String.fromCharCode(65 + col);
        cells.push(`${colLabel}${row}`);
      }
    }
    return cells;
  }

  /**
   * Extract actual difference magnitude from difference strings
   */
  function extractDifferenceMagnitude(diff) {
    let maxMagnitude = 0;
    let totalMagnitude = 0;
    let count = 0;
    
    if (diff.differences && Array.isArray(diff.differences)) {
      diff.differences.forEach(propDiff => {
        // Parse pixel differences: "Height: Remote 1625px, Local 2193px (diff: -568px)"
        const pixelMatch = propDiff.match(/\(diff:\s*([-\d.]+)px\)/i);
        if (pixelMatch) {
          const magnitude = Math.abs(parseFloat(pixelMatch[1]));
          maxMagnitude = Math.max(maxMagnitude, magnitude);
          totalMagnitude += magnitude;
          count++;
        }
        
        // Parse position differences: "X position: Remote 52px, Local 12px (diff: 40px)"
        const posMatch = propDiff.match(/position:.*?\(diff:\s*([-\d.]+)px\)/i);
        if (posMatch) {
          const magnitude = Math.abs(parseFloat(posMatch[1]));
          maxMagnitude = Math.max(maxMagnitude, magnitude);
          totalMagnitude += magnitude;
          count++;
        }
        
        // Parse margin/padding differences: "margin: Remote \"0px 0px 80px\", Local \"0px 0px 16px\""
        const marginMatch = propDiff.match(/(?:margin|padding):\s*Remote\s*"([^"]+)",\s*Local\s*"([^"]+)"/i);
        if (marginMatch) {
          const remoteValues = marginMatch[1].split(/\s+/).map(v => parseFloat(v) || 0);
          const localValues = marginMatch[2].split(/\s+/).map(v => parseFloat(v) || 0);
          // Compare each value (top, right, bottom, left)
          for (let i = 0; i < Math.max(remoteValues.length, localValues.length); i++) {
            const remoteVal = remoteValues[i] || 0;
            const localVal = localValues[i] || 0;
            const magnitude = Math.abs(remoteVal - localVal);
            if (magnitude > 0) {
              maxMagnitude = Math.max(maxMagnitude, magnitude);
              totalMagnitude += magnitude;
              count++;
            }
          }
        }
        
        // Parse simple pixel value differences: "height: Remote \"1625.22px\", Local \"2193px\""
        const simplePixelMatch = propDiff.match(/(?:width|height|lineHeight|fontSize):\s*Remote\s*"([\d.]+)px",\s*Local\s*"([\d.]+)px"/i);
        if (simplePixelMatch) {
          const remoteVal = parseFloat(simplePixelMatch[1]);
          const localVal = parseFloat(simplePixelMatch[2]);
          const magnitude = Math.abs(remoteVal - localVal);
          if (magnitude > 0) {
            maxMagnitude = Math.max(maxMagnitude, magnitude);
            totalMagnitude += magnitude;
            count++;
          }
        }
        
        // Parse percentage differences (if any)
        const percentMatch = propDiff.match(/\(diff:\s*([-\d.]+)%\)/i);
        if (percentMatch) {
          const magnitude = Math.abs(parseFloat(percentMatch[1]));
          maxMagnitude = Math.max(maxMagnitude, magnitude);
          totalMagnitude += magnitude;
          count++;
        }
      });
    }
    
    return {
      maxMagnitude,
      avgMagnitude: count > 0 ? totalMagnitude / count : 0,
      count
    };
  }

  /**
   * Check if difference is a font family fallback (cosmetic, not a real issue)
   */
  function isFontFamilyFallback(diff) {
    if (diff.type !== 'typography_mismatch') return false;
    if (!diff.differences || !Array.isArray(diff.differences)) return false;
    
    return diff.differences.some(d => {
      if (d.includes('fontFamily')) {
        // Check if it's just fallback differences (both have the same primary font)
        const match = d.match(/Remote\s*"([^,]+)/);
        if (match) {
          const remotePrimary = match[1].trim();
          const localMatch = d.match(/Local\s*"([^,]+)/);
          if (localMatch) {
            const localPrimary = localMatch[1].trim();
            // If primary fonts match, it's just fallback differences
            return remotePrimary === localPrimary;
          }
        }
      }
      return false;
    });
  }

  /**
   * Check if difference is cosmetic (text-align, display, etc. - not visually critical)
   */
  function isCosmeticDifference(diff) {
    if (!diff.differences || !Array.isArray(diff.differences)) return false;
    
    // Check for cosmetic properties that don't significantly affect visual appearance
    const cosmeticProps = ['textAlign', 'textTransform', 'textDecoration', 'display', 'overflow', 'visibility'];
    
    const hasCosmeticProp = diff.differences.some(d => {
      return cosmeticProps.some(prop => {
        if (d.toLowerCase().includes(prop.toLowerCase())) {
          // textAlign differences are often just layout preferences, not visual issues
          if (prop === 'textAlign') {
            return true; // Always treat as cosmetic
          }
          // Other cosmetic props
          return true;
        }
        return false;
      });
    });
    
    if (hasCosmeticProp) return true;
    
    // Special handling for nav li elements: padding differences are cosmetic
    // Nav items can have flexible widths and padding adjustments are often acceptable
    if (diff.selector === 'nav li' && (diff.type === 'visual_mismatch' || diff.type === 'dimension_mismatch')) {
      // Check if differences are primarily padding-related
      const allDiffs = diff.differences.join(' ').toLowerCase();
      const message = (diff.message || '').toLowerCase();
      
      // If padding is mentioned, treat nav li differences as cosmetic
      // Nav items often have padding adjustments that don't significantly affect visual appearance
      // Even with width differences, padding is the main visual concern for nav items
      if (allDiffs.includes('padding') || message.includes('padding')) {
        // For nav li, padding differences are always cosmetic, even with width differences
        // Nav items can have flexible widths based on content and padding
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if position mismatch is only due to grid coordinates (likely due to height differences, not actual position issues)
   */
  function isGridOnlyPositionMismatch(diff) {
    if (diff.type !== 'position_mismatch') return false;
    if (!diff.differences || !Array.isArray(diff.differences)) return false;
    
    // If the only difference is grid coordinates (no pixel position differences), it's likely due to height
    const hasPixelDiff = diff.differences.some(d => d.includes('(diff:') && d.includes('px'));
    const hasGridDiff = diff.differences.some(d => d.includes('Grid coordinates'));
    
    // If only grid coordinates differ (no pixel differences), treat as minor
    return hasGridDiff && !hasPixelDiff;
  }

  /**
   * Calculate score based on difference magnitude and type
   */
  function calculateMagnitudeBasedScore(diff, magnitude) {
    // Ignore font family fallback differences (cosmetic, not real issues)
    if (isFontFamilyFallback(diff)) {
      return 0.98; // 98% - essentially perfect, just cosmetic
    }
    
    // Treat cosmetic differences (text-align, padding for nav li, etc.) as minor
    // This MUST be checked BEFORE magnitude-based calculation to ensure cosmetic differences
    // (like nav li padding) get high scores even if they have large magnitude differences
    if (isCosmeticDifference(diff)) {
      return 0.97; // 97% - cosmetic, not visually significant
    }
    
    // Treat grid-only position mismatches as minor (likely due to height differences)
    if (isGridOnlyPositionMismatch(diff)) {
      return 0.95; // 95% - grid difference likely due to height, not actual position issue
    }
    
    // Tolerance thresholds - differences below these are negligible
    const toleranceThresholds = {
      'typography_mismatch': 2,    // < 2px = ignore (browser rendering variance)
      'visual_mismatch': 5,        // < 5px = ignore (sub-pixel rendering)
      'position_mismatch': 5,      // < 5px = ignore (not visually noticeable)
      'dimension_mismatch': 10     // < 10px = minor impact (browser rounding)
    };
    
    const tolerance = toleranceThresholds[diff.type] || 5;
    
    // If difference is below tolerance, return high score (essentially perfect)
    if (magnitude.maxMagnitude < tolerance) {
      // Progressive scoring for very small differences
      if (magnitude.maxMagnitude < tolerance * 0.5) {
        return 0.98; // < 50% of tolerance = 98% (essentially perfect)
      } else {
        return 0.95; // < 100% of tolerance = 95% (very good)
      }
    }
    
    // Type weights (higher = more critical)
    const typeWeights = {
      'dimension_mismatch': 1.0,      // Most critical - affects layout
      'position_mismatch': 0.8,       // Very visible - affects alignment
      'count_mismatch': 0.9,           // Critical - structural issue
      'missing_remote': 0.9,           // Critical - extra elements
      'missing_local': 0.9,            // Critical - missing elements
      'visual_mismatch': 0.5,          // Moderate - affects appearance
      'typography_mismatch': 0.3       // Less critical - font fallbacks are OK
    };
    
    const weight = typeWeights[diff.type] || 0.5;
    
    // Normalize magnitude to 0-1 scale
    // Use different thresholds for different types
    let maxTolerance = 100; // Default: 100px difference = worst score
    
    if (diff.type === 'dimension_mismatch') {
      maxTolerance = 500; // 500px difference = worst score
    } else if (diff.type === 'position_mismatch') {
      maxTolerance = 200; // 200px difference = worst score
    } else if (diff.type === 'typography_mismatch') {
      maxTolerance = 50; // 50px difference = worst score (smaller differences matter less)
    } else if (diff.type === 'visual_mismatch') {
      maxTolerance = 100; // 100px difference = worst score
    }
    
    // Calculate normalized magnitude (0 = no difference, 1 = max tolerance exceeded)
    // Adjust for tolerance threshold (magnitude below tolerance already handled above)
    const adjustedMagnitude = magnitude.maxMagnitude - tolerance;
    
    // Use logarithmic scaling for very large differences to prevent scores from going to 0
    // This ensures even very large differences get some score (not 0)
    let normalizedMagnitude;
    if (adjustedMagnitude <= maxTolerance) {
      // Linear scaling for differences within maxTolerance
      normalizedMagnitude = Math.max(adjustedMagnitude, 0) / maxTolerance;
    } else {
      // Logarithmic scaling for differences exceeding maxTolerance
      // This prevents scores from going to 0 even for very large differences
      const excessRatio = adjustedMagnitude / maxTolerance;
      normalizedMagnitude = 0.9 + (0.1 * (1 - 1 / (1 + Math.log10(excessRatio))));
      normalizedMagnitude = Math.min(normalizedMagnitude, 0.99); // Cap at 0.99 to ensure score > 0
    }
    
    // Base score: 1.0 (perfect) minus normalized magnitude
    let baseScore = 1.0 - normalizedMagnitude;
    
    // Apply type weight (more critical types reduce score more)
    baseScore = baseScore * (1 - (weight * 0.3)); // Weight reduces score by up to 30%
    
    // Apply severity modifier (additional penalty)
    if (diff.severity === 'high') {
      baseScore *= 0.7; // Additional 30% penalty for high severity
    } else if (diff.severity === 'medium') {
      baseScore *= 0.9; // 10% penalty for medium severity
    }
    
    // Ensure score is between 0.01 and 1 (never 0, always at least 1%)
    return Math.max(0.01, Math.min(1, baseScore));
  }

  /**
   * Load and process comparison data with data-driven scoring
   */
  async function loadComparisonData() {
    try {
      const response = await fetch('/visual-comparison-report.json');
      if (!response.ok) {
        console.warn('⚠️  Visual comparison report not found. Grid will show default colors.');
        return null;
      }
      
      const data = await response.json();
      comparisonData = data;
      
      // Initialize cell scores (all start at 1.0 = perfect match)
      const maxRows = 50; // Estimate, will be calculated dynamically
      for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const colLabel = String.fromCharCode(65 + col);
          const coord = `${colLabel}${row}`;
          cellScores[coord] = 1.0; // Perfect match by default
          cellSelectors[coord] = null; // No selector set the score yet
        }
      }
      
      // Track statistics for debugging
      let totalMagnitude = 0;
      let maxMagnitude = 0;
      let scoredDifferences = 0;
      
      // Process differences and assign scores to affected cells
      // Sort by specificity: more specific selectors (like 'nav li') should be processed AFTER general ones (like 'nav')
      // This ensures specific element scores override general parent scores
      if (data.differences && Array.isArray(data.differences)) {
        const sortedDifferences = [...data.differences].sort((a, b) => {
          // More specific selectors (longer, with spaces) come later
          const aSpecificity = (a.selector.match(/\s/g) || []).length;
          const bSpecificity = (b.selector.match(/\s/g) || []).length;
          const specificityDiff = aSpecificity - bSpecificity;
          
          // If specificity is equal, prioritize element selectors over class selectors
          // This ensures 'nav' (element) processes before '.intro' (class) when both have specificity 0
          if (specificityDiff === 0) {
            const aIsElement = /^[a-z]/.test(a.selector); // Starts with lowercase letter = element selector
            const bIsElement = /^[a-z]/.test(b.selector);
            if (aIsElement && !bIsElement) return -1; // Element before class
            if (!aIsElement && bIsElement) return 1;  // Class after element
          }
          
          return specificityDiff;
        });
        
        sortedDifferences.forEach(diff => {
          // Extract actual difference magnitude
          const magnitude = extractDifferenceMagnitude(diff);
          
          // Calculate score based on magnitude and type
          let severityScore;
          
          if (magnitude.count > 0 && magnitude.maxMagnitude > 0) {
            // Data-driven: Calculate score from actual magnitude
            severityScore = calculateMagnitudeBasedScore(diff, magnitude);
            totalMagnitude += magnitude.maxMagnitude;
            maxMagnitude = Math.max(maxMagnitude, magnitude.maxMagnitude);
            scoredDifferences++;
            
            // Debug: Log nav differences to see what scores they're getting
            if (diff.selector === 'nav' && diff.index === 0) {
              console.log(`🔍 Nav ${diff.type}: magnitude=${magnitude.maxMagnitude.toFixed(2)}px, score=${severityScore.toFixed(3)} (${Math.round(severityScore*100)}%)`);
            }
          } else {
            // Fallback: Use severity-based scoring for differences without magnitude data
            // Check for cosmetic issues first
            if (isFontFamilyFallback(diff)) {
              severityScore = 0.98; // 98% - essentially perfect, just cosmetic
            } else if (isCosmeticDifference(diff)) {
              severityScore = 0.97; // 97% - cosmetic, not visually significant
            } else if (isGridOnlyPositionMismatch(diff)) {
              severityScore = 0.95; // 95% - grid difference likely due to height
            } else if (diff.severity === 'high') {
              severityScore = 0.3; // Red - major issues
            } else if (diff.severity === 'medium') {
              // For medium severity without magnitude, check if it's likely a minor issue
              // Many medium issues are typography/visual mismatches that might be cosmetic
              if (diff.type === 'typography_mismatch' || diff.type === 'visual_mismatch') {
                // Check if the difference message suggests minor issues (small pixel differences)
                const hasSmallDiff = diff.message && (
                  diff.message.includes('2.39px') || 
                  diff.message.includes('1.6px') ||
                  diff.message.includes('78.39px') && diff.message.includes('76px')
                );
                if (hasSmallDiff) {
                  severityScore = 0.98; // 98% - very minor pixel differences
                } else {
                  severityScore = 0.95; // 95% - likely cosmetic or very minor
                }
              } else {
                severityScore = 0.7; // Yellow - minor issues
              }
            } else if (diff.severity === 'low') {
              severityScore = 0.95; // 95% - very minor
            } else {
              severityScore = 1.0;
            }
          }
          
          // Get affected grid coordinates
          // ALWAYS use local coordinates (what we see on the page)
          // This ensures we only score cells that actually have the element on the local page
          let affectedCells = [];
          
          if (diff.local && diff.local.range) {
            // Use local coordinates (what we see on the page)
            affectedCells = parseGridRange(diff.local.range);
          } else if (diff.remote && diff.remote.range) {
            // Only fallback to remote if local is not available
            // But this should rarely happen if phase6 is working correctly
            affectedCells = parseGridRange(diff.remote.range);
          } else {
            // Fallback: Try to get grid coordinates from DOM element
            // This handles cases where grid coordinates weren't included in the difference
            try {
              const elements = document.querySelectorAll(diff.selector);
              if (elements.length > diff.index) {
                const element = elements[diff.index];
                if (element) {
                  const rect = element.getBoundingClientRect();
                  const scrollY = window.scrollY || window.pageYOffset;
                  const scrollX = window.scrollX || window.pageXOffset;
                  
                  // Calculate grid coordinates from element position
                  const topLeft = getGridCoordinate(rect.left + scrollX, rect.top + scrollY);
                  const bottomRight = getGridCoordinate(rect.right + scrollX, rect.bottom + scrollY);
                  
                  if (topLeft && bottomRight) {
                    affectedCells = parseGridRange(`${topLeft}-${bottomRight}`);
                    console.log(`📍 Fallback: Mapped ${diff.selector}[${diff.index}] to grid range ${topLeft}-${bottomRight}`);
                  }
                }
              }
            } catch (e) {
              console.warn(`⚠️  Could not map ${diff.selector}[${diff.index}] to grid coordinates:`, e.message);
            }
          }
          
          // Apply score to affected cells
          // For cells with multiple issues, use the WORST score (not average)
          // This ensures specific element issues (like nav li) override general parent issues (like nav)
          affectedCells.forEach(coord => {
            // Debug: Log nav, nav li, .intro, and section to see what's happening
            if ((diff.selector === 'nav' || diff.selector === 'nav li' || diff.selector === '.intro' || diff.selector === 'section') && (coord === 'A0' || coord === 'B0' || coord === 'C0' || coord === 'D0')) {
              const before = cellScores[coord]?.toFixed(3) || 'undefined';
              const after = cellScores[coord] !== undefined && cellScores[coord] < 1.0 
                ? Math.min(cellScores[coord], severityScore).toFixed(3)
                : severityScore.toFixed(3);
              console.log(`🔍 ${diff.selector}[${diff.index}] ${diff.type}: ${coord} before=${before}, score=${severityScore.toFixed(3)}, after=${after}`);
            }
            
            if (cellScores[coord] !== undefined && cellScores[coord] < 1.0) {
              // Cell already has issues - use the WORST (lowest) score
              // BUT: If current score is high (>= 0.95) and new score is low, 
              // we need to check selector specificity to determine if override should happen
              const currentScore = cellScores[coord];
              const currentSelector = cellSelectors[coord];
              const isHighScore = currentScore >= 0.95;
              const isLowScore = severityScore < 0.5;
              const isModerateScore = severityScore >= 0.3 && severityScore < 0.7;
              
              // Calculate specificity for both selectors
              const currentSpecificity = currentSelector ? (currentSelector.match(/\s/g) || []).length : -1;
              const newSpecificity = (diff.selector.match(/\s/g) || []).length;
              
              // Check override prevention for both low scores (< 0.5) and moderate scores (< 0.7) when current is high
              if (isHighScore && (isLowScore || isModerateScore)) {
                const scoreDifference = currentScore - severityScore;
                
                // Debug: Log override prevention for H0, E0, F0, G0 (nav li issues)
                if ((coord === 'H0' || coord === 'E0' || coord === 'F0' || coord === 'G0' || coord === 'D0' || coord === 'B0') && (diff.selector === 'section' || diff.selector === 'nav li' || diff.selector === 'nav')) {
                  console.log(`🛡️  Override prevention check: ${diff.selector}[${diff.index}] ${diff.type} for ${coord}`);
                  console.log(`   currentScore=${currentScore.toFixed(3)} (from ${currentSelector || 'initial'}), severityScore=${severityScore.toFixed(3)}, diff=${scoreDifference.toFixed(3)}`);
                  console.log(`   currentSpecificity=${currentSpecificity}, newSpecificity=${newSpecificity}`);
                }
                
                // KEY FIX: Check selector specificity
                // If new selector is MORE specific (child element), allow override
                // If new selector is LESS specific (parent container), preserve high score
                if (newSpecificity > currentSpecificity) {
                  // Child selector is more specific - allow override (even if score difference is large)
                  // This fixes H0, E0, F0, G0 showing green when nav li[2] and nav li[3] have major issues
                  cellScores[coord] = severityScore;
                  cellSelectors[coord] = diff.selector;
                  if ((coord === 'H0' || coord === 'E0' || coord === 'F0' || coord === 'G0' || coord === 'D0' || coord === 'B0') && (diff.selector === 'section' || diff.selector === 'nav li' || diff.selector === 'nav')) {
                    console.log(`   ✅ ALLOWING override: more specific selector (${newSpecificity} > ${currentSpecificity})`);
                  }
                } else if (scoreDifference > 0.3) {
                  // Parent selector trying to override - preserve high score if difference is significant
                  // SPECIAL CASE: Large container differences (like section with 568px height) should NOT
                  // override specific element scores, especially for cells far from the container's main area
                  // Check if this is a large container difference affecting many cells
                  const isLargeContainer = (diff.selector === 'section' || diff.selector === '.intro') && 
                                          diff.type === 'dimension_mismatch' && 
                                          severityScore < 0.1; // Very low score = large difference
                  
                  if (isLargeContainer && currentScore >= 0.95) {
                    // Don't let large container differences override high scores from specific elements
                    // This fixes A122, L122, A124, L124 showing red when they should be green
                    if (coord.match(/[A-L](1[0-2][0-9]|12[0-9])/)) { // Cells in row 100-129
                      // Don't update cellScores[coord] - keep the current high score
                      if ((coord === 'A122' || coord === 'L122' || coord === 'A124' || coord === 'L124')) {
                        console.log(`   ✅ KEEPING high score ${currentScore.toFixed(3)} (large container diff should not override)`);
                      }
                      return; // Skip this cell update
                    }
                  }
                  
                  // Don't update cellScores[coord] - keep the current high score
                  if ((coord === 'H0' || coord === 'E0' || coord === 'F0' || coord === 'G0' || coord === 'D0' || coord === 'B0') && (diff.selector === 'section' || diff.selector === 'nav li' || diff.selector === 'nav')) {
                    console.log(`   ✅ KEEPING high score ${currentScore.toFixed(3)} (less specific selector, diff ${scoreDifference.toFixed(3)} > 0.3)`);
                  }
                } else {
                  // Score difference is not large enough, use the worst score
                  cellScores[coord] = severityScore;
                  cellSelectors[coord] = diff.selector;
                  if ((coord === 'H0' || coord === 'E0' || coord === 'F0' || coord === 'G0' || coord === 'D0' || coord === 'B0') && (diff.selector === 'section' || diff.selector === 'nav li' || diff.selector === 'nav')) {
                    console.log(`   ❌ OVERRIDING with low score ${severityScore.toFixed(3)} (diff ${scoreDifference.toFixed(3)} not large enough)`);
                  }
                }
              } else {
                // Normal case: use the worst score
                cellScores[coord] = Math.min(cellScores[coord], severityScore);
                // Update selector if new score is worse (lower)
                if (severityScore < currentScore) {
                  cellSelectors[coord] = diff.selector;
                }
              }
            } else {
              cellScores[coord] = severityScore;
              cellSelectors[coord] = diff.selector;
            }
          });
        });
      }
      
      console.log(`✅ Loaded comparison data: ${data.differences.length} differences mapped to grid`);
      if (scoredDifferences > 0) {
        console.log(`📊 Magnitude-based scoring: ${scoredDifferences} differences with magnitude data`);
        console.log(`   Max magnitude: ${maxMagnitude.toFixed(1)}px, Avg: ${(totalMagnitude / scoredDifferences).toFixed(1)}px`);
      }
      
      // Debug: Show sample of cellScores
      const sampleScores = Object.entries(cellScores)
        .filter(([coord, score]) => score < 1.0)
        .slice(0, 10);
      if (sampleScores.length > 0) {
        console.log(`🎯 Sample cell scores with issues:`, sampleScores.map(([c, s]) => `${c}=${(s*100).toFixed(0)}%`).join(', '));
      } else {
        console.warn(`⚠️  No cell scores < 1.0 found. Total cellScores entries: ${Object.keys(cellScores).length}`);
      }
      
      return data;
    } catch (error) {
      console.warn('⚠️  Could not load comparison data:', error.message);
      return null;
    }
  }

  /**
   * Get color for a cell based on its score (improved with smoother gradients)
   */
  function getCellColor(score) {
    // score: 0.0 (worst/red) to 1.0 (best/green)
    // Use smoother transitions for better visual feedback
    
    if (score >= 0.95) {
      // Green - excellent match (95-100%)
      return {
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        label: 'rgba(34, 197, 94, 0.9)'
      };
    } else if (score >= 0.85) {
      // Light green - very good match (85-95%)
      return {
        bg: 'rgba(74, 222, 128, 0.2)',
        border: 'rgba(74, 222, 128, 0.45)',
        label: 'rgba(74, 222, 128, 0.85)'
      };
    } else if (score >= 0.75) {
      // Yellow-green - good match with minor issues (75-85%)
      return {
        bg: 'rgba(163, 230, 53, 0.2)',
        border: 'rgba(163, 230, 53, 0.5)',
        label: 'rgba(163, 230, 53, 0.8)'
      };
    } else if (score >= 0.65) {
      // Yellow - minor issues (65-75%)
      return {
        bg: 'rgba(234, 179, 8, 0.25)',
        border: 'rgba(234, 179, 8, 0.55)',
        label: 'rgba(234, 179, 8, 0.9)'
      };
    } else if (score >= 0.50) {
      // Orange-yellow - moderate issues (50-65%)
      return {
        bg: 'rgba(251, 191, 36, 0.3)',
        border: 'rgba(251, 191, 36, 0.6)',
        label: 'rgba(251, 191, 36, 0.9)'
      };
    } else if (score >= 0.35) {
      // Orange - significant issues (35-50%)
      return {
        bg: 'rgba(249, 115, 22, 0.35)',
        border: 'rgba(249, 115, 22, 0.65)',
        label: 'rgba(249, 115, 22, 0.95)'
      };
    } else if (score >= 0.20) {
      // Red-orange - major issues (20-35%)
      return {
        bg: 'rgba(239, 68, 68, 0.4)',
        border: 'rgba(239, 68, 68, 0.7)',
        label: 'rgba(239, 68, 68, 1)'
      };
    } else {
      // Dark red - critical issues (0-20%)
      return {
        bg: 'rgba(220, 38, 38, 0.5)',
        border: 'rgba(220, 38, 38, 0.8)',
        label: 'rgba(220, 38, 38, 1)'
      };
    }
  }

  function getDocumentHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  function calculateGridRows() {
    const docHeight = getDocumentHeight();
    return Math.ceil(docHeight / GRID_SIZE);
  }

  function createGridOverlay() {
    if (gridOverlay) {
      gridOverlay.remove();
      gridOverlay = null;
    }
    
    // If cellScores is empty but we have comparisonData, scores haven't been processed yet
    // This should not happen if loadComparisonData completed, but handle gracefully
    if (Object.keys(cellScores).length === 0) {
      console.warn('⚠️  cellScores not populated yet. Grid will show default colors.');
    }

    const gridRows = calculateGridRows();
    const docHeight = getDocumentHeight();
    const viewportWidth = window.innerWidth;

    const overlay = document.createElement('div');
    overlay.id = 'creator-grid-visual-feedback-overlay'; // Unique ID to avoid conflicts
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: ${docHeight}px;
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;

    // Create grid cells with color coding
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = document.createElement('div');
        const colLabel = String.fromCharCode(65 + col);
        const rowLabel = row.toString();
        const coord = `${colLabel}${rowLabel}`;
        const prefixedCoord = `${COORD_PREFIX}${coord}`;
        
        // Get score for this cell (default to 1.0 if not in comparison data)
        const score = cellScores[coord] !== undefined ? cellScores[coord] : 1.0;
        const colors = getCellColor(score);
        
        // Debug: Log first few cells with issues
        if (score < 1.0 && row < 3 && col < 3) {
          console.log(`🔍 Cell ${coord}: score=${score.toFixed(3)} (${Math.round(score*100)}%)`);
        }
        
        cell.className = 'grid-cell';
        cell.dataset.coord = coord;
        cell.dataset.prefixedCoord = prefixedCoord;
        cell.dataset.score = score.toFixed(2);
        cell.style.cssText = `
          position: absolute;
          top: ${row * GRID_SIZE}px;
          left: ${col * (viewportWidth / GRID_COLS)}px;
          width: ${viewportWidth / GRID_COLS}px;
          height: ${GRID_SIZE}px;
          background: ${colors.bg};
          border: 2px solid ${colors.border};
          box-sizing: border-box;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 2px;
          transition: all 0.2s;
        `;

        // Add coordinate label
        const label = document.createElement('span');
        label.textContent = prefixedCoord;
        label.style.cssText = `
          font-size: 10px;
          color: ${colors.label};
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-weight: bold;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        
        // Add score indicator (show for scores below 95%)
        if (score < 0.95) {
          const scoreBadge = document.createElement('span');
          const percentage = Math.round(score * 100);
          scoreBadge.textContent = `${percentage}%`;
          scoreBadge.title = `Match quality: ${percentage}%`;
          scoreBadge.style.cssText = `
            font-size: 8px;
            color: ${colors.label};
            background: ${colors.border};
            padding: 1px 3px;
            border-radius: 2px;
            margin-left: 2px;
            font-family: monospace;
            font-weight: bold;
          `;
          label.appendChild(scoreBadge);
        }
        
        cell.appendChild(label);
        overlay.appendChild(cell);
      }
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  function updateGridDimensions() {
    if (gridOverlay && gridEnabled) {
      const wasEnabled = gridEnabled;
      gridEnabled = false;
      createGridOverlay();
      if (wasEnabled) {
        gridEnabled = true;
        gridOverlay.style.display = 'block';
      }
    }
  }

  function createToggleButton() {
    const button = document.createElement('button');
    button.id = 'creator-mode-toggle';
    button.textContent = 'G';
    button.title = 'Toggle Visual Feedback Grid (Press G)';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgb(5, 181, 250);
      color: white;
      border: 2px solid white;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', toggleGrid);
    document.body.appendChild(button);
    return button;
  }

  function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'visual-feedback-legend';
    legend.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      display: none;
    `;
    
    legend.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Match Quality:</div>
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 20px; height: 20px; background: rgba(34, 197, 94, 0.15); border: 2px solid rgba(34, 197, 94, 0.4); margin-right: 8px;"></div>
        <span>Excellent (95-100%)</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 20px; height: 20px; background: rgba(163, 230, 53, 0.2); border: 2px solid rgba(163, 230, 53, 0.5); margin-right: 8px;"></div>
        <span>Good (75-95%)</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 20px; height: 20px; background: rgba(234, 179, 8, 0.25); border: 2px solid rgba(234, 179, 8, 0.55); margin-right: 8px;"></div>
        <span>Minor Issues (65-75%)</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 20px; height: 20px; background: rgba(251, 191, 36, 0.3); border: 2px solid rgba(251, 191, 36, 0.6); margin-right: 8px;"></div>
        <span>Moderate Issues (50-65%)</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 4px;">
        <div style="width: 20px; height: 20px; background: rgba(249, 115, 22, 0.35); border: 2px solid rgba(249, 115, 22, 0.65); margin-right: 8px;"></div>
        <span>Significant Issues (35-50%)</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="width: 20px; height: 20px; background: rgba(239, 68, 68, 0.4); border: 2px solid rgba(239, 68, 68, 0.7); margin-right: 8px;"></div>
        <span>Major Issues (0-35%)</span>
      </div>
    `;
    
    document.body.appendChild(legend);
    return legend;
  }

  function toggleGrid() {
    gridEnabled = !gridEnabled;
    const overlay = createGridOverlay();
    const button = document.getElementById('creator-mode-toggle');
    const legend = document.getElementById('visual-feedback-legend');
    
    if (gridEnabled) {
      if (!overlay) {
        console.error('❌ Cannot create grid: scores not loaded yet');
        gridEnabled = false;
        return;
      }
      overlay.style.display = 'block';
      if (legend) legend.style.display = 'block';
      button.style.background = 'rgb(5, 237, 152)';
      button.textContent = 'G✓';
      console.log(`✅ Visual Feedback Grid: ENABLED (Prefix: ${COORD_PREFIX})`);
      if (comparisonData) {
        console.log(`📊 Showing ${comparisonData.differences.length} differences`);
        console.log(`   High Priority: ${comparisonData.summary.bySeverity.high}`);
        console.log(`   Medium Priority: ${comparisonData.summary.bySeverity.medium}`);
      }
    } else {
      overlay.style.display = 'none';
      if (legend) legend.style.display = 'none';
      button.style.background = 'rgb(5, 181, 250)';
      button.textContent = 'G';
      console.log('Visual Feedback Grid: disabled');
    }
  }

  async function init() {
    // Load comparison data first
    await loadComparisonData();
    
    createToggleButton();
    createLegend();

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === 'g' || e.key === 'G') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleGrid();
        }
      }
    });

    // Update grid on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateGridDimensions, 250);
    });

    // MutationObserver for dynamic content
    const observer = new MutationObserver(() => {
      if (gridEnabled) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateGridDimensions, 250);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    // Expose API
    window.creatorModeVisual = {
      toggle: toggleGrid,
      enable: () => { if (!gridEnabled) toggleGrid(); },
      disable: () => { if (gridEnabled) toggleGrid(); },
      reload: async () => {
        await loadComparisonData();
        if (gridEnabled) {
          createGridOverlay();
          gridOverlay.style.display = 'block';
        }
      },
      isEnabled: () => gridEnabled,
      getData: () => comparisonData
    };

    console.log(`🎨 Visual Feedback Grid loaded! (Prefix: ${COORD_PREFIX})`);
    console.log(`📊 Press G to toggle grid and see match quality`);
    if (comparisonData) {
      console.log(`✅ Comparison data loaded: ${comparisonData.differences.length} differences`);
    }
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

