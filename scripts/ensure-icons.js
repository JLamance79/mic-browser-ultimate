#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function ensureIconsScript() {
  const scriptsDir = path.join(__dirname, '..', 'scripts');
  const assetsDir = path.join(__dirname, '..', 'assets');
  
  // Ensure directories exist
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const icoPath = path.join(assetsDir, 'icon.ico');
  const svgPath = path.join(assetsDir, 'icon.svg');
  
  // Check if ICO already exists
  if (fs.existsSync(icoPath)) {
    console.log('✅ Icon already exists:', icoPath);
    return;
  }
  
  // Check if SVG exists, if not create it
  if (!fs.existsSync(svgPath)) {
    console.log('📝 Creating SVG icon template...');
    // SVG will be created by create-icon.js
  }
  
  console.log('🔧 Icons need to be created. Run: npm run create-icons');
}

if (require.main === module) {
  ensureIconsScript();
}

module.exports = ensureIconsScript;