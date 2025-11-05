# Visual Test Specification: Complete Baseline

**Date:** 2025-11-05  
**Purpose:** Create comprehensive visual tests to ensure identical recreation

## Visual Requirements (from Original Site Analysis)

### 1. Navigation Banner
- **Background Color:** `rgb(5, 181, 250)` (cyan blue #05b5fa)
- **Text Transform:** `uppercase` for all nav links
- **Text Color:** `rgb(255, 255, 255)` (white)
- **Font Family:** `AkkoRoundedPro, sans-serif`
- **Font Size:** `24px`
- **Position:** Fixed at top (if banner exists)

### 2. Typography
- **Body Font:** `AkkoRoundedPro, sans-serif`
- **H2 Font:** `Synchroplain` at `60px`
- **H2 Color:** `rgb(94, 115, 122)` (teal/grey)
- **H2 Text Transform:** `none` (mixed case)

### 3. Hero/Banner Section (if exists)
- **Background:** Blue gradient (needs visual inspection)
- **Icon:** White circle with bar graph icon
- **Height:** Should push content down significantly

### 4. Colors
- **Body Background:** `rgb(255, 255, 255)` (white)
- **Body Text:** `rgb(80, 84, 92)` (grey)
- **Navigation Background:** `rgb(5, 181, 250)` (cyan blue)

## Visual Test Cases

### VT1: Navigation Styling
**Test:** Verify navigation has blue background and uppercase white text
**Expected:**
- Background: `rgb(5, 181, 250)`
- Links: `text-transform: uppercase`
- Links: `color: rgb(255, 255, 255)`
- Font: `AkkoRoundedPro, sans-serif`
- Font size: `24px`

### VT2: Typography
**Test:** Verify font families match
**Expected:**
- Body: `AkkoRoundedPro, sans-serif`
- H2: `Synchroplain` at `60px`
- H2 color: `rgb(94, 115, 122)`

### VT3: Hero Banner
**Test:** Verify banner section exists (if present)
**Expected:**
- Banner element visible with blue gradient
- Icon/circle element present
- Content positioned below banner

### VT4: Visual Layout
**Test:** Verify spacing and positioning match original
**Expected:**
- Content spacing matches
- Section positioning matches
- No visual gaps or overlaps

### VT5: Color Scheme
**Test:** Verify all colors match original
**Expected:**
- Navigation: Blue background
- Text: Correct colors throughout
- Backgrounds: Match original

## Automated Visual Tests

```javascript
// Visual styling verification
function verifyVisualStyles() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav a');
    const h2 = document.querySelector('h2');
    const body = document.body;
    
    const results = {
        nav: {
            backgroundColor: window.getComputedStyle(nav).backgroundColor,
            expected: 'rgb(5, 181, 250)',
            match: false
        },
        navLinks: Array.from(navLinks).map(link => ({
            textTransform: window.getComputedStyle(link).textTransform,
            color: window.getComputedStyle(link).color,
            fontSize: window.getComputedStyle(link).fontSize,
            fontFamily: window.getComputedStyle(link).fontFamily
        })),
        h2: {
            fontFamily: window.getComputedStyle(h2).fontFamily,
            fontSize: window.getComputedStyle(h2).fontSize,
            color: window.getComputedStyle(h2).color
        },
        body: {
            fontFamily: window.getComputedStyle(body).fontFamily,
            backgroundColor: window.getComputedStyle(body).backgroundColor,
            color: window.getComputedStyle(body).color
        }
    };
    
    // Check matches
    results.nav.match = results.nav.backgroundColor === results.nav.expected;
    
    return results;
}
```

## Next Steps

1. Extract all CSS from original site
2. Update HTML/CSS to match exact styling
3. Run visual tests to verify match
4. Screenshot comparison for final verification

