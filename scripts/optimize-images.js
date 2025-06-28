import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';
import { optimize } from 'svgo';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define directories
const publicDir = join(__dirname, '../public');
const assetsDir = join(__dirname, '../src/assets');

// Process SVG files
async function optimizeSvg(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    const result = optimize(data, {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDimensions',
        {
          name: 'removeViewBox',
          active: false
        },
        {
          name: 'cleanupIDs',
          params: {
            minify: true
          }
        }
      ]
    });
    
    await writeFile(filePath, result.data);
    console.log(`Optimized SVG: ${filePath}`);
  } catch (error) {
    console.error(`Error optimizing SVG ${filePath}:`, error);
  }
}

// Process raster images (JPG, PNG)
async function optimizeRaster(filePath, outputPath = null) {
  try {
    const ext = extname(filePath).toLowerCase();
    const targetPath = outputPath || filePath;
    
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(filePath)
        .jpeg({ quality: 80, progressive: true })
        .toFile(targetPath + '.tmp');
      
      // Rename the temp file to the original
      await renameFile(targetPath + '.tmp', targetPath);
      console.log(`Optimized JPEG: ${filePath}`);
    } else if (ext === '.png') {
      await sharp(filePath)
        .png({ compressionLevel: 9, progressive: true })
        .toFile(targetPath + '.tmp');
      
      // Rename the temp file to the original
      await renameFile(targetPath + '.tmp', targetPath);
      console.log(`Optimized PNG: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error optimizing raster image ${filePath}:`, error);
  }
}

// Helper function to rename files
async function renameFile(oldPath, newPath) {
  try {
    await writeFile(newPath, await readFile(oldPath));
    // Delete the temp file
    await unlink(oldPath);
  } catch (error) {
    console.error(`Error renaming file from ${oldPath} to ${newPath}:`, error);
  }
}

// Process all files in a directory
async function processDirectory(dir) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = join(dir, file.name);
      
      if (file.isDirectory()) {
        await processDirectory(filePath);
      } else {
        const ext = extname(file.name).toLowerCase();
        
        if (ext === '.svg') {
          await optimizeSvg(filePath);
        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          await optimizeRaster(filePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

// Main function
async function main() {
  console.log('Starting image optimization...');
  
  try {
    await processDirectory(publicDir);
    await processDirectory(assetsDir);
    console.log('Image optimization completed successfully!');
  } catch (error) {
    console.error('Error during image optimization:', error);
  }
}

main();