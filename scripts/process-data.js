const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

// Function to read CSV file
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Function to parse filename and extract components
function parseFilename(filename) {
  // Remove .wav extension
  const name = filename.replace('.wav', '');
  
  // Parse the filename pattern: 1-137-A-32
  const parts = name.split('-');
  if (parts.length >= 3) {
    const id = name;
    const classCode = parts[2]; // The letter part
    const target = parts[3]; // The number part
    
    return {
      id,
      class: classCode,
      target: target
    };
  }
  
  return {
    id: name,
    class: 'Unknown',
    target: '0'
  };
}

async function processData() {
  try {
    console.log('🔄 Starting enhanced data processing...');
    
    // Read the Excel file with real ratings
    console.log('📊 Reading Excel file with real ratings...');
    const workbook = XLSX.readFile('audio_vibration/audio1000_ratings.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📈 Loaded ${excelData.length} rows from Excel file`);
    
    // Read the CSV files for enhanced metadata
    console.log('📋 Reading CSV files for enhanced metadata...');
    const audioData = await readCSV('audio_vibration/audio_vibration_audio_20250812_150324.csv');
    const vibrationData = await readCSV('audio_vibration/audio_vibration_vibration_20250812_150324.csv');
    
    console.log(`🎵 Loaded ${audioData.length} audio files and ${vibrationData.length} vibration files from CSV`);
    
    // Create mapping from audio filename to metadata
    const audioMetadataMap = new Map();
    audioData.forEach(audio => {
      const baseName = audio.filename.replace('.wav', '');
      audioMetadataMap.set(baseName, {
        category: audio.category,
        fold: audio.fold,
        target: audio.target,
        clip_id: audio.clip_id,
        take: audio.take
      });
    });
    
    // Create mapping from vibration filename to vibration type
    const vibrationTypeMap = new Map();
    vibrationData.forEach(vib => {
      const baseName = vib.filename.replace('-vib-', '-').split('-vib-')[0];
      if (!vibrationTypeMap.has(baseName)) {
        vibrationTypeMap.set(baseName, []);
      }
      vibrationTypeMap.get(baseName).push({
        type: vib.vibration_type,
        filename: vib.filename
      });
    });
    
    console.log('🔗 Creating merged dataset...');
    
    // Transform the data from wide to long format with enhanced metadata
    const transformedData = [];
    
    excelData.forEach(row => {
      const audioId = row.audio;
      const parsed = parseFilename(audioId);
      
      // Get enhanced metadata from CSV
      const metadata = audioMetadataMap.get(audioId) || {
        category: 'Unknown',
        fold: parsed.class,
        target: parsed.target,
        clip_id: '0',
        take: 'A'
      };
      
      // Get vibration types for this audio file
      const vibrations = vibrationTypeMap.get(audioId) || [
        { type: 'freqshift', filename: `${audioId}-vib-freqshift.wav` },
        { type: 'hapticgen', filename: `${audioId}-vib-hapticgen.wav` },
        { type: 'percept', filename: `${audioId}-vib-percept.wav` },
        { type: 'pitchmatch', filename: `${audioId}-vib-pitchmatch.wav` }
      ];
      
      // Create entries for each vibration design with real ratings
      const designs = [
        { name: 'freqshift', rating: row.rating_freqshift },
        { name: 'hapticgen', rating: row.rating_hapticgen },
        { name: 'percept', rating: row.rating_percept },
        { name: 'pitchmatch', rating: row.rating_pitchmatch }
      ];
      
      designs.forEach(design => {
        // Find corresponding vibration file
        const vibration = vibrations.find(v => v.type === design.name);
        
        transformedData.push({
          id: parsed.id,
          class: parsed.class,
          category: metadata.category,
          design: design.name,
          rating: design.rating,
          audioFile: `${audioId}.wav`,
          vibrationFile: vibration ? vibration.filename : `${audioId}-vib-${design.name}.wav`,
          target: metadata.target,
          fold: metadata.fold,
          clip_id: metadata.clip_id,
          take: metadata.take,
          // Additional derived fields
          ratingCategory: design.rating >= 80 ? 'Excellent' : 
                         design.rating >= 60 ? 'Good' : 
                         design.rating >= 40 ? 'Fair' : 
                         design.rating >= 20 ? 'Poor' : 'Very Poor'
        });
      });
    });
    
    console.log(`📊 Created ${transformedData.length} enhanced rating entries`);
    
    // Create output directory
    const outputDir = 'public/data';
    fs.ensureDirSync(outputDir);
    
    // Write the transformed data
    const outputPath = path.join(outputDir, 'ratings.json');
    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
    
    // Also create a CSV for debugging
    const csvPath = path.join(outputDir, 'ratings.csv');
    const csvContent = [
      'id,class,category,design,rating,audioFile,vibrationFile,target,fold,clip_id,take,ratingCategory',
      ...transformedData.map(row => 
        `${row.id},${row.class},${row.category},${row.design},${row.rating},${row.audioFile},${row.vibrationFile},${row.target},${row.fold},${row.clip_id},${row.take},${row.ratingCategory}`
      )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    
    // Generate comprehensive summary statistics
    const summary = {
      totalEntries: transformedData.length,
      uniqueAudioFiles: new Set(transformedData.map(d => d.id)).size,
      uniqueClasses: new Set(transformedData.map(d => d.class)).size,
      uniqueCategories: new Set(transformedData.map(d => d.category)).size,
      uniqueTargets: new Set(transformedData.map(d => d.target)).size,
      uniqueFolds: new Set(transformedData.map(d => d.fold)).size,
      categories: Object.fromEntries(
        Object.entries(
          transformedData.reduce((acc, d) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
          }, {})
        )
      ),
      designs: [...new Set(transformedData.map(d => d.design))],
      ratingCategories: Object.fromEntries(
        Object.entries(
          transformedData.reduce((acc, d) => {
            acc[d.ratingCategory] = (acc[d.ratingCategory] || 0) + 1;
            return acc;
          }, {})
        )
      ),
      averageRatings: {},
      categoryAverages: {},
      designAverages: {},
      foldDistribution: {},
      targetDistribution: {},
      classDistribution: {}
    };
    
    // Calculate average ratings per design
    summary.designs.forEach(design => {
      const designRatings = transformedData.filter(d => d.design === design).map(d => d.rating);
      const avg = designRatings.reduce((sum, rating) => sum + rating, 0) / designRatings.length;
      summary.designAverages[design] = Math.round(avg * 100) / 100;
    });
    
    // Calculate average ratings per category
    const categories = [...new Set(transformedData.map(d => d.category))];
    categories.forEach(category => {
      const categoryRatings = transformedData.filter(d => d.category === category).map(d => d.rating);
      const avg = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
      summary.categoryAverages[category] = Math.round(avg * 100) / 100;
    });
    
    // Calculate distributions
    transformedData.forEach(d => {
      summary.foldDistribution[d.fold] = (summary.foldDistribution[d.fold] || 0) + 1;
      summary.targetDistribution[d.target] = (summary.targetDistribution[d.target] || 0) + 1;
      summary.classDistribution[d.class] = (summary.classDistribution[d.class] || 0) + 1;
    });
    
    // Overall average ratings
    const allRatings = transformedData.map(d => d.rating);
    summary.averageRatings = {
      overall: Math.round((allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 100) / 100,
      byDesign: summary.designAverages,
      byCategory: summary.categoryAverages
    };
    
    // Write summary
    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate additional metadata
    const metadata = {
      datasetInfo: {
        name: 'Audio-Vibration Rating Dataset',
        description: 'Enhanced dataset containing audio files with real ratings and comprehensive metadata',
        audioFiles: audioData.length,
        vibrationFiles: vibrationData.length,
        totalRatings: transformedData.length,
        dateProcessed: new Date().toISOString(),
        dataSource: 'Excel ratings + CSV metadata'
      },
      fileStructure: {
        audioPath: 'audio_vibration/audio/',
        vibrationPath: 'audio_vibration/vibration/',
        audioFormat: '.wav',
        vibrationTypes: [...new Set(vibrationData.map(d => d.vibration_type))]
      },
      categories: categories.map(cat => ({
        name: cat,
        count: transformedData.filter(d => d.category === cat).length,
        averageRating: summary.categoryAverages[cat]
      })),
      ratingAnalysis: {
        minRating: Math.min(...allRatings),
        maxRating: Math.max(...allRatings),
        medianRating: d3.median(allRatings),
        stdDeviation: Math.sqrt(d3.variance(allRatings)),
        ratingRanges: {
          '0-20': allRatings.filter(r => r >= 0 && r <= 20).length,
          '21-40': allRatings.filter(r => r > 20 && r <= 40).length,
          '41-60': allRatings.filter(r => r > 40 && r <= 60).length,
          '61-80': allRatings.filter(r => r > 60 && r <= 80).length,
          '81-100': allRatings.filter(r => r > 80 && r <= 100).length
        }
      }
    };
    
    const metadataPath = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Enhanced data processing completed!');
    console.log(`📊 Processed ${transformedData.length} entries`);
    console.log(`🎵 ${summary.uniqueAudioFiles} unique audio files`);
    console.log(`📁 ${summary.uniqueClasses} unique classes`);
    console.log(`🏷️ ${summary.uniqueCategories} unique categories`);
    console.log(`🎯 ${summary.uniqueTargets} unique targets`);
    console.log(`📂 ${summary.uniqueFolds} unique folds`);
    console.log(`📈 Overall average rating: ${summary.averageRatings.overall}`);
    console.log(`📊 Rating range: ${metadata.ratingAnalysis.minRating} - ${metadata.ratingAnalysis.maxRating}`);
    console.log(`📂 Output files:`);
    console.log(`   - ${outputPath}`);
    console.log(`   - ${csvPath}`);
    console.log(`   - ${summaryPath}`);
    console.log(`   - ${metadataPath}`);
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
    process.exit(1);
  }
}

// Helper function for d3-like operations
const d3 = {
  median: (arr) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },
  variance: (arr) => {
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }
};

// Run the processing
processData(); 