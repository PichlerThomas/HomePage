/**
 * Development Helper: Auto Cache-Busting
 * 
 * To enable automatic cache-busting redirects during development:
 * 1. Uncomment the redirect line in index.html (around line 19)
 * 2. Or use this script to modify the HTML file
 * 
 * Usage:
 * node enable-auto-cache-bust.js
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading index.html:', err);
    return;
  }

  // Enable auto-redirect by uncommenting the redirect line
  const updated = data.replace(
    /\/\/ window\.location\.replace\(url\.toString\(\)\);/,
    'window.location.replace(url.toString());'
  );

  if (updated === data) {
    console.log('⚠️  Auto-redirect already enabled or pattern not found');
    return;
  }

  fs.writeFile(indexPath, updated, 'utf8', (err) => {
    if (err) {
      console.error('Error writing index.html:', err);
      return;
    }
    console.log('✅ Auto cache-busting redirect enabled!');
    console.log('   The page will now automatically redirect with ?v=timestamp');
    console.log('   To disable, run: node disable-auto-cache-bust.js');
  });
});

