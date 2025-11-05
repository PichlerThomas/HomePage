/**
 * Automated Visual Regression Tests for Homepage Recreation
 * 
 * Test-First Approach: Tests run on original site first, then on new site
 * 
 * Usage:
 * 1. Open browser console on https://ceruleancircle.com/
 * 2. Copy and paste this entire script
 * 3. Run: testOriginalSite()
 * 4. Save results as baseline
 * 5. Open browser console on https://pichlerthomas.github.io/HomePage/
 * 6. Run: testNewSite()
 * 7. Compare results
 */

// Test Configuration
const TEST_CONFIG = {
    originalSite: 'https://ceruleancircle.com/',
    newSite: 'https://pichlerthomas.github.io/HomePage/',
    tolerance: 0.1 // 10% tolerance for image loading
};

/**
 * Test Suite: Navigation
 */
function testNavigation() {
    const navLinks = Array.from(document.querySelectorAll('nav a, header nav a, [role="navigation"] a'));
    const expectedLinks = ['About', 'Methods', 'Technology', 'Experience', 'Contact'];
    
    const results = {
        testName: 'TC1: Navigation Structure',
        passed: false,
        details: {},
        errors: []
    };
    
    if (navLinks.length !== 5) {
        results.errors.push(`Expected 5 nav links, found ${navLinks.length}`);
    }
    
    const linkTexts = navLinks.map(link => link.textContent.trim());
    expectedLinks.forEach(expected => {
        if (!linkTexts.some(text => text.includes(expected))) {
            results.errors.push(`Missing nav link: ${expected}`);
        }
    });
    
    results.passed = results.errors.length === 0;
    results.details = {
        found: navLinks.length,
        expected: 5,
        links: linkTexts,
        hrefs: navLinks.map(link => link.getAttribute('href'))
    };
    
    return results;
}

/**
 * Test Suite: Images (Critical for visual verification)
 */
function testImages() {
    const results = {
        testName: 'TC-IMAGES: Image Loading and Presence',
        passed: false,
        details: {
            totalImages: 0,
            loadedImages: 0,
            missingImages: [],
            brokenImages: [],
            imageDetails: []
        },
        errors: []
    };
    
    const allImages = Array.from(document.querySelectorAll('img'));
    results.details.totalImages = allImages.length;
    
    allImages.forEach((img, index) => {
        const imgInfo = {
            index: index,
            src: img.src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
            loaded: img.complete && img.naturalWidth > 0,
            display: window.getComputedStyle(img).display !== 'none'
        };
        
        results.details.imageDetails.push(imgInfo);
        
        if (imgInfo.loaded && imgInfo.width > 0 && imgInfo.height > 0) {
            results.details.loadedImages++;
        } else {
            if (imgInfo.src && !imgInfo.src.includes('data:')) {
                results.details.brokenImages.push({
                    src: imgInfo.src,
                    alt: imgInfo.alt,
                    reason: imgInfo.width === 0 ? 'Zero dimensions' : 'Not loaded'
                });
                results.errors.push(`Broken image: ${imgInfo.alt || imgInfo.src}`);
            }
        }
    });
    
    // Check for expected images
    const expectedImageTypes = [
        { pattern: /logo/i, name: 'Logo' },
        { pattern: /systemic|business|design/i, name: 'Systemic Business Design' },
        { pattern: /ecolog/i, name: 'Smart Ecologies' },
        { pattern: /metamodel/i, name: 'Economic Metamodeling' },
        { pattern: /woda|component/i, name: 'Woda Component' },
        { pattern: /stack/i, name: 'Woda Stack' },
        { pattern: /m2m|machine/i, name: 'Woda m2m' },
        { pattern: /gunther|sonnenfeld/i, name: 'Gunther Sonnenfeld' },
        { pattern: /marcel|donges/i, name: 'Marcel Donges' },
        { pattern: /2cu|currency/i, name: '2cu Currency' },
        { pattern: /evolution/i, name: 'Evolution' },
        { pattern: /book|surviving|lean|smil|energy|perilous|abiogenesis|pekka|primal|voice|daniele|wisdom|cryptography/i, name: 'Book covers' }
    ];
    
    const foundImageTypes = [];
    allImages.forEach(img => {
        const alt = img.alt.toLowerCase();
        const src = img.src.toLowerCase();
        expectedImageTypes.forEach(type => {
            if (type.pattern.test(alt) || type.pattern.test(src)) {
                foundImageTypes.push(type.name);
            }
        });
    });
    
    results.details.foundImageTypes = foundImageTypes;
    results.details.missingImageTypes = expectedImageTypes
        .filter(type => !foundImageTypes.includes(type.name))
        .map(type => type.name);
    
    if (results.details.missingImageTypes.length > 0) {
        results.errors.push(`Missing image types: ${results.details.missingImageTypes.join(', ')}`);
    }
    
    const loadRate = results.details.totalImages > 0 
        ? results.details.loadedImages / results.details.totalImages 
        : 0;
    
    results.passed = results.errors.length === 0 && loadRate >= (1 - TEST_CONFIG.tolerance);
    
    return results;
}

/**
 * Test Suite: Styles and CSS
 */
function testStyles() {
    const results = {
        testName: 'TC-STYLES: CSS and Styling',
        passed: false,
        details: {
            hasNavStyles: false,
            hasHeroStyles: false,
            hasResponsiveStyles: false,
            backgroundColors: [],
            fontFamilies: [],
            mediaQueries: 0
        },
        errors: []
    };
    
    // Check navigation styles
    const nav = document.querySelector('nav, header nav, [role="navigation"]');
    if (nav) {
        const navStyles = window.getComputedStyle(nav);
        results.details.hasNavStyles = navStyles.position !== 'static' || navStyles.backgroundColor !== 'transparent';
    }
    
    // Check hero section
    const hero = document.querySelector('.hero, [class*="hero"], main > section:first-child');
    if (hero) {
        const heroStyles = window.getComputedStyle(hero);
        results.details.hasHeroStyles = heroStyles.paddingTop !== '0px' || heroStyles.textAlign === 'center';
    }
    
    // Check for responsive styles (media queries in stylesheets)
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach(sheet => {
        try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
                if (rule.type === CSSRule.MEDIA_RULE) {
                    results.details.mediaQueries++;
                }
                if (rule.type === CSSRule.STYLE_RULE) {
                    if (rule.style.backgroundColor && rule.style.backgroundColor !== 'transparent') {
                        results.details.backgroundColors.push(rule.style.backgroundColor);
                    }
                    if (rule.style.fontFamily) {
                        results.details.fontFamilies.push(rule.style.fontFamily);
                    }
                }
            });
        } catch (e) {
            // Cross-origin stylesheets may throw
        }
    });
    
    // Check inline styles
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);
    if (bodyStyles.fontFamily) {
        results.details.fontFamilies.push(bodyStyles.fontFamily);
    }
    if (bodyStyles.backgroundColor && bodyStyles.backgroundColor !== 'transparent') {
        results.details.backgroundColors.push(bodyStyles.backgroundColor);
    }
    
    results.details.hasResponsiveStyles = results.details.mediaQueries > 0;
    
    if (!results.details.hasNavStyles) {
        results.errors.push('Navigation styles not detected');
    }
    if (!results.details.hasHeroStyles) {
        results.errors.push('Hero section styles not detected');
    }
    
    results.passed = results.errors.length === 0;
    
    return results;
}

/**
 * Test Suite: Content Sections
 */
function testContentSections() {
    const results = {
        testName: 'TC-CONTENT: Content Sections',
        passed: false,
        details: {
            sections: {},
            missingSections: []
        },
        errors: []
    };
    
    const expectedSections = [
        { id: 'hero', heading: 'Enabling Prosperous Futures', level: 2 },
        { id: 'highlights', heading: 'Meta Structures', level: 4 },
        { id: 'about', heading: 'About', idSelector: '#about' },
        { id: 'transformations', heading: 'Transformations Abound', level: 2 },
        { id: 'methods', heading: 'Our Methods', level: 2 },
        { id: 'technology', heading: 'Our Technology Stack', level: 2 },
        { id: 'story', heading: 'Our Story', level: 2 },
        { id: 'partners', heading: 'The Managing Partners', level: 2 },
        { id: 'experience', heading: 'Our Experience', level: 2 },
        { id: 'books', heading: 'A Few Books That Inspire Us', level: 2 },
        { id: 'contact', heading: "We'd love to hear from you", level: 2 },
        { id: 'footer', text: 'Powered by Cerulean' }
    ];
    
    expectedSections.forEach(section => {
        let found = false;
        let element = null;
        
        if (section.idSelector) {
            element = document.querySelector(section.idSelector);
            found = element !== null;
        } else if (section.heading) {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            element = headings.find(h => 
                h.textContent.includes(section.heading) &&
                (!section.level || h.tagName === `H${section.level}`)
            );
            found = element !== null;
        } else if (section.text) {
            element = Array.from(document.querySelectorAll('*')).find(el => 
                el.textContent.includes(section.text)
            );
            found = element !== null;
        }
        
        results.details.sections[section.id] = {
            found: found,
            element: element ? element.tagName : null,
            text: element ? element.textContent.substring(0, 100) : null
        };
        
        if (!found) {
            results.details.missingSections.push(section.id);
            results.errors.push(`Missing section: ${section.id} (${section.heading || section.text})`);
        }
    });
    
    results.passed = results.errors.length === 0;
    
    return results;
}

/**
 * Test Suite: Videos
 */
function testVideos() {
    const results = {
        testName: 'TC-VIDEOS: Video Embeds',
        passed: false,
        details: {
            totalVideos: 0,
            youtubeVideos: 0,
            videoSources: []
        },
        errors: []
    };
    
    const videos = Array.from(document.querySelectorAll('iframe[src*="youtube"], iframe[src*="youtu.be"], video'));
    results.details.totalVideos = videos.length;
    
    videos.forEach(video => {
        const src = video.src || video.getAttribute('src') || '';
        if (src.includes('youtube') || src.includes('youtu.be')) {
            results.details.youtubeVideos++;
            results.details.videoSources.push(src);
        }
    });
    
    // Expected: At least 1 YouTube video (hero section)
    if (results.details.youtubeVideos === 0) {
        results.errors.push('No YouTube videos found');
    }
    
    results.passed = results.errors.length === 0 && results.details.youtubeVideos > 0;
    
    return results;
}

/**
 * Run all tests on current page
 */
function runAllTests() {
    console.log('%c🧪 Running Automated Tests...', 'font-size: 16px; font-weight: bold; color: #667eea;');
    console.log('Current URL:', window.location.href);
    console.log('---');
    
    const tests = [
        testNavigation(),
        testImages(),
        testStyles(),
        testContentSections(),
        testVideos()
    ];
    
    const results = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        tests: tests,
        summary: {
            total: tests.length,
            passed: tests.filter(t => t.passed).length,
            failed: tests.filter(t => !t.passed).length
        }
    };
    
    // Display results
    console.table(results.summary);
    
    tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} ${test.testName}`);
        if (!test.passed) {
            console.error('Errors:', test.errors);
        }
        if (test.details) {
            console.log('Details:', test.details);
        }
    });
    
    // Store results globally for comparison
    window.testResults = results;
    
    return results;
}

/**
 * Test original site (baseline)
 */
function testOriginalSite() {
    if (!window.location.href.includes('ceruleancircle.com')) {
        console.warn('⚠️  Not on original site. Navigate to https://ceruleancircle.com/ first');
        return null;
    }
    console.log('%c📊 Testing ORIGINAL Site (Baseline)', 'font-size: 16px; font-weight: bold; color: green;');
    return runAllTests();
}

/**
 * Test new site (recreation)
 */
function testNewSite() {
    if (!window.location.href.includes('pichlerthomas.github.io')) {
        console.warn('⚠️  Not on new site. Navigate to https://pichlerthomas.github.io/HomePage/ first');
        return null;
    }
    console.log('%c🆕 Testing NEW Site (Recreation)', 'font-size: 16px; font-weight: bold; color: blue;');
    return runAllTests();
}

/**
 * Compare results between original and new site
 */
function compareResults(originalResults, newResults) {
    if (!originalResults || !newResults) {
        console.error('❌ Need both original and new results to compare');
        console.log('Usage:');
        console.log('1. Run testOriginalSite() on original site, copy results');
        console.log('2. Run testNewSite() on new site');
        console.log('3. Run compareResults(originalResults, newResults)');
        return;
    }
    
    console.log('%c📊 Comparing Test Results', 'font-size: 16px; font-weight: bold; color: purple;');
    console.log('---');
    
    const comparison = {
        navigation: {
            original: originalResults.tests[0],
            new: newResults.tests[0],
            match: JSON.stringify(originalResults.tests[0].details) === JSON.stringify(newResults.tests[0].details)
        },
        images: {
            original: originalResults.tests[1],
            new: newResults.tests[1],
            differences: {
                totalImages: newResults.tests[1].details.totalImages - originalResults.tests[1].details.totalImages,
                loadedImages: newResults.tests[1].details.loadedImages - originalResults.tests[1].details.loadedImages,
                missingInNew: newResults.tests[1].details.missingImageTypes.filter(type => 
                    !originalResults.tests[1].details.missingImageTypes.includes(type)
                )
            }
        },
        styles: {
            original: originalResults.tests[2],
            new: newResults.tests[2]
        },
        content: {
            original: originalResults.tests[3],
            new: newResults.tests[3],
            missingInNew: newResults.tests[3].details.missingSections.filter(section =>
                !originalResults.tests[3].details.missingSections.includes(section)
            )
        },
        videos: {
            original: originalResults.tests[4],
            new: newResults.tests[4]
        }
    };
    
    console.log('Comparison Results:');
    console.log(comparison);
    
    // Summary
    const issues = [];
    if (comparison.images.differences.missingInNew.length > 0) {
        issues.push(`Missing images: ${comparison.images.differences.missingInNew.join(', ')}`);
    }
    if (comparison.content.missingInNew.length > 0) {
        issues.push(`Missing sections: ${comparison.content.missingInNew.join(', ')}`);
    }
    if (comparison.images.differences.loadedImages < 0) {
        issues.push(`Fewer images loaded: ${Math.abs(comparison.images.differences.loadedImages)}`);
    }
    
    if (issues.length === 0) {
        console.log('%c✅ All tests match!', 'font-size: 16px; font-weight: bold; color: green;');
    } else {
        console.log('%c❌ Differences found:', 'font-size: 16px; font-weight: bold; color: red;');
        issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return comparison;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testNavigation,
        testImages,
        testStyles,
        testContentSections,
        testVideos,
        runAllTests,
        testOriginalSite,
        testNewSite,
        compareResults
    };
}

// Auto-run instructions
console.log('%c📋 Automated Test Suite Loaded', 'font-size: 14px; font-weight: bold;');
console.log('Available functions:');
console.log('  - testOriginalSite() - Run on https://ceruleancircle.com/');
console.log('  - testNewSite() - Run on https://pichlerthomas.github.io/HomePage/');
console.log('  - runAllTests() - Run all tests on current page');
console.log('  - compareResults(original, new) - Compare two test results');

