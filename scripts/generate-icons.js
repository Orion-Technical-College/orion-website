#!/usr/bin/env node

/**
 * PWA Icon Generator
 * 
 * This script generates PWA icons from the source SVG.
 * Run: node scripts/generate-icons.js
 * 
 * Requirements: 
 * - npm install sharp
 * 
 * Or manually create icons using an online tool like:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('PWA Icon Generation');
console.log('==================');
console.log('');
console.log('To generate icons from the SVG source, you can:');
console.log('');
console.log('1. Install sharp and run this script:');
console.log('   npm install sharp');
console.log('   node scripts/generate-icons.js');
console.log('');
console.log('2. Use an online tool:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('');
console.log('Required icon sizes:', sizes.join(', '));
console.log('');
console.log('Icon files should be placed in: public/icons/');
console.log('');

// Try to use sharp if available
try {
  const sharp = require('sharp');
  
  const svgPath = path.join(iconsDir, 'icon.svg');
  
  if (!fs.existsSync(svgPath)) {
    console.log('SVG source not found at:', svgPath);
    process.exit(1);
  }
  
  console.log('Generating icons...');
  
  sizes.forEach(async (size) => {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated: icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, err.message);
    }
  });
  
} catch (err) {
  console.log('Sharp not installed. Creating placeholder notice...');
  console.log('');
  console.log('For development, you can use the SVG directly or generate PNGs using the tools above.');
}

