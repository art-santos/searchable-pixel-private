const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const inputDir = path.join(process.cwd(), 'public', 'blog');
const outputDir = path.join(process.cwd(), 'public', 'blog', 'optimized');

const sizes = [
  { suffix: '-sm', width: 400, quality: 80 },   // Small cards
  { suffix: '-md', width: 800, quality: 85 },   // Medium displays  
  { suffix: '-lg', width: 1200, quality: 85 },  // Large displays
  { suffix: '-xl', width: 1600, quality: 90 },  // Hero images
];

async function optimizeImages() {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    // Get all PNG files in the blog directory
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(file => file.endsWith('.png') && file.startsWith('article-cover-'));
    
    console.log(`Found ${imageFiles.length} images to optimize...`);
    
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const baseName = path.parse(file).name;
      
      console.log(`\nOptimizing ${file}...`);
      
      // Get original file size
      const stats = await fs.stat(inputPath);
      const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  Original size: ${originalSizeMB}MB`);
      
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
    }
    
    console.log('\n✅ Image optimization complete!');
    console.log('\nNext steps:');
    console.log('1. Update your blog posts to use the optimized images:');
    console.log('   Instead of: /blog/article-cover-1.png');
    console.log('   Use: /blog/optimized/article-cover-1-md.webp');
    console.log('2. Consider implementing responsive images with srcSet');
    
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

// Check if sharp is available
try {
  require('sharp');
  optimizeImages();
} catch (error) {
  console.error('\n❌ Sharp not found. Installing...');
  console.log('Run: pnpm add sharp');
  console.log('Then run this script again.');
} 