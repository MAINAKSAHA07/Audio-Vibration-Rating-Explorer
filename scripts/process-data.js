const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');

// Class to category mapping (you may need to adjust this based on your data)
const classToCategory = {
  'A': 'Human Speech',
  'B': 'Music',
  'C': 'Nature Sounds',
  'D': 'Machinery',
  'E': 'Household',
  'F': 'Transportation',
  'G': 'Alarms',
  'H': 'Electronics',
  'I': 'Sports',
  'J': 'Animals',
  // Add more mappings as needed based on your data
};

// Default category for unknown classes
const DEFAULT_CATEGORY = 'Other';

function parseFilename(filename) {
  // Remove .wav extension
  const name = filename.replace('.wav', '');
  
  // Parse the filename pattern: 1-137-A-32
  const parts = name.split('-');
  if (parts.length >= 3) {
    const id = name;
    const classCode = parts[2]; // The letter part
    const category = classToCategory[classCode] || DEFAULT_CATEGORY;
    
    return {
      id,
      class: classCode,
      category
    };
  }
  
  return {
    id: name,
    class: 'Unknown',
    category: DEFAULT_CATEGORY
  };
}

function processData() {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile('audio1000_ratings.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Processing ${data.length} rows of data...`);
    
    // Transform the data from wide to long format
    const transformedData = [];
    
    data.forEach(row => {
      const audioId = row.audio;
      const parsed = parseFilename(audioId);
      
      // Create entries for each vibration design
      const designs = [
        { name: 'freqshift', rating: row.rating_freqshift },
        { name: 'hapticgen', rating: row.rating_hapticgen },
        { name: 'percept', rating: row.rating_percept },
        { name: 'pitchmatch', rating: row.rating_pitchmatch }
      ];
      
      designs.forEach(design => {
        transformedData.push({
          id: parsed.id,
          class: parsed.class,
          category: parsed.category,
          design: design.name,
          rating: design.rating,
          audioFile: `${audioId}.wav`,
          vibrationFile: `${audioId}-vib-${design.name}.wav`
        });
      });
    });
    
    // Create output directory
    const outputDir = 'public/data';
    fs.ensureDirSync(outputDir);
    
    // Write the transformed data
    const outputPath = path.join(outputDir, 'ratings.json');
    fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2));
    
    // Also create a CSV for debugging
    const csvPath = path.join(outputDir, 'ratings.csv');
    const csvContent = [
      'id,class,category,design,rating,audioFile,vibrationFile',
      ...transformedData.map(row => 
        `${row.id},${row.class},${row.category},${row.design},${row.rating},${row.audioFile},${row.vibrationFile}`
      )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    
    // Generate summary statistics
    const summary = {
      totalEntries: transformedData.length,
      uniqueAudioFiles: new Set(transformedData.map(d => d.id)).size,
      uniqueClasses: new Set(transformedData.map(d => d.class)).size,
      categories: Object.fromEntries(
        Object.entries(
          transformedData.reduce((acc, d) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
          }, {})
        )
      ),
      designs: ['freqshift', 'hapticgen', 'percept', 'pitchmatch'],
      averageRatings: {}
    };
    
    // Calculate average ratings per design
    summary.designs.forEach(design => {
      const designRatings = transformedData.filter(d => d.design === design).map(d => d.rating);
      const avg = designRatings.reduce((sum, rating) => sum + rating, 0) / designRatings.length;
      summary.averageRatings[design] = Math.round(avg * 100) / 100;
    });
    
    // Write summary
    const summaryPath = path.join(outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('✅ Data processing completed!');
    console.log(`📊 Processed ${transformedData.length} entries`);
    console.log(`🎵 ${summary.uniqueAudioFiles} unique audio files`);
    console.log(`📁 ${summary.uniqueClasses} unique classes`);
    console.log(`📈 Average ratings:`, summary.averageRatings);
    console.log(`📂 Output files:`);
    console.log(`   - ${outputPath}`);
    console.log(`   - ${csvPath}`);
    console.log(`   - ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
    process.exit(1);
  }
}

// Run the processing
processData(); 