/**
 * Phase 2: Asset Download and Localization
 * 
 * Downloads all external assets and updates paths to local references
 * Supports update mode: only downloads new/modified assets
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { loadJSON, saveJSON, fileExists } = require('../utils/file-utils');

/**
 * Calculate file hash
 */
async function calculateHash(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Download file
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = require('fs').createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(outputPath).catch(() => {});
        return reject(new Error(`Failed to download: ${response.statusCode}`));
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (error) => {
      file.close();
      fs.unlink(outputPath).catch(() => {});
      reject(error);
    });
  });
}

/**
 * Extract local path from URL
 */
function getLocalPath(url, assetType, config) {
  const urlObj = new URL(url);
  const filename = path.basename(urlObj.pathname);
  const basePath = config.assetPaths[assetType] || 'images/';
  return path.join(basePath, filename);
}

/**
 * Compare assets for update mode
 */
async function compareAssets(newInventory, existingInventory, targetDir, config) {
  const comparison = {
    new: [],
    modified: [],
    unchanged: [],
    removed: []
  };

  // Create maps for existing assets
  const existingFonts = new Map();
  const existingImages = new Map();

  if (existingInventory) {
    existingInventory.fonts?.forEach(font => {
      const key = `${font.fontFamily}-${font.fontWeight}-${font.fontStyle}`;
      existingFonts.set(key, font);
    });

    existingInventory.images?.forEach(image => {
      existingImages.set(image.src, image);
    });
  }

  // Compare fonts
  for (const font of newInventory.fonts || []) {
    if (font.httpStatus !== 200) continue;

    const key = `${font.fontFamily}-${font.fontWeight}-${font.fontStyle}`;
    const existing = existingFonts.get(key);

    if (!existing) {
      comparison.new.push({ type: 'font', asset: font });
    } else {
      // Check if file exists and compare hash if update mode
      const localPath = getLocalPath(font.src, 'fonts', config);
      const fullPath = path.join(targetDir, localPath);

      if (await fileExists(fullPath) && config.update?.hashVerification) {
        const newHash = await calculateHash(fullPath);
        const oldHash = existing.hash;

        if (newHash !== oldHash) {
          comparison.modified.push({ type: 'font', asset: font, oldHash, newHash });
        } else {
          comparison.unchanged.push({ type: 'font', asset: font });
        }
      } else {
        comparison.new.push({ type: 'font', asset: font });
      }
    }
  }

  // Compare images
  for (const image of newInventory.images || []) {
    if (image.httpStatus !== 200) continue;

    const existing = existingImages.get(image.src);

    if (!existing) {
      comparison.new.push({ type: 'image', asset: image });
    } else {
      const localPath = getLocalPath(image.src, 'images', config);
      const fullPath = path.join(targetDir, localPath);

      if (await fileExists(fullPath) && config.update?.hashVerification) {
        const newHash = await calculateHash(fullPath);
        const oldHash = existing.hash;

        if (newHash !== oldHash) {
          comparison.modified.push({ type: 'image', asset: image, oldHash, newHash });
        } else {
          comparison.unchanged.push({ type: 'image', asset: image });
        }
      } else {
        comparison.new.push({ type: 'image', asset: image });
      }
    }
  }

  return comparison;
}

/**
 * Execute Phase 2
 */
async function execute({ originalUrl, targetDir, config, updateSetup, previousResults }) {
  console.log('Phase 2: Asset Download and Localization');

  // Load asset inventory from Phase 1
  const inventoryPath = path.join(targetDir, 'assets-inventory.json');
  const inventory = await loadJSON(inventoryPath);

  if (!inventory) {
    throw new Error('Asset inventory not found. Run Phase 1 first.');
  }

  // Load existing inventory if in update mode
  let existingInventory = null;
  if (updateSetup && updateSetup.existingInventory) {
    existingInventory = updateSetup.existingInventory;
  } else if (config.mode === 'update') {
    existingInventory = await loadJSON(inventoryPath);
  }

  // Compare assets if in update mode
  let comparison = null;
  if (existingInventory && config.update?.preserveUnchangedAssets) {
    console.log('Comparing assets for update mode...');
    comparison = await compareAssets(inventory, existingInventory, targetDir, config);
    console.log(`New: ${comparison.new.length}, Modified: ${comparison.modified.length}, Unchanged: ${comparison.unchanged.length}`);
  }

  const downloadReport = {
    timestamp: new Date().toISOString(),
    fonts: [],
    images: [],
    errors: [],
    summary: {
      fontsDownloaded: 0,
      imagesDownloaded: 0,
      fontsSkipped: 0,
      imagesSkipped: 0,
      errors: 0
    }
  };

  // Download fonts
  console.log('\nDownloading fonts...');
  // Download all fonts regardless of httpStatus (verification may fail but fonts are accessible)
  const fontsToDownload = comparison 
    ? [...comparison.new, ...comparison.modified].filter(a => a.type === 'font').map(a => a.asset)
    : inventory.fonts || [];

  for (const font of fontsToDownload) {
    try {
      // Extract filename from src URL
      let fontUrl = font.src;
      // Handle url() format
      const urlMatch = fontUrl.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch) {
        fontUrl = urlMatch[1];
      }
      
      // Resolve absolute URL
      let absoluteUrl;
      try {
        absoluteUrl = new URL(fontUrl, originalUrl).href;
      } catch (e) {
        if (fontUrl.startsWith('/')) {
          const urlObj = new URL(originalUrl);
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}${fontUrl}`;
        } else {
          absoluteUrl = fontUrl;
        }
      }
      
      // Extract filename and decode URL encoding
      const urlObj = new URL(absoluteUrl);
      let filename = path.basename(urlObj.pathname) || 'font.otf';
      // Decode URL-encoded characters (e.g., %20 -> space)
      filename = decodeURIComponent(filename);
      const localPath = path.join(config.assetPaths.fonts, filename);
      const fullPath = path.join(targetDir, localPath);

      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Download file
      console.log(`  Downloading: ${filename}`);
      await downloadFile(absoluteUrl, fullPath);

      // Calculate hash
      const hash = await calculateHash(fullPath);

      downloadReport.fonts.push({
        fontFamily: font.fontFamily,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        src: absoluteUrl,
        localPath,
        hash,
        status: 'downloaded'
      });

      downloadReport.summary.fontsDownloaded++;
    } catch (error) {
      console.error(`  ❌ Failed to download font: ${font.fontFamily}`, error.message);
      downloadReport.errors.push({
        type: 'font',
        asset: font,
        error: error.message
      });
      downloadReport.summary.errors++;
    }
  }

  // Skip unchanged fonts in update mode
  if (comparison && config.update?.preserveUnchangedAssets) {
    const unchangedFonts = comparison.unchanged.filter(a => a.type === 'font');
    unchangedFonts.forEach(({ asset }) => {
      const localPath = getLocalPath(asset.src, 'fonts', config);
      downloadReport.fonts.push({
        fontFamily: asset.fontFamily,
        fontWeight: asset.fontWeight,
        fontStyle: asset.fontStyle,
        src: asset.src,
        localPath,
        status: 'preserved'
      });
      downloadReport.summary.fontsSkipped++;
    });
  }

  // Download images
  console.log('\nDownloading images...');
  // Download all images regardless of httpStatus (verification may fail but images are accessible)
  const imagesToDownload = comparison
    ? [...comparison.new, ...comparison.modified].filter(a => a.type === 'image').map(a => a.asset)
    : inventory.images || [];

  // Deduplicate images by src
  const uniqueImages = new Map();
  imagesToDownload.forEach(img => {
    if (!uniqueImages.has(img.src)) {
      uniqueImages.set(img.src, img);
    }
  });

  for (const image of uniqueImages.values()) {
    try {
      // Determine local path based on image type
      let localPath;
      if (image.type === 'background-image') {
        localPath = getLocalPath(image.src, 'images', config);
      } else {
        // Try to preserve directory structure
        const urlObj = new URL(image.src);
        const urlPath = urlObj.pathname;
        const dirs = urlPath.split('/').slice(0, -1);
        let filename = path.basename(urlPath);
        // Decode URL-encoded characters
        filename = decodeURIComponent(filename);
        
        if (dirs.length > 1 && dirs[dirs.length - 1] === 'images') {
          // Preserve subdirectory structure
          localPath = path.join('images', ...dirs.slice(dirs.indexOf('images') + 1), filename);
        } else {
          localPath = path.join(config.assetPaths.images, filename);
        }
      }

      const fullPath = path.join(targetDir, localPath);

      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Download file
      console.log(`  Downloading: ${localPath}`);
      await downloadFile(image.src, fullPath);

      // Calculate hash
      const hash = await calculateHash(fullPath);

      downloadReport.images.push({
        src: image.src,
        localPath,
        element: image.element,
        type: image.type,
        hash,
        status: 'downloaded'
      });

      downloadReport.summary.imagesDownloaded++;
    } catch (error) {
      console.error(`  ❌ Failed to download image: ${image.src}`, error.message);
      downloadReport.errors.push({
        type: 'image',
        asset: image,
        error: error.message
      });
      downloadReport.summary.errors++;
    }
  }

  // Skip unchanged images in update mode
  if (comparison && config.update?.preserveUnchangedAssets) {
    const unchangedImages = comparison.unchanged.filter(a => a.type === 'image');
    unchangedImages.forEach(({ asset }) => {
      const localPath = getLocalPath(asset.src, 'images', config);
      downloadReport.images.push({
        src: asset.src,
        localPath,
        element: asset.element,
        type: asset.type,
        status: 'preserved'
      });
      downloadReport.summary.imagesSkipped++;
    });
  }

  // Download CSS files (AFTER fonts/images so we can update paths)
  console.log('\nDownloading CSS files...');
  const cssToDownload = inventory.cssLinks ? inventory.cssLinks.filter(c => c.httpStatus === 200) : [];
  
  for (const cssLink of cssToDownload) {
    try {
      const urlObj = new URL(cssLink.href);
      const filename = path.basename(urlObj.pathname) || 'index.css';
      const localPath = filename;
      const fullPath = path.join(targetDir, localPath);

      // Download file
      console.log(`  Downloading: ${filename}`);
      await downloadFile(cssLink.href, fullPath);

      // Update CSS file paths to local asset paths (fonts/images already downloaded)
      let cssContent = await fs.readFile(fullPath, 'utf8');
      
      // Update font paths in CSS: images/font-name.otf -> images/fonts/font-name.otf
      if (downloadReport.fonts && downloadReport.fonts.length > 0) {
        for (const font of downloadReport.fonts) {
          if (font.localPath && font.src) {
            // Extract filename from src (handle both encoded and decoded)
            const fontUrlObj = new URL(font.src);
            const fontFilename = path.basename(fontUrlObj.pathname);
            const fontFilenameDecoded = decodeURIComponent(fontFilename);
            
            // Replace references to fonts in images/ directory (try both encoded and decoded)
            const fontPathRegex1 = new RegExp(`url\\(['"]?images/${fontFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\)`, 'gi');
            const fontPathRegex2 = new RegExp(`url\\(['"]?images/${fontFilenameDecoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\)`, 'gi');
            cssContent = cssContent.replace(fontPathRegex1, `url("${font.localPath}")`);
            cssContent = cssContent.replace(fontPathRegex2, `url("${font.localPath}")`);
          }
        }
      }
      
      // Update image paths in CSS: absolute URLs -> relative paths
      if (downloadReport.images && downloadReport.images.length > 0) {
        for (const image of downloadReport.images) {
          if (image.localPath && image.src) {
            // Replace absolute URL with relative path in CSS
            const imageUrlRegex = new RegExp(image.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cssContent = cssContent.replace(imageUrlRegex, image.localPath);
          }
        }
      }
      
      // Write updated CSS
      await fs.writeFile(fullPath, cssContent, 'utf8');

      // Calculate hash
      const hash = await calculateHash(fullPath);

      if (!downloadReport.cssFiles) {
        downloadReport.cssFiles = [];
      }
      downloadReport.cssFiles.push({
        href: cssLink.href,
        localPath,
        hash,
        status: 'downloaded'
      });

      downloadReport.summary.cssFilesDownloaded = (downloadReport.summary.cssFilesDownloaded || 0) + 1;
    } catch (error) {
      console.error(`  ❌ Failed to download CSS: ${cssLink.href}`, error.message);
      downloadReport.errors.push({
        type: 'css',
        asset: cssLink,
        error: error.message
      });
      downloadReport.summary.errors++;
    }
  }

  console.log(`\n✅ Download complete:`);
  console.log(`   Fonts: ${downloadReport.summary.fontsDownloaded} downloaded, ${downloadReport.summary.fontsSkipped} preserved`);
  if (downloadReport.summary.cssFilesDownloaded) {
    console.log(`   CSS files: ${downloadReport.summary.cssFilesDownloaded} downloaded`);
  }
  console.log(`   Images: ${downloadReport.summary.imagesDownloaded} downloaded, ${downloadReport.summary.imagesSkipped} preserved`);
  if (downloadReport.summary.errors > 0) {
    console.log(`   ⚠️  Errors: ${downloadReport.summary.errors}`);
  }

  // Create initial index.html from Phase 1 HTML content
  const htmlPath = path.join(targetDir, 'index.html');
  if (!(await fileExists(htmlPath)) && inventory.htmlContent) {
    console.log('\nCreating initial index.html from original site...');
    let htmlContent = inventory.htmlContent;
    
    // Update asset paths in HTML
    // Update CSS paths
    if (downloadReport.cssFiles) {
      for (const cssFile of downloadReport.cssFiles) {
        if (cssFile.localPath && cssFile.href) {
          // Replace absolute URL with relative path in <link> tags
          const regex = new RegExp(cssFile.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          htmlContent = htmlContent.replace(regex, cssFile.localPath);
        }
      }
    }
    
    // Update font paths
    for (const font of downloadReport.fonts) {
      if (font.localPath && font.src) {
        // Replace absolute URL with relative path
        const regex = new RegExp(font.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        htmlContent = htmlContent.replace(regex, font.localPath);
      }
    }
    
    // Update image paths
    for (const image of downloadReport.images) {
      if (image.localPath && image.src) {
        // Replace absolute URL with relative path
        const regex = new RegExp(image.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        htmlContent = htmlContent.replace(regex, image.localPath);
      }
    }
    
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
    console.log('✅ Created index.html with local asset paths');
  }

  return {
    success: true,
    data: downloadReport,
    comparison
  };
}

module.exports = {
  execute
};
