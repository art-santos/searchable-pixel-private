const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const inputDir = path.join(process.cwd(), 'public', 'images');
const outputDir = path.join(process.cwd(), 'public', 'images', 'optimized');

// Background images need different sizes for different screen sizes
const sizes = [
  { suffix: '-mobile', width: 768, quality: 75 },    // Mobile
  { suffix: '-tablet', width: 1024, quality: 80 },   // Tablet
  { suffix: '-desktop', width: 1440, quality: 80 },  // Desktop
  { suffix: '-large', width: 1920, quality: 85 },    // Large screens
  { suffix: '-xl', width: 2560, quality: 85 },       // 4K displays
];

async function optimizeBackgroundImages() {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    const backgroundFiles = ['split-bg.png'];
    
    console.log(`Optimizing background images...`);
    
    for (const file of backgroundFiles) {
      const inputPath = path.join(inputDir, file);
      const baseName = path.parse(file).name;
      
      // Check if file exists
      try {
        await fs.access(inputPath);
      } catch (error) {
        console.log(`⚠️  File not found: ${file}, skipping...`);
        continue;
      }
      
      console.log(`\nOptimizing ${file}...`);
      
      // Get original file size
      const stats = await fs.stat(inputPath);
      const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  Original size: ${originalSizeMB}MB`);
      
      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      console.log(`  Original dimensions: ${metadata.width}x${metadata.height}`);
      
      // Create optimized versions in different sizes
      for (const size of sizes) {
        const outputPath = path.join(outputDir, `${baseName}${size.suffix}.webp`);
        
        await sharp(inputPath)
          .resize(size.width, null, {
            withoutEnlargement: true,
            fastShrinkOnLoad: false
          })
          .webp({ 
            quality: size.quality,
            effort: 6,
            smartSubsample: true 
          })
          .toFile(outputPath);
        
        // Check new file size
        const newStats = await fs.stat(outputPath);
        const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
        const compressionRatio = ((1 - newStats.size / stats.size) * 100).toFixed(1);
        
        console.log(`  ${size.suffix}: ${size.width}px → ${newSizeMB}MB (${compressionRatio}% smaller)`);
      }
      
      // Also create a default optimized version (desktop size)
      const defaultPath = path.join(outputDir, `${baseName}-optimized.webp`);
      await sharp(inputPath)
        .resize(1440, null, {
          withoutEnlargement: true,
          fastShrinkOnLoad: false
        })
        .webp({ 
          quality: 80,
          effort: 6,
          smartSubsample: true 
        })
        .toFile(defaultPath);
      
      const defaultStats = await fs.stat(defaultPath);
      const defaultSizeMB = (defaultStats.size / 1024 / 1024).toFixed(2);
      const defaultRatio = ((1 - defaultStats.size / stats.size) * 100).toFixed(1);
      console.log(`  default: 1440px → ${defaultSizeMB}MB (${defaultRatio}% smaller)`);
    }
    
    console.log('\n✅ Background image optimization complete!');
    console.log('\nNext steps:');
    console.log('1. Update your CSS to use responsive background images');
    console.log('2. Use the OptimizedBackgroundImage component');
    console.log('\nSizes available:');
    sizes.forEach(size => {
      console.log(`  ${size.suffix}: ${size.width}px (${size.quality}% quality)`);
    });
    
  } catch (error) {
    console.error('Error optimizing background images:', error);
  }
}

// Check if sharp is available
try {
  require('sharp');
  optimizeBackgroundImages();
} catch (error) {
  console.error('\n❌ Sharp not found. Make sure it\'s installed:');
  console.log('Run: pnpm add sharp');
  console.log('Then run this script again.');
} 