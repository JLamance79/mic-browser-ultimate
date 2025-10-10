/**
 * IconConverter - Professional Icon Processing Utility
 * Converts images to various icon formats with optimization
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class IconConverter {
    constructor(options = {}) {
        this.options = {
            quality: 95,
            compression: 'lossless',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            ...options
        };
    }

    /**
     * Convert image to Windows ICO format with multiple sizes
     */
    async convertToIco(inputPath, outputPath, sizes = [16, 32, 48, 256]) {
        try {
            const inputBuffer = await fs.readFile(inputPath);
            const icoImages = [];

            for (const size of sizes) {
                const resized = await sharp(inputBuffer)
                    .resize(size, size, {
                        fit: 'contain',
                        background: this.options.background
                    })
                    .png({ quality: this.options.quality })
                    .toBuffer();
                
                icoImages.push({
                    size: size,
                    buffer: resized
                });
            }

            // Create ICO file (simplified - real implementation would need ICO format writer)
            const icoBuffer = await this.createIcoBuffer(icoImages);
            await fs.writeFile(outputPath, icoBuffer);
            
            return {
                success: true,
                outputPath,
                sizes: sizes,
                fileSize: icoBuffer.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate favicon package (multiple formats and sizes)
     */
    async generateFaviconPackage(inputPath, outputDir) {
        const faviconSizes = [16, 32, 48, 64, 96, 128, 192, 512];
        const results = [];

        try {
            await fs.mkdir(outputDir, { recursive: true });
            const inputBuffer = await fs.readFile(inputPath);

            // Generate PNG favicons
            for (const size of faviconSizes) {
                const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
                await sharp(inputBuffer)
                    .resize(size, size, {
                        fit: 'contain',
                        background: this.options.background
                    })
                    .png({ quality: this.options.quality })
                    .toFile(outputPath);
                
                results.push({ size, format: 'png', path: outputPath });
            }

            // Generate ICO favicon
            const icoPath = path.join(outputDir, 'favicon.ico');
            await this.convertToIco(inputPath, icoPath, [16, 32, 48]);
            results.push({ size: 'multi', format: 'ico', path: icoPath });

            // Generate Apple Touch Icon
            const appleTouchPath = path.join(outputDir, 'apple-touch-icon.png');
            await sharp(inputBuffer)
                .resize(180, 180, {
                    fit: 'contain',
                    background: this.options.background
                })
                .png({ quality: this.options.quality })
                .toFile(appleTouchPath);
            
            results.push({ size: 180, format: 'apple-touch', path: appleTouchPath });

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
     * Convert to multiple platform formats
     */
    async convertMultiPlatform(inputPath, outputDir, platforms = ['windows', 'mac', 'web', 'android']) {
        const platformConfigs = {
            windows: { format: 'ico', sizes: [16, 32, 48, 256] },
            mac: { format: 'icns', sizes: [16, 32, 64, 128, 256, 512] },
            web: { format: 'png', sizes: [16, 32, 48, 96, 192, 512] },
            android: { format: 'png', sizes: [36, 48, 72, 96, 144, 192, 512] }
        };

        const results = {};

        try {
            await fs.mkdir(outputDir, { recursive: true });

            for (const platform of platforms) {
                const config = platformConfigs[platform];
                const platformDir = path.join(outputDir, platform);
                await fs.mkdir(platformDir, { recursive: true });

                if (config.format === 'ico') {
                    const icoPath = path.join(platformDir, 'icon.ico');
                    results[platform] = await this.convertToIco(inputPath, icoPath, config.sizes);
                } else {
                    results[platform] = await this.generatePngSet(inputPath, platformDir, config.sizes);
                }
            }

            return {
                success: true,
                platforms: results,
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
     * Generate PNG set for specific sizes
     */
    async generatePngSet(inputPath, outputDir, sizes) {
        try {
            const inputBuffer = await fs.readFile(inputPath);
            const results = [];

            for (const size of sizes) {
                const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
                await sharp(inputBuffer)
                    .resize(size, size, {
                        fit: 'contain',
                        background: this.options.background
                    })
                    .png({ quality: this.options.quality })
                    .toFile(outputPath);
                
                results.push({ size, path: outputPath });
            }

            return {
                success: true,
                results: results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create ICO buffer (simplified implementation)
     */
    async createIcoBuffer(images) {
        // This is a simplified implementation
        // Real ICO format requires proper header and directory structure
        const header = Buffer.alloc(6);
        header.writeUInt16LE(0, 0); // Reserved
        header.writeUInt16LE(1, 2); // Type (1 = ICO)
        header.writeUInt16LE(images.length, 4); // Number of images

        const directory = Buffer.alloc(16 * images.length);
        let dataOffset = 6 + (16 * images.length);
        let currentOffset = 0;

        const imageBuffers = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const size = image.size;
            const buffer = image.buffer;

            // Directory entry
            directory.writeUInt8(size === 256 ? 0 : size, currentOffset); // Width
            directory.writeUInt8(size === 256 ? 0 : size, currentOffset + 1); // Height
            directory.writeUInt8(0, currentOffset + 2); // Color palette
            directory.writeUInt8(0, currentOffset + 3); // Reserved
            directory.writeUInt16LE(1, currentOffset + 4); // Planes
            directory.writeUInt16LE(32, currentOffset + 6); // Bit count
            directory.writeUInt32LE(buffer.length, currentOffset + 8); // Image size
            directory.writeUInt32LE(dataOffset, currentOffset + 12); // Image offset

            imageBuffers.push(buffer);
            dataOffset += buffer.length;
            currentOffset += 16;
        }

        return Buffer.concat([header, directory, ...imageBuffers]);
    }

    /**
     * Optimize existing icon
     */
    async optimizeIcon(inputPath, outputPath, options = {}) {
        try {
            const opts = { ...this.options, ...options };
            
            await sharp(inputPath)
                .png({
                    quality: opts.quality,
                    compressionLevel: 9,
                    adaptiveFiltering: true
                })
                .toFile(outputPath);

            const inputStats = await fs.stat(inputPath);
            const outputStats = await fs.stat(outputPath);

            return {
                success: true,
                originalSize: inputStats.size,
                optimizedSize: outputStats.size,
                savings: ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(2) + '%'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = IconConverter;

// Usage Examples:
/*
const iconConverter = new IconConverter();

// Convert to Windows ICO
await iconConverter.convertToIco('icon.png', 'icon.ico', [16, 32, 48, 256]);

// Generate complete favicon package
await iconConverter.generateFaviconPackage('logo.png', './favicons/');

// Convert for all platforms
await iconConverter.convertMultiPlatform('app-icon.svg', './icons/', ['windows', 'mac', 'web']);

// Optimize existing icon
await iconConverter.optimizeIcon('large-icon.png', 'optimized-icon.png', { quality: 90 });
*/