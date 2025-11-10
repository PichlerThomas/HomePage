# Creator Mode - Usage Guide

## For Local Development (http://localhost:8080/)

### Option 1: Hard Refresh (Recommended)
1. Open `http://localhost:8080/index.html`
2. Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac) to hard refresh
3. The "G" button should appear in the bottom-right corner
4. Press **G** or click the button to toggle the grid

### Option 2: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Use Query Parameter
Navigate to: `http://localhost:8080/index.html?v=refresh`

---

## For Original Website (https://ceruleancircle.com/)

### Method 1: Browser Console Injection (Easiest)

1. **Open the original site**: https://ceruleancircle.com/
2. **Open Browser Console**: Press F12, then click "Console" tab
3. **Copy the script**: Open `creator-mode-standalone.js` and copy all content
4. **Paste into console** and press Enter
5. The "G" button will appear - click it or press G to toggle grid

### Method 2: Bookmarklet (One-Click Solution)

1. **Create a bookmark**:
   - Name: "Creator Mode Grid"
   - URL: Copy the minified bookmarklet from `creator-mode-bookmarklet.js`
   
2. **On any page** (including ceruleancircle.com):
   - Click the bookmark
   - Grid will be enabled instantly

### Method 3: Browser Extension (Future)

A browser extension could be created to inject the script automatically on any page.

---

## Quick Reference

### Toggle Grid
- **Press 'G' key** (anywhere on page)
- **Click the "G" button** (bottom-right corner)

### Coordinate System
- **Format**: `[Column][Row]` (e.g., `A2`, `B3`, `C5`)
- **Columns**: A through L (12 columns)
- **Rows**: 0 through 19 (20 rows)
- **Cell Size**: 100px × 100px

### Examples
- `A2` - Single cell at column A, row 2
- `A2-B3` - Area from A2 to B3
- `B4` - Meta Structures heading area

### Console API
```javascript
// Toggle grid
window.creatorMode.toggle()

// Enable grid
window.creatorMode.enable()

// Disable grid
window.creatorMode.disable()

// Get element at coordinate
window.creatorMode.getElementAt('A2')
```

---

## Troubleshooting

### Grid Not Showing on Localhost
1. Check browser console for errors (F12)
2. Verify `creator-mode.js` is accessible: `http://localhost:8080/creator-mode.js`
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Check if script tag exists in HTML source

### Grid Not Working on Original Site
1. Make sure you pasted the entire `creator-mode-standalone.js` content
2. Check console for errors
3. Try refreshing the page and re-injecting

### Button Not Appearing
- Check if another element is covering it (z-index issue)
- Try scrolling to bottom-right corner
- Check browser console for JavaScript errors

---

## Files

- `creator-mode.js` - Standard version (for local HTML)
- `creator-mode-standalone.js` - Standalone version (works on any page)
- `creator-mode-bookmarklet.js` - Bookmarklet version (one-click injection)




