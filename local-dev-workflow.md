# Local Development Workflow

**Purpose:** Fast feedback loop for webpage development without waiting for GitHub Pages CDN updates

## Quick Start

1. **Start local server:**
   ```bash
   ./start-local-server.sh
   ```
   Default port: 8000

2. **Access in browser:**
   - URL: `http://localhost:8000`
   - Or use: `http://localhost:8000/index.html`

3. **Make changes:**
   - Edit `index.html` or other files
   - Refresh browser (F5 or Ctrl+R)
   - Changes visible immediately!

4. **Stop server:**
   - Press `Ctrl+C` in terminal
   - Or kill the process

## Development Cycle

```
1. Start local server (background)
2. Navigate browser to localhost:8000
3. Make HTML/CSS changes
4. Refresh browser → see changes instantly
5. Iterate until goal achieved
6. Commit and push to GitHub Pages
```

## Benefits

- ⚡ **Fast feedback:** < 1 second vs 5-10 minutes
- 🔄 **No caching:** No cache-busting needed
- 🎯 **Iterative:** Quick test → fix → test cycles
- 🛠️ **Standard workflow:** Normal local development

## Server Management

**Start server:**
```bash
./start-local-server.sh [PORT]
```

**Check if server is running:**
```bash
lsof -i :8000
# or
ps aux | grep "http.server"
```

**Kill server:**
```bash
pkill -f "http.server"
# or find PID and kill
lsof -ti:8000 | xargs kill
```

## Port Options

- Default: 8000
- Alternative: 3000, 8080, 9000
- Check if port is in use: `lsof -i :8000`

