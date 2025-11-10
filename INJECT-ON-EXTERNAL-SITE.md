# How to Use Creator Mode on External Site (ceruleancircle.com)

## Quick Method: Browser Console (Easiest)

1. **Open the original site**: https://ceruleancircle.com/
2. **Open Browser Console**: 
   - Press **F12** (or right-click → "Inspect" → "Console" tab)
3. **Copy and paste this command**:

```javascript
fetch('http://localhost:8080/creator-mode-standalone.js').then(r=>r.text()).then(eval);
```

**OR** if localhost is not accessible, copy the entire content of `creator-mode-standalone.js` file and paste it into the console.

4. **Press Enter**
5. **Press "G"** or click the blue "G" button (bottom-right) to toggle the grid

---

## Alternative: Direct Script Injection

If you have the script file locally, you can also:

1. Open https://ceruleancircle.com/
2. Open Console (F12)
3. Copy the entire content of `creator-mode-standalone.js`
4. Paste into console and press Enter
5. Press "G" to toggle grid

---

## Features

- ✅ Full-page grid coverage (scrolls with page)
- ✅ 12 columns (A-L) × dynamic rows (based on page height)
- ✅ Coordinate system: A0, B1, C2, etc.
- ✅ Toggle with "G" key or button click
- ✅ Works on any website

---

## Usage Examples

Once loaded, you can:

- **Toggle grid**: Press `G` or click the button
- **Find element at coordinate**: `window.creatorMode.getElementAt("A2")`
- **Check if enabled**: `window.creatorMode.isEnabled()`
- **Manually update grid**: `window.creatorMode.update()` (if page content changes)

---

## Troubleshooting

- **Grid not showing?** Make sure you pressed "G" after loading the script
- **Grid doesn't scroll?** Hard refresh the page and reload the script
- **Button not visible?** Check browser console for errors




