import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

interface AlgorithmPerformanceSunburstProps {
  onDetailView?: (data: DetailViewData) => void;
  selectedAlgorithm?: string;
}

export interface DetailViewData {
  algorithm: string;
  category: string;
  subcategory: string;
  audioFiles: AudioFileDetail[];
  statistics: {
    average: number;
    min: number;
    max: number;
    count: number;
  };
}

export interface AudioFileDetail {
  filename: string;
  soundname: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  average: number;
  bestRating: number;
}

interface AlgorithmData {
  overall: number;
  categories: Record<string, number>;
  subcategories: Record<string, number>;
}

interface PerformanceData {
  freqshift: AlgorithmData;
  hapticgen: AlgorithmData;
  percept: AlgorithmData;
  pitchmatch: AlgorithmData;
}

interface SoundData {
  filename: string;
  soundname: string;
  target: number;
  category: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  bestAlgorithm: string;
  bestRating: number;
}

type NavigationLevel = 'level1' | 'level2' | 'level3' | 'level4';

const AlgorithmPerformanceSunburst: React.FC<AlgorithmPerformanceSunburstProps> = ({ onDetailView, selectedAlgorithm: externalSelectedAlgorithm }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('level1');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundData, setSoundData] = useState<SoundData[]>([]);

  // Update selected algorithm when external prop changes
  useEffect(() => {
    if (externalSelectedAlgorithm && externalSelectedAlgorithm !== selectedAlgorithm) {
      setSelectedAlgorithm(externalSelectedAlgorithm);
      setCurrentLevel('level2'); // Navigate to level 2 to show the selected algorithm
    }
  }, [externalSelectedAlgorithm, selectedAlgorithm]);

  // ESC-50 Category mapping
  const getCategoryForClass = (classNum: number): string => {
    if (classNum >= 0 && classNum <= 9) return 'Animals';
    if (classNum >= 10 && classNum <= 19) return 'Natural\nSoundscapes';
    if (classNum >= 20 && classNum <= 29) return 'Human\nNon-Speech';
    if (classNum >= 30 && classNum <= 39) return 'Interior\nDomestic';
    if (classNum >= 40 && classNum <= 49) return 'Exterior\nUrban';
    return 'Unknown';
  };

  // ESC-50 specific category names mapping
  const getSpecificCategoryName = (classNum: number): string => {
    const categoryNames = [
      'dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow', // 0-9
      'rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm', // 10-19
      'crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping', // 20-29
      'door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking', // 30-39
      'helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw' // 40-49
    ];
    return categoryNames[classNum] || 'Unknown';
  };



  // Calculate algorithm performance from CSV data
  const calculateAlgorithmPerformance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/audio_vibration_audio_20250812_150324_backup_20250826_111121.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header
      
      const performance: PerformanceData = {
        freqshift: { overall: 0, categories: {}, subcategories: {} },
        hapticgen: { overall: 0, categories: {}, subcategories: {} },
        percept: { overall: 0, categories: {}, subcategories: {} },
        pitchmatch: { overall: 0, categories: {}, subcategories: {} }
      };

      let totalSounds = 0;
      const categoryCounts: Record<string, number> = {};
      const subcategoryCounts: Record<string, number> = {};
      const allSoundData: SoundData[] = [];

      lines.forEach(line => {
        if (!line.trim()) return;
        
        const columns = line.split(',');
        if (columns.length < 15) return;

        const filename = columns[0];
        const soundname = columns[1];
        const target = parseInt(columns[3]);
        const category = getCategoryForClass(target);
        const subcategory = getSpecificCategoryName(target);
        const freqshift = parseFloat(columns[9]);
        const hapticgen = parseFloat(columns[10]);
        const percept = parseFloat(columns[11]);
        const pitchmatch = parseFloat(columns[12]);
        const bestAlgorithm = columns[13];
        const bestRating = parseFloat(columns[15]);

        // Store sound data
        allSoundData.push({
          filename,
          soundname,
          target,
          category,
          ratings: { freqshift, hapticgen, percept, pitchmatch },
          bestAlgorithm,
          bestRating
        });

        // Find winning algorithms (including ties)
        const ratings = [freqshift, hapticgen, percept, pitchmatch];
        const maxRating = Math.max(...ratings);
        const winners = [];
        
        if (freqshift === maxRating) winners.push('freqshift');
        if (hapticgen === maxRating) winners.push('hapticgen');
        if (percept === maxRating) winners.push('percept');
        if (pitchmatch === maxRating) winners.push('pitchmatch');

        // Count wins for each winner
        winners.forEach(winner => {
          performance[winner as keyof PerformanceData].overall++;
          
          // Category wins
          if (!performance[winner as keyof PerformanceData].categories[category]) {
            performance[winner as keyof PerformanceData].categories[category] = 0;
          }
          performance[winner as keyof PerformanceData].categories[category]++;
          
          // Subcategory wins
          if (!performance[winner as keyof PerformanceData].subcategories[subcategory]) {
            performance[winner as keyof PerformanceData].subcategories[subcategory] = 0;
          }
          performance[winner as keyof PerformanceData].subcategories[subcategory]++;
        });

        totalSounds++;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        subcategoryCounts[subcategory] = (subcategoryCounts[subcategory] || 0) + 1;
      });

      // Convert to percentages
      Object.keys(performance).forEach(algorithm => {
        performance[algorithm as keyof PerformanceData].overall = 
          (performance[algorithm as keyof PerformanceData].overall / totalSounds) * 100;
        
        Object.keys(performance[algorithm as keyof PerformanceData].categories).forEach(category => {
          performance[algorithm as keyof PerformanceData].categories[category] = 
            (performance[algorithm as keyof PerformanceData].categories[category] / categoryCounts[category]) * 100;
        });
        
        Object.keys(performance[algorithm as keyof PerformanceData].subcategories).forEach(subcategory => {
          performance[algorithm as keyof PerformanceData].subcategories[subcategory] = 
            (performance[algorithm as keyof PerformanceData].subcategories[subcategory] / subcategoryCounts[subcategory]) * 100;
        });
      });

      setPerformanceData(performance);
      setSoundData(allSoundData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating algorithm performance:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    calculateAlgorithmPerformance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate chart data based on current level
  useEffect(() => {
    if (!performanceData) return;

    let data: any[] = [];

    if (currentLevel === 'level1') {
      // Level 1: All algorithms only (no children to avoid overlapping)
      data = [
        {
          name: "Frequency Shift",
          value: performanceData.freqshift.overall,
          itemStyle: { color: "#dc2626" },
          algorithm: 'freqshift'
        },
        {
          name: "HapticGen",
          value: performanceData.hapticgen.overall,
          itemStyle: { color: "#22c55e" },
          algorithm: 'hapticgen'
        },
        {
          name: "Percept",
          value: performanceData.percept.overall,
          itemStyle: { color: "#3b82f6" },
          algorithm: 'percept'
        },
        {
          name: "PitchMatch",
          value: performanceData.pitchmatch.overall,
          itemStyle: { color: "#8b5cf6" },
          algorithm: 'pitchmatch'
        }
      ];
    } else if (currentLevel === 'level2') {
      // Level 2: Selected algorithm in center + categories only
      const algorithmData = performanceData[selectedAlgorithm as keyof PerformanceData];
      const categories = ['Animals', 'Natural\nSoundscapes', 'Human\nNon-Speech', 'Interior\nDomestic', 'Exterior\nUrban'];
      
      const categoryData = categories.map(category => ({
        name: category,
        value: algorithmData.categories[category] || 0,
        itemStyle: { color: getCategoryColor(category) }
      }));

      data = [
        {
          name: selectedAlgorithm === 'freqshift' ? 'FreqShift' : 
                selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
                selectedAlgorithm === 'percept' ? 'Percept' : 'PitchMatch',
          itemStyle: { color: getAlgorithmColor(selectedAlgorithm) },
          isCenter: true,
          children: categoryData
        }
      ];
    } else if (currentLevel === 'level3') {
      // Level 3: Selected category in center + sounds for that algorithm
      const categoryRanges = {
        'Animals': [0, 9],
        'Natural\nSoundscapes': [10, 19],
        'Human\nNon-Speech': [20, 29],
        'Interior\nDomestic': [30, 39],
        'Exterior\nUrban': [40, 49]
      };
      
      const range = categoryRanges[selectedCategory as keyof typeof categoryRanges];
      if (range) {
        // Get all sounds for this category and algorithm
        const soundsData = [];
        
        // Group sounds by subcategory
        for (let i = range[0]; i <= range[1]; i++) {
          const subcategoryName = getSpecificCategoryName(i);
          const categorySounds = soundData.filter(sound => 
            sound.target === i && getCategoryForClass(sound.target) === selectedCategory
          );
          
          if (categorySounds.length > 0) {
            // Calculate how many times this algorithm wins for this subcategory
            const wins = categorySounds.filter(sound => {
              const algorithmRating = sound.ratings[selectedAlgorithm as keyof typeof sound.ratings];
              const maxRating = Math.max(
                sound.ratings.freqshift,
                sound.ratings.hapticgen,
                sound.ratings.percept,
                sound.ratings.pitchmatch
              );
              return algorithmRating === maxRating;
            }).length;
            
            const winPercentage = (wins / categorySounds.length) * 100;
            
            if (winPercentage > 0) {
              soundsData.push({
                name: subcategoryName,
                value: winPercentage,
                itemStyle: { color: getSubcategoryColor(selectedCategory) },
                classNum: i,
                isSubcategory: true,
                soundCount: categorySounds.length,
                winCount: wins
              });
            }
          }
        }

        data = [
          {
            name: selectedCategory,
            itemStyle: { color: getCategoryColor(selectedCategory) },
            isCenter: true,
            children: soundsData
          }
        ];
      }
    } else if (currentLevel === 'level4') {
      // Level 4: Selected subcategory in center + individual winning sounds
      const categoryRanges = {
        'Animals': [0, 9],
        'Natural\nSoundscapes': [10, 19],
        'Human\nNon-Speech': [20, 29],
        'Interior\nDomestic': [30, 39],
        'Exterior\nUrban': [40, 49]
      };
      
      const range = categoryRanges[selectedCategory as keyof typeof categoryRanges];
      if (range) {
        // Find the class number for the selected subcategory by searching through the range
        let classNum = -1;
        for (let i = range[0]; i <= range[1]; i++) {
          if (getSpecificCategoryName(i) === selectedSubcategory) {
            classNum = i;
            break;
          }
        }
        
                 if (classNum >= 0) {
           // Get all sounds for this specific subcategory
           const subcategorySounds = soundData.filter(sound => 
             sound.target === classNum
           );
          
          // Get sounds where this algorithm wins
          const winningSounds = subcategorySounds.filter(sound => {
            const algorithmRating = sound.ratings[selectedAlgorithm as keyof typeof sound.ratings];
            const maxRating = Math.max(
              sound.ratings.freqshift,
              sound.ratings.hapticgen,
              sound.ratings.percept,
              sound.ratings.pitchmatch
            );
            return algorithmRating === maxRating;
          });
          
          const individualSoundsData = winningSounds.map(sound => ({
            name: sound.soundname,
            value: sound.ratings[selectedAlgorithm as keyof typeof sound.ratings],
            itemStyle: { color: getSubcategoryColor(selectedCategory) },
            filename: sound.filename,
            rating: sound.ratings[selectedAlgorithm as keyof typeof sound.ratings],
            isIndividualSound: true
          }));

          data = [
            {
              name: selectedSubcategory,
              itemStyle: { color: getSubcategoryColor(selectedCategory) },
              isCenter: true,
              children: individualSoundsData
            }
          ];
         }
       }
    }

    setChartData(data);
  }, [performanceData, currentLevel, selectedAlgorithm, selectedCategory, selectedSubcategory, soundData]);

  // Color functions
  const getAlgorithmColor = (algorithm: string): string => {
    const colors: Record<string, string> = {
      'freqshift': '#dc2626', // Red
      'hapticgen': '#22c55e', // Light green
      'percept': '#3b82f6',   // Blue
      'pitchmatch': '#8b5cf6' // Purple
    };
    return colors[algorithm] || '#6b7280';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Animals': '#166534',
      'Natural\nSoundscapes': '#1d4ed8',
      'Human\nNon-Speech': '#7e22ce',
      'Interior\nDomestic': '#b91c1c',
      'Exterior\nUrban': '#d97706'
    };
    return colors[category] || '#6b7280';
  };

  const getSubcategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Animals': '#22c55e',
      'Natural\nSoundscapes': '#3b82f6',
      'Human\nNon-Speech': '#a855f7',
      'Interior\nDomestic': '#ef4444',
      'Exterior\nUrban': '#fbbf24'
    };
    return colors[category] || '#9ca3af';
  };

  // Handle chart click events
  const handleChartClick = (params: any) => {
    if (currentLevel === 'level1') {
      if (params.data && params.data.algorithm) {
        // Clicked on algorithm - go to level 2
        setSelectedAlgorithm(params.data.algorithm);
        setCurrentLevel('level2');
      } else if (params.data && params.data.name && !params.data.algorithm) {
        // Clicked on category - go to level 3
        setSelectedCategory(params.data.name);
        setCurrentLevel('level3');
      }
    } else if (currentLevel === 'level2') {
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level1');
        setSelectedAlgorithm('');
      } else if (params.data && params.data.name) {
        setSelectedCategory(params.data.name);
        setCurrentLevel('level3');
      }
    } else if (currentLevel === 'level3') {
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level2');
        setSelectedCategory('');
      } else if (params.data && params.data.isSubcategory) {
        setSelectedSubcategory(params.data.name);
        setCurrentLevel('level4');
      }
    } else if (currentLevel === 'level4') {
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level3');
        setSelectedSubcategory('');
      }
      // Individual sounds are displayed but not clickable
    }
  };

    // Chart configuration
  const sunburstOption = {
    backgroundColor: "#ffffff",
    tooltip: { 
      trigger: "item", 
      formatter: function(params: any) {
        if (currentLevel === 'level1') {
          if (params.data && params.data.algorithm) {
            return `${params.name}<br/>Overall Win Rate: ${params.value.toFixed(1)}%<br/>Click to explore categories`;
          } else if (params.data && params.data.name && !params.data.algorithm) {
            return `${params.name}<br/>Category Win Rate: ${params.value.toFixed(1)}%<br/>Click to explore sounds`;
          }
        } else if (currentLevel === 'level2') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to algorithms`;
          } else {
            return `${params.name}<br/>Win Rate: ${params.value.toFixed(1)}%<br/>Click to explore sounds`;
          }
        } else if (currentLevel === 'level3') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to categories`;
          } else {
            return `${params.name}<br/>Win Rate: ${params.value.toFixed(1)}%<br/>Wins: ${params.data.winCount}/${params.data.soundCount} sounds<br/>Click to see individual sounds`;
          }
        } else if (currentLevel === 'level4') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to subcategories`;
          } else {
            return `${params.name}<br/>Rating: ${params.value.toFixed(1)}<br/>Algorithm: ${selectedAlgorithm === 'freqshift' ? 'FreqShift' : 
              selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
              selectedAlgorithm === 'percept' ? 'Percept' : 'PitchMatch'}`;
          }
        }

        return `${params.name}`;
      }
    },
    series: [
      {
        type: "sunburst",
        radius: [0, "90%"],
        sort: null,
        minAngle: 0.5,
        nodeClick: false,
        emphasis: { focus: "ancestor" },
        colorMappingBy: 'id',
        levels: currentLevel === 'level1' ? [
          {
            r: "90%",
            label: { 
              show: true,
              color: "#000000", 
              fontSize: 12, 
              fontWeight: "bold",
              position: "inside"
            },
            emphasis: {
              label: {
                show: true
              }
            }
          }
        ] : [
          {
            r: "20%",
            label: { 
              show: true,
              color: "#000000", 
              fontSize: 12, 
              fontWeight: "bold",
              position: "inside"
            },
            emphasis: {
              label: {
                show: true
              }
            }
          }, 
          {
            r0: "25%",
            r: "50%",
            label: { 
              show: true,
              color: "#000000", 
              fontSize: 8, 
              fontWeight: "bold",
              formatter: function(params: any) {
                // Handle long names by breaking them into 2 lines
                const name = params.name;
                if (name.length > 8) {
                  // Find a good break point (space or underscore)
                  const breakPoint = name.indexOf(' ') !== -1 ? name.indexOf(' ') : 
                                   name.indexOf('_') !== -1 ? name.indexOf('_') : 
                                   Math.floor(name.length / 2);
                  return name.substring(0, breakPoint) + '\n' + name.substring(breakPoint + 1);
                }
                return name;
              },
              rotate: 0,
              overflow: 'truncate'
            },
            itemStyle: { 
              borderWidth: 2, 
              borderColor: "#ffffff"
            },
                          emphasis: {
                label: {
                  show: true,
                  fontSize: 10,
                  formatter: function(params: any) {
                    // Handle long names by breaking them into 2 lines
                    const name = params.name;
                    if (name.length > 8) {
                      // Find a good break point (space or underscore)
                      const breakPoint = name.indexOf(' ') !== -1 ? name.indexOf(' ') : 
                                       name.indexOf('_') !== -1 ? name.indexOf('_') : 
                                       Math.floor(name.length / 2);
                      return name.substring(0, breakPoint) + '\n' + name.substring(breakPoint + 1);
                    }
                    return name;
                  }
                }
              }
          },
          {
            r0: "55%",
            r: "90%",
            label: { 
              show: true,
              color: "#000000", 
              fontSize: 10, 
              fontWeight: "bold",
              formatter: function(params: any) {
                // Handle long names by breaking them into 2 lines
                const name = params.name;
                if (name.length > 8) {
                  // Find a good break point (space or underscore)
                  const breakPoint = name.indexOf(' ') !== -1 ? name.indexOf(' ') : 
                                   name.indexOf('_') !== -1 ? name.indexOf('_') : 
                                   Math.floor(name.length / 2);
                  return name.substring(0, breakPoint) + '\n' + name.substring(breakPoint + 1);
                }
                return name;
              }
            },
            itemStyle: { borderWidth: 2, borderColor: "#ffffff" },
            emphasis: {
              label: {
                show: true
              }
            }
          }
        ],
        data: chartData
      }
    ]
  };

  return (
    <div className="algorithm-performance-sunburst">
      <div style={{ 
        width: '100%', 
        height: 500, 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        backgroundColor: '#fff' 
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '15px', 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#333' 
        }}>
          {currentLevel === 'level1' && '🏆 Algorithm Performance Overview'}
          {currentLevel === 'level2' && `📊 ${selectedAlgorithm === 'freqshift' ? 'FreqShift' : 
            selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
            selectedAlgorithm === 'percept' ? 'Percept' : 'PitchMatch'} by Category`}
          {currentLevel === 'level3' && `🎵 ${selectedCategory} Sounds`}
          {currentLevel === 'level4' && `🎵 ${selectedSubcategory} Individual Sounds`}
        </h3>
        
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            color: '#666',
            fontSize: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>🔄 Loading algorithm performance data...</div>
              <div style={{ fontSize: '14px', color: '#999' }}>Calculating winning percentages...</div>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            color: '#dc2626',
            fontSize: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '10px' }}>❌ Error loading data</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <ReactECharts 
            option={sunburstOption} 
            style={{ height: '400px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            onEvents={{
              click: handleChartClick
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AlgorithmPerformanceSunburst;
