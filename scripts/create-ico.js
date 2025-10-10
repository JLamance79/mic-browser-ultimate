const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Simple ICO file format writer
class IcoWriter {
  constructor() {
    this.images = [];
  }
  
  addImage(buffer, width, height) {
    this.images.push({ buffer, width, height });
  }
  
  writeToFile(filePath) {
    // ICO file header (6 bytes)
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);      // Reserved (must be 0)
    header.writeUInt16LE(1, 2);      // Image type (1 for ICO)
    header.writeUInt16LE(this.images.length, 4); // Number of images
    
    // Calculate offsets
    let offset = 6 + (this.images.length * 16); // Header + directory entries
    const directoryEntries = [];
    
    for (const image of this.images) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(image.width === 256 ? 0 : image.width, 0);  // Width (0 means 256)
      entry.writeUInt8(image.height === 256 ? 0 : image.height, 1); // Height (0 means 256)
      entry.writeUInt8(0, 2);          // Color palette (0 for PNG)
      entry.writeUInt8(0, 3);          // Reserved
      entry.writeUInt16LE(1, 4);       // Color planes
      entry.writeUInt16LE(32, 6);      // Bits per pixel
      entry.writeUInt32LE(image.buffer.length, 8); // Image data size
      entry.writeUInt32LE(offset, 12); // Offset to image data
      
      directoryEntries.push(entry);
      offset += image.buffer.length;
    }
    
    // Combine all parts
    const buffers = [header, ...directoryEntries, ...this.images.map(img => img.buffer)];
    const finalBuffer = Buffer.concat(buffers);
    
    fs.writeFileSync(filePath, finalBuffer);
  }
}

async function createProperIco() {
  try {
    const assetsDir = path.join(__dirname, '..', 'assets');
    const svgPath = path.join(assetsDir, 'icon.svg');
    const icoPath = path.join(assetsDir, 'icon.ico');
    
    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error('SVG file not found at:', svgPath);
      console.log('Please run: node scripts/create-icon.js first');
      return;
    }
    
    console.log('Creating proper ICO file...');
    
    // Create ICO with multiple sizes
    const sizes = [16, 32, 48, 64, 128, 256];
    const ico = new IcoWriter();
    
    for (const size of sizes) {
      console.log(`  → Generating ${size}x${size} PNG...`);
      const pngBuffer = await sharp(svgPath)
        .resize(size, size)
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toBuffer();
      
      ico.addImage(pngBuffer, size, size);
    }
    
    console.log('  → Writing ICO file...');
    ico.writeToFile(icoPath);
    
    console.log('');
    console.log('✅ ICO file created successfully!');
    console.log('📁 Location:', icoPath);
    console.log('📏 Sizes included: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256');
    console.log('');
    console.log('🔧 To use in your Electron app:');
    console.log('   Add to your package.json build config:');
    console.log('   "build": {');
    console.log('     "win": {');
    console.log('       "icon": "assets/icon.ico"');
    console.log('     }');
    console.log('   }');
    
  } catch (error) {
    console.error('❌ Error creating ICO file:', error.message);
    console.error(error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  createProperIco();
}

module.exports = createProperIco;