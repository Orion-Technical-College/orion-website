#!/usr/bin/env node

/**
 * Generate PWA icons from SVG source
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requires: sharp (npm install sharp --save-dev)
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  // Try to load sharp
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('Sharp not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = require('sharp');
  }

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const svgPath = path.join(__dirname, '../public/icons/icon.svg');
  const outputDir = path.join(__dirname, '../public/icons');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('Error: icon.svg not found at', svgPath);
    process.exit(1);
  }

  console.log('Generating PWA icons from SVG...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
