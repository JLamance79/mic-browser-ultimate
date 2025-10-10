/**
 * Favicon Generator - Complete Favicon Package Creator
 * Generates all favicon formats needed for modern web applications
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class FaviconGenerator {
    constructor(options = {}) {
        this.options = {
            quality: 95,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            outputDir: './favicons',
            appName: 'MIC Browser Ultimate',
            appDescription: 'AI-Powered Web Browser',
            developerName: 'MIC Browser Team',
            developerUrl: 'https://micbrowser.com',
            themeColor: '#6366f1',
            backgroundColor: '#1e1e2e',
            ...options
        };
    }

    /**
     * Generate complete favicon package
     */
    async generateComplete(inputPath, outputDir = this.options.outputDir) {
        try {
            await fs.mkdir(outputDir, { recursive: true });
            const results = {};

            // Generate all favicon formats
            results.standard = await this.generateStandardFavicons(inputPath, outputDir);
            results.apple = await this.generateAppleFavicons(inputPath, outputDir);
            results.android = await this.generateAndroidFavicons(inputPath, outputDir);
            results.windows = await this.generateWindowsFavicons(inputPath, outputDir);
            results.webManifest = await this.generateWebManifest(outputDir);
            results.browserConfig = await this.generateBrowserConfig(outputDir);
            results.htmlTags = await this.generateHtmlTags();

            // Create README with usage instructions
            await this.generateReadme(outputDir, results);

            return {
                success: true,
                results: results,
                outputDir: outputDir
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate standard web favicons
     */
    async generateStandardFavicons(inputPath, outputDir) {
        const sizes = [16, 32, 48, 64, 96];
        const results = [];
        const inputBuffer = await fs.readFile(inputPath);

        // PNG favicons
        for (const size of sizes) {
            const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
            await sharp(inputBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: this.options.background
                })
                .png({ quality: this.options.quality })
                .toFile(outputPath);
            
            results.push({ size, format: 'png', filename: `favicon-${size}x${size}.png` });
        }

        // ICO favicon (multi-size)
        const icoPath = path.join(outputDir, 'favicon.ico');
        await this.createMultiSizeIco(inputBuffer, icoPath, [16, 32, 48]);
        results.push({ size: 'multi', format: 'ico', filename: 'favicon.ico' });

        return results;
    }

    /**
     * Generate Apple-specific favicons
     */
    async generateAppleFavicons(inputPath, outputDir) {
        const appleSizes = [
            57, 60, 72, 76, 114, 120, 144, 152, 167, 180
        ];
        const results = [];
        const inputBuffer = await fs.readFile(inputPath);

        for (const size of appleSizes) {
            const outputPath = path.join(outputDir, `apple-touch-icon-${size}x${size}.png`);
            await sharp(inputBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: this.options.background
                })
                .png({ quality: this.options.quality })
                .toFile(outputPath);
            
            results.push({ size, filename: `apple-touch-icon-${size}x${size}.png` });
        }

        // Standard Apple touch icon
        const standardPath = path.join(outputDir, 'apple-touch-icon.png');
        await sharp(inputBuffer)
            .resize(180, 180, {
                fit: 'contain',
                background: this.options.background
            })
            .png({ quality: this.options.quality })
            .toFile(standardPath);
        
        results.push({ size: 180, filename: 'apple-touch-icon.png', isDefault: true });

        return results;
    }

    /**
     * Generate Android favicons
     */
    async generateAndroidFavicons(inputPath, outputDir) {
        const androidSizes = [36, 48, 72, 96, 144, 192, 256, 384, 512];
        const results = [];
        const inputBuffer = await fs.readFile(inputPath);

        for (const size of androidSizes) {
            const outputPath = path.join(outputDir, `android-chrome-${size}x${size}.png`);
            await sharp(inputBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: this.options.background
                })
                .png({ quality: this.options.quality })
                .toFile(outputPath);
            
            results.push({ size, filename: `android-chrome-${size}x${size}.png` });
        }

        return results;
    }

    /**
     * Generate Windows-specific favicons
     */
    async generateWindowsFavicons(inputPath, outputDir) {
        const windowsSizes = [70, 150, 310];
        const results = [];
        const inputBuffer = await fs.readFile(inputPath);

        // Square tiles
        for (const size of windowsSizes) {
            const outputPath = path.join(outputDir, `mstile-${size}x${size}.png`);
            await sharp(inputBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 99, g: 102, b: 241, alpha: 1 } // Theme color background
                })
                .png({ quality: this.options.quality })
                .toFile(outputPath);
            
            results.push({ size: `${size}x${size}`, filename: `mstile-${size}x${size}.png` });
        }

        // Wide tile
        const wideOutputPath = path.join(outputDir, 'mstile-310x150.png');
        await sharp(inputBuffer)
            .resize(310, 150, {
                fit: 'contain',
                background: { r: 99, g: 102, b: 241, alpha: 1 }
            })
            .png({ quality: this.options.quality })
            .toFile(wideOutputPath);
        
        results.push({ size: '310x150', filename: 'mstile-310x150.png' });

        return results;
    }

    /**
     * Generate web app manifest
     */
    async generateWebManifest(outputDir) {
        const manifest = {
            name: this.options.appName,
            short_name: this.options.appName.split(' ')[0],
            description: this.options.appDescription,
            start_url: "/",
            display: "standalone",
            orientation: "portrait",
            theme_color: this.options.themeColor,
            background_color: this.options.backgroundColor,
            icons: [
                {
                    src: "android-chrome-36x36.png",
                    sizes: "36x36",
                    type: "image/png"
                },
                {
                    src: "android-chrome-48x48.png",
                    sizes: "48x48",
                    type: "image/png"
                },
                {
                    src: "android-chrome-72x72.png",
                    sizes: "72x72",
                    type: "image/png"
                },
                {
                    src: "android-chrome-96x96.png",
                    sizes: "96x96",
                    type: "image/png"
                },
                {
                    src: "android-chrome-144x144.png",
                    sizes: "144x144",
                    type: "image/png"
                },
                {
                    src: "android-chrome-192x192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "android-chrome-256x256.png",
                    sizes: "256x256",
                    type: "image/png"
                },
                {
                    src: "android-chrome-384x384.png",
                    sizes: "384x384",
                    type: "image/png"
                },
                {
                    src: "android-chrome-512x512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        };

        const manifestPath = path.join(outputDir, 'site.webmanifest');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        return { filename: 'site.webmanifest', content: manifest };
    }

    /**
     * Generate browser config XML
     */
    async generateBrowserConfig(outputDir) {
        const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="mstile-70x70.png"/>
            <square150x150logo src="mstile-150x150.png"/>
            <square310x310logo src="mstile-310x310.png"/>
            <wide310x150logo src="mstile-310x150.png"/>
            <TileColor>${this.options.themeColor}</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

        const configPath = path.join(outputDir, 'browserconfig.xml');
        await fs.writeFile(configPath, browserConfig);

        return { filename: 'browserconfig.xml', content: browserConfig };
    }

    /**
     * Generate HTML tags for favicon implementation
     */
    async generateHtmlTags() {
        return `<!-- Favicon Package Generated by MIC Browser Ultimate -->
<!-- Standard Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">

<!-- Android Chrome Icons -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">

<!-- Windows/IE Tiles -->
<meta name="msapplication-TileColor" content="${this.options.themeColor}">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Theme Colors -->
<meta name="theme-color" content="${this.options.themeColor}">
<meta name="msapplication-navbutton-color" content="${this.options.themeColor}">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

<!-- Web App Settings -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${this.options.appName}">
<meta name="application-name" content="${this.options.appName}">`;
    }

    /**
     * Create multi-size ICO file
     */
    async createMultiSizeIco(inputBuffer, outputPath, sizes) {
        // For this example, we'll create a PNG for the largest size
        // In production, you'd use a proper ICO encoder
        const largestSize = Math.max(...sizes);
        await sharp(inputBuffer)
            .resize(largestSize, largestSize, {
                fit: 'contain',
                background: this.options.background
            })
            .png({ quality: this.options.quality })
            .toFile(outputPath.replace('.ico', '.png'));

        // Copy as ICO (simplified - would need proper ICO format in production)
        await fs.copyFile(outputPath.replace('.ico', '.png'), outputPath);
        await fs.unlink(outputPath.replace('.ico', '.png'));
    }

    /**
     * Generate README with usage instructions
     */
    async generateReadme(outputDir, results) {
        const readme = `# Favicon Package

Generated by MIC Browser Ultimate Favicon Generator

## Files Included

### Standard Web Favicons
${results.standard.map(f => `- ${f.filename} (${f.size}x${f.size || f.size})`).join('\n')}

### Apple Touch Icons
${results.apple.map(f => `- ${f.filename} (${f.size}x${f.size})`).join('\n')}

### Android Chrome Icons
${results.android.map(f => `- ${f.filename} (${f.size}x${f.size})`).join('\n')}

### Windows Tiles
${results.windows.map(f => `- ${f.filename} (${f.size})`).join('\n')}

### Configuration Files
- site.webmanifest - Web App Manifest
- browserconfig.xml - Windows Browser Configuration

## Installation

1. Copy all files to your website's root directory
2. Add the HTML tags from html-tags.txt to your <head> section
3. Test favicon display across different browsers and devices

## HTML Implementation

Add these tags to your HTML <head> section:

\`\`\`html
${results.htmlTags}
\`\`\`

## Testing

- Desktop browsers: Check favicon in tab and bookmarks
- Mobile devices: Check home screen icon when added to homescreen
- Windows: Check tile appearance in Start Menu
- macOS: Check dock icon and finder

Generated on: ${new Date().toISOString()}
App: ${this.options.appName}
Theme Color: ${this.options.themeColor}
Background Color: ${this.options.backgroundColor}
`;

        const readmePath = path.join(outputDir, 'README.md');
        await fs.writeFile(readmePath, readme);

        const htmlTagsPath = path.join(outputDir, 'html-tags.txt');
        await fs.writeFile(htmlTagsPath, results.htmlTags);

        return { readme: 'README.md', htmlTags: 'html-tags.txt' };
    }
}

module.exports = FaviconGenerator;

// Usage Example:
/*
const faviconGenerator = new FaviconGenerator({
    appName: 'MIC Browser Ultimate',
    appDescription: 'AI-Powered Web Browser',
    themeColor: '#6366f1',
    backgroundColor: '#1e1e2e'
});

// Generate complete favicon package
const result = await faviconGenerator.generateComplete('logo.png', './public/favicons/');
console.log('Favicon package generated:', result);
*/