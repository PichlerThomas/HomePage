/**
 * Development Helper: Disable Auto Cache-Busting
 * 
 * Reverts the auto-redirect back to manual mode (console.log only)
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    return;
  }

  // Disable auto-redirect by commenting the redirect line
  const updated = data.replace(
    /window\.location\.replace\(url\.toString\(\)\);/,
    '// window.location.replace(url.toString());'
  );

  if (updated === data) {
    console.log('⚠️  Auto-redirect already disabled or pattern not found');
    return;
  }

  fs.writeFile(indexPath, updated, 'utf8', (err) => {
    if (err) {
      console.error('Error writing index.html:', err);
      return;
    }
    console.log('✅ Auto cache-busting redirect disabled!');
    console.log('   Using manual cache-busting (console.log only)');
    console.log('   To enable, run: node enable-auto-cache-bust.js');
  });
});

