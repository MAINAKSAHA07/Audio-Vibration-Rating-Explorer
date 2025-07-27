const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

async function generateVisualizationStructure() {
  console.log('🎵 Generating visualization structure...');
  
  // Create output directory
  const outputDir = path.join(__dirname, '../public/data/visualizations');
  await fs.ensureDir(outputDir);
  
  // Get all audio files
  const audioFiles = glob.sync('audio_vibration/audio/*.wav');
  console.log(`Found ${audioFiles.length} audio files`);
  
  // Get all vibration files
  const vibrationFiles = glob.sync('audio_vibration/vibration/*.wav');
  console.log(`Found ${vibrationFiles.length} vibration files`);
  
  // Create structure for audio files
  const audioStructure = {};
  for (const audioFile of audioFiles) {
    const fileName = path.basename(audioFile, '.wav');
    audioStructure[fileName] = {
      type: 'audio',
      file: audioFile,
      url: `/audio/${fileName}.wav`
    };
  }
  
  // Create structure for vibration files
  const vibrationStructure = {};
  for (const vibrationFile of vibrationFiles) {
    const fileName = path.basename(vibrationFile, '.wav');
    vibrationStructure[fileName] = {
      type: 'vibration',
      file: vibrationFile,
      url: `/vibration/${fileName}.wav`
    };
  }
  
  // Create combined structure
  const visualizationStructure = {
    audio: audioStructure,
    vibration: vibrationStructure,
    summary: {
      audioFiles: audioFiles.length,
      vibrationFiles: vibrationFiles.length,
      totalFiles: audioFiles.length + vibrationFiles.length,
      generatedAt: new Date().toISOString()
    }
  };
  
  // Save structure
  const outputFile = path.join(outputDir, 'visualization-structure.json');
  await fs.writeJson(outputFile, visualizationStructure, { spaces: 2 });
  
  console.log(`✅ Generated structure for ${Object.keys(visualizationStructure.audio).length} audio files and ${Object.keys(visualizationStructure.vibration).length} vibration files`);
  console.log(`📁 Saved to: ${outputFile}`);
  
  // Also create a simple mapping for the frontend
  const fileMapping = {
    audioFiles: Object.keys(audioStructure),
    vibrationFiles: Object.keys(vibrationStructure)
  };
  
  const mappingFile = path.join(outputDir, 'file-mapping.json');
  await fs.writeJson(mappingFile, fileMapping, { spaces: 2 });
  
  console.log(`📋 File mapping saved to: ${mappingFile}`);
}

// Run the generation
generateVisualizationStructure().catch(console.error); 