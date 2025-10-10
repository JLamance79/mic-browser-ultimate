const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createIcoFromSvg() {
  try {
    const assetsDir = path.join(__dirname, 'assets');
    const svgPath = path.join(assetsDir, 'icon.svg');
    const icoPath = path.join(assetsDir, 'icon.ico');
    
    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Check if SVG exists
    if (!fs.existsSync(svgPath)) {
      console.error('SVG file not found at:', svgPath);
      return;
    }
    
    console.log('Converting SVG to ICO...');
    
    // Convert SVG to PNG at 256x256, then to ICO
    const pngBuffer = await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toBuffer();
    
    // Create multiple sizes for ICO (16, 32, 48, 64, 128, 256)
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      sizes.map(size => 
        sharp(svgPath)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );
    
    // For now, we'll save the 256x256 PNG
    // Note: To create a proper ICO file, you'd need a specialized library
    // This creates a PNG that can be renamed to ICO for basic compatibility
    await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toFile(path.join(assetsDir, 'icon-256.png'));
    
    console.log('✅ Icon created successfully!');
    console.log('📁 Location:', assetsDir);
    console.log('🖼️  Files created:');
    console.log('   - icon.svg (source)');
    console.log('   - icon-256.png (256x256 PNG)');
    console.log('');
    console.log('📝 To create a proper ICO file:');
    console.log('   1. Use an online converter like convertio.co or cloudconvert.com');
    console.log('   2. Upload the icon-256.png file');
    console.log('   3. Convert to ICO format');
    console.log('   4. Download and save as assets/icon.ico');
    
  } catch (error) {
    console.error('❌ Error creating icon:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createIcoFromSvg();
}

module.exports = createIcoFromSvg;