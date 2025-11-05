# Cache-Busting During Development

## Problem

GitHub Pages uses Fastly CDN with 10-minute cache TTL, which can delay seeing updates during development.

## Solutions Implemented

### 1. Meta Tags (Browser Cache Control)
Added to `index.html`:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```
**Effect:** Prevents browser from caching the page (but CDN still caches)

### 2. JavaScript Cache-Busting Helper
Auto-detects GitHub Pages and logs cache-busting parameter.

**Manual Usage:**
```
https://pichlerthomas.github.io/HomePage/?v=1234567890
```

**Or use timestamp:**
```
https://pichlerthomas.github.io/HomePage/?v=$(date +%s)
```

## Quick Cache-Busting Methods

### Method 1: Query Parameter (Recommended)
Add any query parameter to bypass cache:
- `?v=1`
- `?t=1234567890`
- `?dev=true`
- `?nocache=1`

### Method 2: Hard Refresh Browser
- **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Safari:** `Cmd+Option+R`

### Method 3: Incognito/Private Window
Open in private browsing mode to bypass all cache.

### Method 4: Clear Browser Cache
Clear cached images and files for the site.

## CDN Cache Behavior

**GitHub Pages CDN:**
- Cache TTL: 10 minutes (`max-age=600`)
- Cache layers: Origin cache + Edge cache (Varnish)
- Cannot be disabled by repository owner

**What You Can Control:**
- ✅ Browser cache (via meta tags)
- ✅ Cache-busting via query parameters
- ✅ Hard refresh in browser

**What You Cannot Control:**
- ❌ CDN cache TTL (GitHub/Fastly managed)
- ❌ Origin cache headers (GitHub managed)

## Development Workflow

1. **Make changes** → commit → push
2. **Wait 1-5 minutes** for GitHub Pages rebuild
3. **Add cache-busting parameter:**
   ```
   https://pichlerthomas.github.io/HomePage/?v=dev
   ```
4. **Or use hard refresh** (Ctrl+Shift+R)

## Production Recommendations

For production, remove or comment out:
- Cache-control meta tags (allow caching for performance)
- JavaScript cache-busting helper
- Keep only essential meta tags

## Alternative: Local Development Server

For immediate feedback during development, consider:
1. Local HTTP server (Python, Node.js, etc.)
2. Live reload tools (Browsersync, Live Server)
3. GitHub Codespaces with local preview

Example local server:
```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# Then visit: http://localhost:8000
```

