import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { RatingData } from '../utils/api';
import colors from '../colors.js';
import SelectionConflictPopup from './SelectionConflictPopup';

interface AlgorithmPerformanceSunburstProps {
  onDetailView?: (data: DetailViewData) => void;
  onSoundSelect?: (sound: SoundData) => void;
  selectedAlgorithm?: string;
  selectedPoint?: {algorithm: string, class: number, category: string, subcategory: string} | null;
  ratings?: RatingData[];
  hoveredMethod?: string | null;
  onAlgorithmSelect?: (algorithm: string) => void;
  onCategorySelect?: (category: string) => void;
  onSubcategorySelect?: (subcategory: string) => void;
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

const AlgorithmPerformanceSunburst: React.FC<AlgorithmPerformanceSunburstProps> = ({ 
  onDetailView, 
  onSoundSelect, 
  selectedAlgorithm: externalSelectedAlgorithm, 
  selectedPoint, 
  ratings, 
  hoveredMethod,
  onAlgorithmSelect,
  onCategorySelect,
  onSubcategorySelect
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('level1');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  
  console.log('🔍 AlgorithmPerformanceSunburst props:', {
    externalSelectedAlgorithm,
    ratingsLength: ratings?.length,
    selectedPoint,
    hoveredMethod,
    currentLevel
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundData, setSoundData] = useState<SoundData[]>([]);

  // Update selected algorithm when external prop changes
  useEffect(() => {
    console.log('🔍 AlgorithmPerformanceSunburst - externalSelectedAlgorithm changed:', {
      externalSelectedAlgorithm,
      selectedAlgorithm,
      currentLevel,
      previousValue: selectedAlgorithm
    });
    
    if (externalSelectedAlgorithm !== selectedAlgorithm) {
      console.log('🔄 Setting selectedAlgorithm to:', externalSelectedAlgorithm);
      setSelectedAlgorithm(externalSelectedAlgorithm || '');
      
      // If algorithm is deselected (empty string), navigate back to level 1
      if (!externalSelectedAlgorithm) {
        console.log('🔄 Algorithm deselected, navigating back to level 1');
        setCurrentLevel('level1');
        setSelectedCategory('');
        setSelectedSubcategory('');
      }
    }
  }, [externalSelectedAlgorithm, selectedAlgorithm]);

  // Handle selected point from line chart
  useEffect(() => {
    if (selectedPoint) {
      // Navigate to the specific algorithm and subcategory
      setSelectedAlgorithm(selectedPoint.algorithm);
      setSelectedCategory(selectedPoint.category);
      setSelectedSubcategory(selectedPoint.subcategory);
      setCurrentLevel('level4'); // Go directly to level 4 (individual sounds)
    } else if (externalSelectedAlgorithm) {
      // If no specific point is selected but algorithm is selected, go to level 2
      setSelectedAlgorithm(externalSelectedAlgorithm);
      setSelectedCategory('');
      setSelectedSubcategory('');
      setCurrentLevel('level2');
    } else if (!externalSelectedAlgorithm) {
      // Only return to initial view if there's no external selection
      setSelectedAlgorithm('');
      setSelectedCategory('');
      setSelectedSubcategory('');
      setCurrentLevel('level1');
    }
  }, [selectedPoint, externalSelectedAlgorithm]);

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



  // Calculate algorithm performance from ratings data
  const calculateAlgorithmPerformance = async () => {
    try {
      // Only show loading if we don't have data yet
      if (!performanceData) {
        setIsLoading(true);
      }
      setError(null);
      
      // Use ratings prop if available, otherwise fetch from CSV
      let dataToProcess: any[] = [];
      
      if (ratings && ratings.length > 0) {
        // Process ratings data directly
        const audioFileGroups = new Map<string, RatingData[]>();
        
        // Group ratings by audio file
        ratings.forEach(rating => {
          if (!audioFileGroups.has(rating.audioFile)) {
            audioFileGroups.set(rating.audioFile, []);
          }
          audioFileGroups.get(rating.audioFile)!.push(rating);
        });
        
        // Convert to the format expected by the processing logic
        dataToProcess = Array.from(audioFileGroups.values()).map(audioRatings => {
          const firstRating = audioRatings[0];
          const freqshift = audioRatings.find(r => r.design === 'freqshift')?.rating || 0;
          const hapticgen = audioRatings.find(r => r.design === 'hapticgen')?.rating || 0;
          const percept = audioRatings.find(r => r.design === 'percept')?.rating || 0;
          const pitchmatch = audioRatings.find(r => r.design === 'pitchmatch')?.rating || 0;
          
          const ratings = [freqshift, hapticgen, percept, pitchmatch];
          const maxRating = Math.max(...ratings);
          const bestAlgorithm = audioRatings.find(r => r.rating === maxRating)?.design || 'freqshift';
          
          return {
            filename: firstRating.audioFile,
            soundname: firstRating.audioFile,
            target: parseInt(firstRating.target),
            category: getCategoryForClass(parseInt(firstRating.target)),
            subcategory: getSpecificCategoryName(parseInt(firstRating.target)),
            freqshift,
            hapticgen,
            percept,
            pitchmatch,
            bestAlgorithm,
            bestRating: maxRating
          };
        });
      } else {
        // Fallback to CSV fetch
        const response = await fetch('/audio_vibration_audio_20250812_150324_backup_20250826_111121.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').slice(1); // Skip header
        
        dataToProcess = lines.map(line => {
          if (!line.trim()) return null;
          
          const columns = line.split(',');
          if (columns.length < 15) return null;

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

          return {
            filename,
            soundname,
            target,
            category,
            subcategory,
            freqshift,
            hapticgen,
            percept,
            pitchmatch,
            bestAlgorithm,
            bestRating
          };
        }).filter(Boolean);
      }
      
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

      dataToProcess.forEach(item => {
        if (!item) return;

        const filename = item.filename;
        const soundname = item.soundname;
        const target = item.target;
        const category = item.category;
        const subcategory = item.subcategory;
        const freqshift = item.freqshift;
        const hapticgen = item.hapticgen;
        const percept = item.percept;
        const pitchmatch = item.pitchmatch;
        const bestAlgorithm = item.bestAlgorithm;
        const bestRating = item.bestRating;

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

      console.log('📊 Performance calculation results:', {
        totalSounds,
        categoryCounts,
        performance: {
          freqshift: {
            overall: performance.freqshift.overall,
            categories: performance.freqshift.categories
          },
          hapticgen: {
            overall: performance.hapticgen.overall,
            categories: performance.hapticgen.categories
          },
          percept: {
            overall: performance.percept.overall,
            categories: performance.percept.categories
          },
          pitchmatch: {
            overall: performance.pitchmatch.overall,
            categories: performance.pitchmatch.categories
          }
        }
      });

      setPerformanceData(performance);
      setSoundData(allSoundData);
      // Only set loading to false if we were actually loading
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error calculating algorithm performance:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      // Only set loading to false if we were actually loading
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    calculateAlgorithmPerformance();
  }, [ratings]); // Recalculate when ratings change

  // Determine which algorithms to show based on available ratings and selected algorithm
  const availableAlgorithms = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
  const algorithmsToShow = useMemo(() => {
    console.log('🔍 Calculating algorithmsToShow:', {
      ratingsLength: ratings?.length,
      selectedAlgorithm,
      availableAlgorithms
    });
    
    if (!ratings || ratings.length === 0) {
      console.log('📊 No ratings, showing all algorithms');
      return availableAlgorithms; // Show all if no ratings prop (using CSV data)
    }
    
    // If an algorithm is selected (from FilterPanel), show only that algorithm
    if (selectedAlgorithm) {
      console.log('🎯 Algorithm selected, showing only:', selectedAlgorithm);
      return [selectedAlgorithm];
    }
    
    // Otherwise, show all available algorithms
    const filtered = availableAlgorithms.filter(alg => 
      ratings.some(r => r.design === alg)
    );
    console.log('📊 No algorithm selected, showing all available:', filtered);
    return filtered;
  }, [ratings, selectedAlgorithm]);


  // Generate chart data based on current level
  useEffect(() => {
    if (!performanceData) return;

    console.log('🔄 Generating chart data:', {
      currentLevel,
      selectedAlgorithm,
      selectedCategory,
      selectedSubcategory,
      externalSelectedAlgorithm,
      algorithmsToShow,
      performanceDataKeys: performanceData ? Object.keys(performanceData) : []
    });

    let data: any[] = [];

    if (currentLevel === 'level1') {
      // Level 1: Hierarchical view with algorithms in inner ring and categories in outer ring
      const categories = ['Animals', 'Natural\nSoundscapes', 'Human\nNon-Speech', 'Interior\nDomestic', 'Exterior\nUrban'];
      
      // Calculate total wins for each algorithm to normalize category values
      const algorithmTotals = {
        freqshift: Object.values(performanceData.freqshift.categories).reduce((sum, val) => sum + val, 0),
        hapticgen: Object.values(performanceData.hapticgen.categories).reduce((sum, val) => sum + val, 0),
        percept: Object.values(performanceData.percept.categories).reduce((sum, val) => sum + val, 0),
        pitchmatch: Object.values(performanceData.pitchmatch.categories).reduce((sum, val) => sum + val, 0)
      };
      
      // Helper function to get algorithm color with highlighting
      const getAlgorithmColorWithHighlight = (algorithm: string): string => {
        const baseColor = getAlgorithmColor(algorithm);
        if (externalSelectedAlgorithm === algorithm) {
          // Add a subtle glow effect by making it slightly brighter
          return baseColor;
        }
        return baseColor;
      };

      // Helper function to get algorithm item style with hover highlighting
      const getAlgorithmItemStyle = (algorithm: string) => {
        const isSelected = externalSelectedAlgorithm === algorithm;
        const isHovered = hoveredMethod === algorithm;
        
        return {
          color: getAlgorithmColor(algorithm),
          borderWidth: (isSelected || isHovered) ? 3 : 0,
          borderColor: '#ffffff',
          shadowBlur: (isSelected || isHovered) ? 15 : 0,
          shadowColor: getAlgorithmColor(algorithm),
          shadowOffsetX: (isSelected || isHovered) ? 2 : 0,
          shadowOffsetY: (isSelected || isHovered) ? 2 : 0,
          opacity: hoveredMethod && hoveredMethod !== algorithm ? 0.3 : 1
        };
      };

      // Helper function to get category item style with hover highlighting
      const getCategoryItemStyle = (algorithm: string, category: string) => {
        const isAlgorithmHovered = hoveredMethod === algorithm;
        
        return {
          color: getCategoryColor(category),
          borderWidth: isAlgorithmHovered ? 2 : 0,
          borderColor: '#ffffff',
          shadowBlur: isAlgorithmHovered ? 8 : 0,
          shadowColor: getCategoryColor(category),
          shadowOffsetX: isAlgorithmHovered ? 1 : 0,
          shadowOffsetY: isAlgorithmHovered ? 1 : 0,
          opacity: hoveredMethod && hoveredMethod !== algorithm ? 0.3 : 1
        };
      };
      
      // Create algorithm data dynamically based on filtered algorithms
      const algorithmConfigs = {
        freqshift: { name: "Frequency Shifting", data: performanceData.freqshift },
        hapticgen: { name: "HapticGen", data: performanceData.hapticgen },
        percept: { name: "Perception-Level Mapping", data: performanceData.percept },
        pitchmatch: { name: "Pitch Matching", data: performanceData.pitchmatch }
      };

      // If no algorithms are selected in the filter, show a message
      if (algorithmsToShow.length === 0) {
        data = [{
          name: "No Algorithms Selected",
          value: 1,
          itemStyle: { color: '#ccc' },
          children: [{
            name: "Please select algorithms in the filter panel",
            value: 1,
            itemStyle: { color: '#eee' }
          }]
        }];
      } else {
        data = algorithmsToShow.map(algorithmKey => {
          const config = algorithmConfigs[algorithmKey as keyof typeof algorithmConfigs];
          const algorithmData = config.data;
          
          return {
            name: config.name,
            value: algorithmData.overall,
            itemStyle: getAlgorithmItemStyle(algorithmKey),
            algorithm: algorithmKey,
            children: categories.map(category => {
              const categoryValue = algorithmData.categories[category] || 0;
              const algorithmTotal = algorithmTotals[algorithmKey as keyof typeof algorithmTotals];
              // Calculate proportional value based on algorithm's total area
              const proportionalValue = algorithmTotal > 0 ? 
                (categoryValue / algorithmTotal) * algorithmData.overall : 
                algorithmData.overall / 5; // Equal distribution if no wins
              return {
                name: category,
                value: proportionalValue,
                itemStyle: getCategoryItemStyle(algorithmKey, category),
                algorithm: algorithmKey,
                category: category,
                originalValue: categoryValue // Store original value for tooltip
              };
            })
          };
        });
      }
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
                selectedAlgorithm === 'percept' ? 'Perceptual Mapping' : 'PitchMatch',
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
              const isWinner = algorithmRating === maxRating;
              
              // Debug the first few sounds to see what's happening
              if (categorySounds.indexOf(sound) < 3) {
                console.log('🔍 Win calculation debug:', {
                  soundname: sound.soundname,
                  selectedAlgorithm,
                  algorithmRating,
                  maxRating,
                  isWinner,
                  allRatings: sound.ratings
                });
              }
              
              return isWinner;
            }).length;
            
            const winPercentage = (wins / categorySounds.length) * 100;
            
            console.log('🔍 Level 3 Debug - Subcategory:', {
              subcategoryName,
              totalSounds: categorySounds.length,
              wins,
              winPercentage,
              selectedAlgorithm,
              sampleSound: categorySounds[0] ? {
                soundname: categorySounds[0].soundname,
                ratings: categorySounds[0].ratings,
                target: categorySounds[0].target
              } : null,
              allSoundsInCategory: categorySounds.map(s => ({
                soundname: s.soundname,
                target: s.target,
                ratings: s.ratings
              }))
            });
            
            // Only show subcategories where the selected algorithm has wins
            if (selectedAlgorithm && wins > 0) {
              console.log('✅ Adding subcategory with wins:', {
                subcategoryName,
                wins,
                winPercentage,
                selectedAlgorithm
              });
              soundsData.push({
                name: subcategoryName,
                value: winPercentage,
                itemStyle: { color: getSubcategoryColor(selectedCategory) },
                classNum: i,
                isSubcategory: true,
                soundCount: categorySounds.length,
                winCount: wins
              });
            } else if (!selectedAlgorithm && winPercentage > 0) {
              // Show all subcategories when no algorithm is selected
              console.log('✅ Adding subcategory (no algorithm selected):', {
                subcategoryName,
                winPercentage
              });
              soundsData.push({
                name: subcategoryName,
                value: winPercentage,
                itemStyle: { color: getSubcategoryColor(selectedCategory) },
                classNum: i,
                isSubcategory: true,
                soundCount: categorySounds.length,
                winCount: wins
              });
            } else {
              console.log('❌ Skipping subcategory:', {
                subcategoryName,
                selectedAlgorithm,
                wins,
                winPercentage,
                reason: !selectedAlgorithm ? 'No algorithm selected' : 'No wins for selected algorithm'
              });
            }
          }
        }

        console.log('🔍 Level 3 Final Data:', {
          selectedCategory,
          selectedAlgorithm,
          externalSelectedAlgorithm,
          soundsDataLength: soundsData.length,
          soundsData: soundsData.map(s => ({
            name: s.name,
            value: s.value,
            soundCount: s.soundCount,
            winCount: s.winCount
          })),
          currentLevel
        });

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
      let classNum = -1;
      
      if (selectedPoint) {
        // If we have a selected point, use its class number directly
        classNum = selectedPoint.class;
      } else {
        // Otherwise, find the class number for the selected subcategory by searching through the range
        const categoryRanges = {
          'Animals': [0, 9],
          'Natural\nSoundscapes': [10, 19],
          'Human\nNon-Speech': [20, 29],
          'Interior\nDomestic': [30, 39],
          'Exterior\nUrban': [40, 49]
        };
        
        const range = categoryRanges[selectedCategory as keyof typeof categoryRanges];
        if (range) {
          for (let i = range[0]; i <= range[1]; i++) {
            if (getSpecificCategoryName(i) === selectedSubcategory) {
              classNum = i;
              break;
            }
          }
        }
      }
      
      if (classNum >= 0) {
        // Get all sounds for this specific subcategory
        const subcategorySounds = soundData.filter(sound => 
          sound.target === classNum
        );
        
        console.log('🔍 Level 4 Debug:', {
          selectedAlgorithm,
          selectedSubcategory,
          classNum,
          totalSounds: subcategorySounds.length,
          algorithm: selectedAlgorithm
        });
        
        // Get sounds where this algorithm wins
        const winningSounds = subcategorySounds.filter(sound => {
          const algorithmRating = sound.ratings[selectedAlgorithm as keyof typeof sound.ratings];
          const maxRating = Math.max(
            sound.ratings.freqshift,
            sound.ratings.hapticgen,
            sound.ratings.percept,
            sound.ratings.pitchmatch
          );
          const isWinner = algorithmRating === maxRating;
          
          if (isWinner) {
            console.log('🏆 Winning sound:', {
              soundname: sound.soundname,
              algorithm: selectedAlgorithm,
              algorithmRating,
              maxRating,
              allRatings: sound.ratings
            });
          }
          
          return isWinner;
        });
        
        console.log('🎯 Level 4 Results:', {
          totalSounds: subcategorySounds.length,
          winningSounds: winningSounds.length,
          selectedAlgorithm
        });
        
        // If no algorithm is selected, show a message
        if (!selectedAlgorithm) {
          data = [{
            name: selectedSubcategory,
            itemStyle: { color: getSubcategoryColor(selectedCategory) },
            isCenter: true,
            children: [{
              name: "No algorithm selected",
              value: 1,
              itemStyle: { color: '#ccc' }
            }]
          }];
        } else {
          const individualSoundsData = winningSounds.map(sound => ({
          name: sound.soundname,
          value: sound.ratings[selectedAlgorithm as keyof typeof sound.ratings],
          itemStyle: { color: getSubcategoryColor(selectedCategory) },
          filename: sound.filename,
          soundname: sound.soundname,
          target: sound.target,
          category: sound.category,
          freqshift: sound.ratings.freqshift,
          hapticgen: sound.ratings.hapticgen,
          percept: sound.ratings.percept,
          pitchmatch: sound.ratings.pitchmatch,
          bestAlgorithm: sound.bestAlgorithm,
          bestRating: sound.bestRating,
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
  }, [performanceData, currentLevel, selectedAlgorithm, selectedCategory, selectedSubcategory, soundData, externalSelectedAlgorithm, selectedPoint, hoveredMethod]);

  // Color functions
  const getAlgorithmColor = (algorithm: string): string => {
    const algorithmColors: Record<string, string> = {
      'freqshift': colors(0), // Pink
      'hapticgen': colors(1), // Orange
      'percept': colors(2),   // Gold
      'pitchmatch': colors(3) // Teal
    };
    return algorithmColors[algorithm] || '#6b7280';
  };

  const getCategoryColor = (category: string): string => {
    // Normalize category name to handle both formats (with and without newlines)
    const normalizedCategory = category.replace(/\n/g, ' ').replace(/\//g, '/');
    const colors: Record<string, string> = {
      'Animals': '#166534',
      'Natural Soundscapes': '#1d4ed8',
      'Natural\nSoundscapes': '#1d4ed8',
      'Human Non-Speech': '#7e22ce',
      'Human\nNon-Speech': '#7e22ce',
      'Interior/Domestic': '#b91c1c',
      'Interior\nDomestic': '#b91c1c',
      'Exterior/Urban': '#d97706',
      'Exterior\nUrban': '#d97706'
    };
    return colors[category] || colors[normalizedCategory] || '#6b7280';
  };

  const getSubcategoryColor = (category: string): string => {
    // Normalize category name to handle both formats (with and without newlines)
    const normalizedCategory = category.replace(/\n/g, ' ').replace(/\//g, '/');
    const colors: Record<string, string> = {
      'Animals': '#22c55e',
      'Natural Soundscapes': '#3b82f6',
      'Natural\nSoundscapes': '#3b82f6',
      'Human Non-Speech': '#a855f7',
      'Human\nNon-Speech': '#a855f7',
      'Interior/Domestic': '#ef4444',
      'Interior\nDomestic': '#ef4444',
      'Exterior/Urban': '#fbbf24',
      'Exterior\nUrban': '#fbbf24'
    };
    return colors[category] || colors[normalizedCategory] || '#9ca3af';
  };

  // Handle chart click events
  const handleChartClick = (params: any) => {
    // Check if there's a selected point from the line graph
    if (selectedPoint) {
      console.log('⚠️ Line graph point is selected, showing conflict popup');
      setShowConflictPopup(true);
      return;
    }
    
    if (currentLevel === 'level1') {
      if (params.data && params.data.algorithm && !params.data.category) {
        // Clicked on algorithm (inner ring) - go to level 2
        console.log('🔍 Level 1 to Level 2 navigation:', {
          algorithm: params.data.algorithm
        });
        
        setSelectedAlgorithm(params.data.algorithm);
        setCurrentLevel('level2');
        
        // Trigger bidirectional connection
        if (onAlgorithmSelect) {
          onAlgorithmSelect(params.data.algorithm);
        }
      } else if (params.data && params.data.algorithm && params.data.category) {
        // Clicked on category (outer ring) - go to level 3
        console.log('🔍 Level 1 to Level 3 navigation:', {
          algorithm: params.data.algorithm,
          category: params.data.category
        });
        
        setSelectedAlgorithm(params.data.algorithm);
        setSelectedCategory(params.data.category);
        setCurrentLevel('level3');
        
        // Trigger bidirectional connections
        if (onAlgorithmSelect) {
          onAlgorithmSelect(params.data.algorithm);
        }
        if (onCategorySelect) {
          onCategorySelect(params.data.category);
        }
      }
    } else if (currentLevel === 'level2') {
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level1');
        // Clear all selections and trigger bidirectional connections
        setSelectedAlgorithm('');
        setSelectedCategory('');
        setSelectedSubcategory('');
        if (onAlgorithmSelect) {
          onAlgorithmSelect('');
        }
        if (onCategorySelect) {
          onCategorySelect('');
        }
        if (onSubcategorySelect) {
          onSubcategorySelect('');
        }
      } else if (params.data && params.data.name) {
        // Preserve the selectedAlgorithm when navigating to level 3
        console.log('🔍 Level 2 to Level 3 navigation:', {
          selectedAlgorithm,
          category: params.data.name
        });
        
        setSelectedCategory(params.data.name);
        setCurrentLevel('level3');
        
        // Trigger bidirectional connection
        if (onCategorySelect) {
          onCategorySelect(params.data.name);
        }
      }
    } else if (currentLevel === 'level3') {
      if (params.data && params.data.isCenter) {
        console.log('🔍 Level 3 to Level 2 navigation:', {
          selectedAlgorithm,
          clearingCategory: selectedCategory,
          clearingSubcategory: selectedSubcategory
        });
        
        setCurrentLevel('level2');
        setSelectedCategory('');
        setSelectedSubcategory('');
        
        // Trigger bidirectional connections
        console.log('🔄 Triggering category deselection:', { onCategorySelect: !!onCategorySelect });
        if (onCategorySelect) {
          console.log('✅ Calling onCategorySelect with empty string');
          onCategorySelect('');
        }
        if (onSubcategorySelect) {
          console.log('✅ Calling onSubcategorySelect with empty string');
          onSubcategorySelect('');
        }
        
        // Ensure algorithm selection is maintained for level 2
        // Use setTimeout to ensure category deselection is processed first
        setTimeout(() => {
          if (onAlgorithmSelect && selectedAlgorithm) {
            onAlgorithmSelect(selectedAlgorithm);
          }
        }, 0);
      } else if (params.data && params.data.isSubcategory) {
        console.log('🔍 Navigating to Level 4:', {
          selectedAlgorithm,
          selectedCategory,
          subcategory: params.data.name,
          classNum: params.data.classNum
        });
        
        setSelectedSubcategory(params.data.name);
        setCurrentLevel('level4');
        
        // Trigger bidirectional connection
        if (onSubcategorySelect) {
          onSubcategorySelect(params.data.name);
        }
      }
    } else if (currentLevel === 'level4') {
      if (params.data && params.data.isCenter) {
        console.log('🔍 Level 4 to Level 3 navigation:', {
          selectedAlgorithm,
          selectedCategory,
          clearingSubcategory: selectedSubcategory
        });
        
        setCurrentLevel('level3');
        setSelectedSubcategory('');
        
        // Trigger bidirectional connection to clear subcategory
        if (onSubcategorySelect) {
          onSubcategorySelect('');
        }
        
        // Also trigger category selection to restore category filter
        if (onCategorySelect && selectedCategory) {
          onCategorySelect(selectedCategory);
        }
      } else if (params.data && params.data.isIndividualSound && onSoundSelect) {
        // Individual sound clicked - open detailed sound drawer
        console.log('🎯 Individual sound clicked:', params.data);
        
        const soundData: SoundData = {
          filename: params.data.filename || params.data.soundname,
          soundname: params.data.soundname,
          target: params.data.target || 0,
          category: params.data.category || '',
          ratings: {
            freqshift: params.data.freqshift || 0,
            hapticgen: params.data.hapticgen || 0,
            percept: params.data.percept || 0,
            pitchmatch: params.data.pitchmatch || 0
          },
          bestAlgorithm: params.data.bestAlgorithm || 'freqshift',
          bestRating: params.data.bestRating || 0
        };
        
        console.log('🎵 Created sound data for drawer:', soundData);
        onSoundSelect(soundData);
      }
    }
  };

    // Chart configuration
  const sunburstOption = {
    backgroundColor: "#ffffff",
    animation: true,
    animationDuration: 300,
    animationEasing: 'cubicOut',
    tooltip: { 
      trigger: "item", 
      formatter: function(params: any) {
        if (currentLevel === 'level1') {
          if (params.data && params.data.algorithm && !params.data.category) {
            // Inner ring - algorithm
            const fullName = params.name === "FreqShift" ? "Frequency Shifting" : params.name;
            return `${fullName}<br/>Overall Win Rate: ${params.value.toFixed(1)}%<br/>Click to explore categories`;
          } else if (params.data && params.data.algorithm && params.data.category) {
            // Outer ring - category
            const originalValue = params.data.originalValue || params.value;
            const fullCategoryName = params.name === "Natural" ? "Natural Soundscapes" :
                                   params.name === "Human" ? "Human Non-Speech" :
                                   params.name === "Interior" ? "Interior Domestic" :
                                   params.name === "Exterior" ? "Exterior Urban" : params.name;
            return `${fullCategoryName}<br/>Category Win Rate: ${originalValue.toFixed(1)}%<br/>Algorithm: ${params.data.algorithm === 'freqshift' ? 'Frequency Shifting' : 
              params.data.algorithm === 'hapticgen' ? 'HapticGen' : 
              params.data.algorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'}<br/>Hover to see category name<br/>Click to explore sounds`;
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
            const algorithmName = selectedAlgorithm === 'freqshift' ? 'Frequency Shifting' : 
                                   selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
                                   selectedAlgorithm === 'percept' ? 'Perception-Level\nMapping' : 
                                   selectedAlgorithm === 'pitchmatch' ? 'Pitch Matching' : 'Unknown';
            return `${params.name}<br/>${algorithmName} Win Rate: ${params.value.toFixed(1)}%<br/>Wins: ${params.data.winCount}/${params.data.soundCount} sounds<br/>Click to see individual sounds`;
          }
        } else if (currentLevel === 'level4') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to subcategories`;
          } else {
            return `${params.name}<br/>Rating: ${params.value.toFixed(1)}<br/>Algorithm: ${selectedAlgorithm === 'freqshift' ? 'Frequency Shifting' : 
              selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
              selectedAlgorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'}`;
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
        minAngle: 2,
        nodeClick: false,
        emphasis: { focus: "ancestor" },
        colorMappingBy: 'id',
        levels: currentLevel === 'level1' ? [
          {
            r0: "10%",
            r: "12%",
            label: { 
              show: true,
              color: "#ffffff", 
              fontSize: 9, 
              fontWeight: "bold",
              position: "inside",
              formatter: function(params: any) {
                // Short algorithm names for better fit
                const name = params.name;
                if (name === "Frequency Shifting") return "FreqShift";
                if (name === "HapticGen") return "HapticGen";
                if (name === "Perception-Level Mapping") return "Percept";
                if (name === "Pitch Matching") return "PitchMatch";
                return name;
              }
            },
            itemStyle: { 
              borderWidth: 2, 
              borderColor: "#ffffff"
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 12
              }
            }
          },
          {
            r0: "13%",
            r: "40%",
            label: { 
              show: true, // Hide category labels initially
              color: "#000000", 
              fontSize: 9, 
              fontWeight: "bold",
              formatter: function(params: any) {
                return ""; // Return empty string to completely hide category names
              },
              rotate: 0,
              overflow: 'truncate',
              minAngle: 5
            },
            itemStyle: { 
              borderWidth: 1, 
              borderColor: "#ffffff"
            },
            emphasis: {
              label: {
                show: false, // Keep labels hidden even on hover
                fontSize: 11,
                formatter: function(params: any) {
                  return ""; // Return empty string to completely hide category names
                }
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
          color: hoveredMethod ? getAlgorithmColor(hoveredMethod) : '#333' 
        }}>
          {currentLevel === 'level1' && (
            selectedPoint ? 
            `🏆 Algorithm Performance Overview - ${selectedPoint.algorithm === 'freqshift' ? 'Frequency Shifting' : 
              selectedPoint.algorithm === 'hapticgen' ? 'HapticGen' : 
              selectedPoint.algorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'} ${selectedPoint.subcategory} selected in line chart` :
            externalSelectedAlgorithm ? 
            `🏆 Algorithm Performance Overview - ${externalSelectedAlgorithm === 'freqshift' ? 'Frequency Shifting' : 
              externalSelectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
              externalSelectedAlgorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'} selected in line chart` :
            hoveredMethod ? 
            `🏆 Algorithm Performance Overview - Hovering ${hoveredMethod === 'freqshift' ? 'Frequency Shifting' : 
              hoveredMethod === 'hapticgen' ? 'HapticGen' : 
              hoveredMethod === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'} from line chart` :
            ratings && ratings.length > 0 && algorithmsToShow && algorithmsToShow.length < 4 ?
            `🏆 Algorithm Performance Overview - Filtered (${algorithmsToShow.length}/4 algorithms)` :
            '🏆 Algorithm Performance Overview'
          )}
          {currentLevel === 'level2' && `📊 ${selectedAlgorithm === 'freqshift' ? 'Frequency Shifting' : 
            selectedAlgorithm === 'hapticgen' ? 'HapticGen' : 
            selectedAlgorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'} by Category`}
          {currentLevel === 'level3' && `🎵 ${selectedCategory} Sounds`}
          {currentLevel === 'level4' && (
            selectedPoint ? 
            `🎵 ${selectedPoint.algorithm === 'freqshift' ? 'Frequency Shifting' : 
              selectedPoint.algorithm === 'hapticgen' ? 'HapticGen' : 
              selectedPoint.algorithm === 'percept' ? 'Perception-Level Mapping' : 'Pitch Matching'} - ${selectedPoint.subcategory} (Selected from line chart)` :
            `🎵 ${selectedSubcategory} Individual Sounds`
          )}
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
          <div style={{ position: 'relative' }}>
            <ReactECharts 
              option={sunburstOption} 
              style={{ 
                height: '400px', 
                width: '100%',
                opacity: selectedPoint ? 0.5 : 1,
                transition: 'opacity 0.3s ease'
              }}
              opts={{ renderer: 'canvas' }}
              onEvents={{
                click: handleChartClick
              }}
            />
            {selectedPoint && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                borderRadius: '8px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  🔒 Sunburst disabled<br/>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    Deselect line graph point to use
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Selection Conflict Popup */}
      {selectedPoint && (
        <SelectionConflictPopup
          isOpen={showConflictPopup}
          onClose={() => setShowConflictPopup(false)}
          onDeselectPoint={() => {
            // Clear the selected point by calling the algorithm select with empty string
            if (onAlgorithmSelect) {
              onAlgorithmSelect('');
            }
            if (onCategorySelect) {
              onCategorySelect('');
            }
            if (onSubcategorySelect) {
              onSubcategorySelect('');
            }
          }}
          selectedPoint={selectedPoint}
        />
      )}
    </div>
  );
};

export default AlgorithmPerformanceSunburst;
