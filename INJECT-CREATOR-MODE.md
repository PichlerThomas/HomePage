# Quick Start: Inject Creator Mode on Any Page

## For Localhost (http://localhost:8080/)

**Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

The grid should appear automatically. If not, check browser console.

---

## For Original Site (https://ceruleancircle.com/)

### Quick Method: Browser Console

1. Open https://ceruleancircle.com/
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Copy and paste this entire command:

```javascript
fetch('http://localhost:8080/creator-mode-standalone.js').then(r=>r.text()).then(eval);
```

**OR** if localhost is not accessible, copy the entire content of `creator-mode-standalone.js` and paste it into the console.

5. Press **Enter**
6. Press **G** or click the "G" button to toggle grid

---

## Bookmarklet Method (Works Everywhere)

1. Create a new bookmark
2. Name: "Creator Mode"
3. URL: Copy from `creator-mode-bookmarklet.js` (the minified version)
4. Click the bookmark on any page to enable grid

