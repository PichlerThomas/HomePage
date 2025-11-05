/**
 * Phase 1: Asset Discovery and Extraction
 * 
 * Discovers all assets (fonts, images, CSS) from the original site
 */

const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Extract @font-face declarations (browser-side function)
 */
const extractFontFacesScript = `
  (function() {
    const stylesheets = Array.from(document.styleSheets);
    const fontFaces = [];
    
    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            fontFaces.push({
              fontFamily: rule.style.fontFamily,
              src: rule.style.src,
              fontWeight: rule.style.fontWeight || 'normal',
              fontStyle: rule.style.fontStyle || 'normal'
            });
          }
        });
      } catch(e) {
        // Cross-origin stylesheets might fail
      }
    });
    
    return fontFaces;
  })();
`;

/**
 * Extract image sources (browser-side function)
 */
const extractImagesScript = `
  (function() {
    const images = [];
    
    // Extract <img src> attributes
    const imgElements = document.querySelectorAll('img');
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.startsWith('data:')) {
        images.push({
          element: 'img[' + index + ']',
          src: img.src,
          alt: img.alt || '',
          type: 'img'
        });
      }
    });
    
    // Extract CSS background-image URLs
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el, index) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.startsWith('url(')) {
        const urlMatch = bgImage.match(/url\\(['"]?([^'"]+)['"]?\\)/);
        if (urlMatch && !urlMatch[1].startsWith('data:')) {
          images.push({
            element: el.tagName.toLowerCase() + '[' + index + ']',
            src: urlMatch[1],
            type: 'background-image'
          });
        }
      }
    });
    
    return images;
  })();
`;

/**
 * Execute Phase 1
 */
async function execute({ originalUrl, targetDir, config }) {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log(`Navigating to: ${originalUrl}`);
    await page.goto(originalUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for fonts to load

    // Extract @font-face declarations
    console.log('Extracting @font-face declarations...');
    const fontFaces = await page.evaluate(extractFontFacesScript);
    
    // Extract images
    console.log('Extracting image sources...');
    const images = await page.evaluate(extractImagesScript);
    
    // Verify font file accessibility
    console.log('Verifying font file accessibility...');
    const fontsWithStatus = await Promise.all(
      fontFaces.map(async (font) => {
        const srcMatch = font.src.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (!srcMatch) return { ...font, httpStatus: 0 };
        
        const fontUrl = srcMatch[1];
        // Resolve relative URLs
        const absoluteUrl = new URL(fontUrl, originalUrl).href;
        
        try {
          const response = await page.goto(absoluteUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          return {
            ...font,
            src: absoluteUrl,
            httpStatus: response ? response.status() : 0
          };
        } catch (e) {
          return { ...font, src: absoluteUrl, httpStatus: 0 };
        }
      })
    );
    
    // Verify image accessibility
    console.log('Verifying image accessibility...');
    const imagesWithStatus = await Promise.all(
      images.map(async (image) => {
        const absoluteUrl = new URL(image.src, originalUrl).href;
        try {
          const response = await page.goto(absoluteUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          return {
            ...image,
            src: absoluteUrl,
            httpStatus: response ? response.status() : 0
          };
        } catch (e) {
          return { ...image, src: absoluteUrl, httpStatus: 0 };
        }
      })
    );
    
    // Create asset inventory
    const inventory = {
      timestamp: new Date().toISOString(),
      originalUrl,
      fonts: fontsWithStatus,
      images: imagesWithStatus,
      summary: {
        totalFonts: fontsWithStatus.length,
        accessibleFonts: fontsWithStatus.filter(f => f.httpStatus === 200).length,
        totalImages: imagesWithStatus.length,
        accessibleImages: imagesWithStatus.filter(i => i.httpStatus === 200).length
      }
    };
    
    console.log(`✅ Discovered ${inventory.summary.totalFonts} fonts, ${inventory.summary.totalImages} images`);
    
    return {
      success: true,
      data: inventory
    };
    
  } finally {
    await browser.close();
  }
}

module.exports = {
  execute
};

