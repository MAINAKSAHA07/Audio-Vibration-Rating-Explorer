import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { RatingData, fetchRatings } from '../utils/api';

interface HierarchicalSunburstProps {
  onDetailView?: (data: DetailViewData) => void;
}

export interface DetailViewData {
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

interface AudioFileDetail {
  filename: string;
  soundname: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  average: number;
}

type NavigationLevel = 'level1' | 'level2' | 'level3';

const HierarchicalSunburst: React.FC<HierarchicalSunburstProps> = ({ onDetailView }) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>('level1');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

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

  // Helper function to format soundnames like SoundGrid (CategoryName_Number)
  const formatSoundname = (category: string, index: number): string => {
    const capitalizeCategory = (category: string) => {
      const words = category.split('_');
      const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
      return capitalizedWords.join('_');
    };
    return `${capitalizeCategory(category)}_${index + 1}`;
  };

  // Helper function to truncate subcategory names to 6 characters
  const truncateSubcategoryName = (name: string): string => {
    if (name.length <= 6) return name;
    return name.substring(0, 6) + '..';
  };

  // Fetch ratings data
  useEffect(() => {
    const loadRatings = async () => {
      try {
        const data = await fetchRatings();
        setRatings(data);
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    };
    loadRatings();
  }, []);

  // Generate chart data based on current level
  useEffect(() => {
    if (!ratings.length) return;

    let data: any[] = [];

    if (currentLevel === 'level1') {
      // Level 1: All main categories
      data = [
        {
          name: "Animals",
          itemStyle: { color: "#166534" },
          label: { show: true, color: "#ffffff", fontSize: 8, fontWeight: "bold" },
          children: [
            { name: truncateSubcategoryName("dog"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 0 },
            { name: truncateSubcategoryName("rooster"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 1 },
            { name: truncateSubcategoryName("pig"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 2 },
            { name: truncateSubcategoryName("cow"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 3 },
            { name: truncateSubcategoryName("frog"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 4 },
            { name: truncateSubcategoryName("cat"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 5 },
            { name: truncateSubcategoryName("hen"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 6 },
            { name: truncateSubcategoryName("insects"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 7 },
            { name: truncateSubcategoryName("sheep"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 8 },
            { name: truncateSubcategoryName("crow"), value: 1, itemStyle: { color: "#bbf7d0" }, classNum: 9 }
          ]
        },
        {
          name: "Natural\nSoundscapes",
          itemStyle: { color: "#1d4ed8" },
          label: { show: true, color: "#ffffff", fontSize: 8, fontWeight: "bold" },
          children: [
            { name: truncateSubcategoryName("rain"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 10 },
            { name: truncateSubcategoryName("sea_waves"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 11 },
            { name: truncateSubcategoryName("crackling_fire"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 12 },
            { name: truncateSubcategoryName("crickets"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 13 },
            { name: truncateSubcategoryName("chirping_birds"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 14 },
            { name: truncateSubcategoryName("water_drops"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 15 },
            { name: truncateSubcategoryName("wind"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 16 },
            { name: truncateSubcategoryName("pouring_water"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 17 },
            { name: truncateSubcategoryName("toilet_flush"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 18 },
            { name: truncateSubcategoryName("thunderstorm"), value: 1, itemStyle: { color: "#bfdbfe" }, classNum: 19 }
          ]
        },
        {
          name: "Human\nNon-Speech",
          itemStyle: { color: "#7e22ce" },
          label: { show: true, color: "#ffffff", fontSize: 8, fontWeight: "bold" },
          children: [
            { name: truncateSubcategoryName("crying_baby"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 20 },
            { name: truncateSubcategoryName("sneezing"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 21 },
            { name: truncateSubcategoryName("clapping"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 22 },
            { name: truncateSubcategoryName("breathing"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 23 },
            { name: truncateSubcategoryName("coughing"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 24 },
            { name: truncateSubcategoryName("footsteps"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 25 },
            { name: truncateSubcategoryName("laughing"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 26 },
            { name: truncateSubcategoryName("brushing_teeth"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 27 },
            { name: truncateSubcategoryName("snoring"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 28 },
            { name: truncateSubcategoryName("drinking_sipping"), value: 1, itemStyle: { color: "#e9d5ff" }, classNum: 29 }
          ]
        },
        {
          name: "Interior\nDomestic",
          itemStyle: { color: "#b91c1c" },
          label: { show: true, color: "#ffffff", fontSize: 8, fontWeight: "bold" },
          children: [
            { name: truncateSubcategoryName("door_wood_knock"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 30 },
            { name: truncateSubcategoryName("mouse_click"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 31 },
            { name: truncateSubcategoryName("keyboard_typing"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 32 },
            { name: truncateSubcategoryName("door_wood_creaks"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 33 },
            { name: truncateSubcategoryName("can_opening"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 34 },
            { name: truncateSubcategoryName("washing_machine"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 35 },
            { name: truncateSubcategoryName("vacuum_cleaner"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 36 },
            { name: truncateSubcategoryName("clock_alarm"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 37 },
            { name: truncateSubcategoryName("clock_tick"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 38 },
            { name: truncateSubcategoryName("glass_breaking"), value: 1, itemStyle: { color: "#fecaca" }, classNum: 39 }
          ]
        },
        {
          name: "Exterior\nUrban",
          itemStyle: { color: "#d97706" },
          label: { show: true, color: "#ffffff", fontSize: 8, fontWeight: "bold" },
          children: [
            { name: truncateSubcategoryName("helicopter"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 40 },
            { name: truncateSubcategoryName("chainsaw"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 41 },
            { name: truncateSubcategoryName("siren"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 42 },
            { name: truncateSubcategoryName("car_horn"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 43 },
            { name: truncateSubcategoryName("engine"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 44 },
            { name: truncateSubcategoryName("train"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 45 },
            { name: truncateSubcategoryName("church_bells"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 46 },
            { name: truncateSubcategoryName("airplane"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 47 },
            { name: truncateSubcategoryName("fireworks"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 48 },
            { name: truncateSubcategoryName("hand_saw"), value: 1, itemStyle: { color: "#fde68a" }, classNum: 49 }
          ]
        }
      ];
    } else if (currentLevel === 'level2') {
      // Level 2: Selected category in center + its subcategories in outer ring
      const categoryRanges = {
        'Animals': [0, 9],
        'Natural\nSoundscapes': [10, 19],
        'Human\nNon-Speech': [20, 29],
        'Interior\nDomestic': [30, 39],
        'Exterior\nUrban': [40, 49]
      };

      const range = categoryRanges[selectedCategory as keyof typeof categoryRanges];
      if (range) {
        const subcategories = [];
        for (let i = range[0]; i <= range[1]; i++) {
          const subcategoryName = getSpecificCategoryName(i);
          const subcategoryRatings = ratings.filter(r => parseInt(r.target) === i);
          
          if (subcategoryRatings.length > 0) {
            const avgRating = subcategoryRatings.reduce((sum, r) => sum + r.rating, 0) / subcategoryRatings.length;
            subcategories.push({
              name: subcategoryName,
              value: avgRating,
              classNum: i,
              itemStyle: { 
                color: getCategoryColor(selectedCategory, i - range[0])
              }
            });
          }
        }

        data = [
          {
            name: selectedCategory,
            itemStyle: { color: getCategoryCenterColor(selectedCategory) },
            label: { show: true, color: "#ffffff", fontSize: 14, fontWeight: "bold" },
            isCenter: true, // Flag to identify center element
            children: subcategories
          }
        ];
      }
    } else if (currentLevel === 'level3') {
      // Level 3: Selected subcategory in center + its individual files in outer ring
      const classNum = parseInt(selectedSubcategory);
      const fileRatings = ratings.filter(r => parseInt(r.target) === classNum);
      
      // Group by audio file
      const fileGroups = new Map<string, RatingData[]>();
      fileRatings.forEach(rating => {
        if (!fileGroups.has(rating.audioFile)) {
          fileGroups.set(rating.audioFile, []);
        }
        fileGroups.get(rating.audioFile)!.push(rating);
      });

      // Group files by category and assign sequential numbers
      const categoryFileGroups = new Map<string, Array<[string, RatingData[]]>>();
      
      Array.from(fileGroups.entries()).forEach(([filename, fileRatings]) => {
        const category = fileRatings[0]?.category || 'unknown';
        if (!categoryFileGroups.has(category)) {
          categoryFileGroups.set(category, []);
        }
        categoryFileGroups.get(category)!.push([filename, fileRatings]);
      });
      
      // Create individual file data
      const fileData: any[] = [];
      categoryFileGroups.forEach((files, category) => {
        files.sort(([filenameA], [filenameB]) => filenameA.localeCompare(filenameB));
        
        files.forEach(([filename, fileRatings], index) => {
          const avgRating = fileRatings.reduce((sum, r) => sum + r.rating, 0) / fileRatings.length;
          fileData.push({
            name: formatSoundname(category, index),
            value: avgRating,
            filename: filename,
            ratings: fileRatings,
            itemStyle: { 
              color: getFileColor(selectedCategory)
            }
          });
        });
      });

      data = [
        {
          name: getSpecificCategoryName(classNum),
          itemStyle: { color: getSubcategoryCenterColor(selectedCategory) },
          label: { show: true, color: "#ffffff", fontSize: 14, fontWeight: "bold" },
          isCenter: true, // Flag to identify center element
          children: fileData
        }
      ];
    }

    setChartData(data);
  }, [ratings, currentLevel, selectedCategory, selectedSubcategory]);

  // Color functions
  const getCategoryColor = (category: string, index: number): string => {
    const colorMap: Record<string, string[]> = {
      'Animals': ['#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e', '#22c55e'],
      'Natural\nSoundscapes': ['#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6', '#3b82f6'],
      'Human\nNon-Speech': ['#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7', '#a855f7'],
      'Interior\nDomestic': ['#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444'],
      'Exterior\nUrban': ['#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b', '#f59e0b']
    };
    return colorMap[category]?.[index] || '#cccccc';
  };

  const getCategoryCenterColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'Animals': '#166534',
      'Natural\nSoundscapes': '#1d4ed8',
      'Human\nNon-Speech': '#7e22ce',
      'Interior\nDomestic': '#b91c1c',
      'Exterior\nUrban': '#d97706'
    };
    return colorMap[category] || '#166534';
  };

  const getSubcategoryCenterColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'Animals': '#22c55e',
      'Natural\nSoundscapes': '#3b82f6',
      'Human\nNon-Speech': '#a855f7',
      'Interior\nDomestic': '#ef4444',
      'Exterior\nUrban': '#fbbf24'
    };
    return colorMap[category] || '#22c55e';
  };

  const getFileColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'Animals': '#bbf7d0', // Light green
      'Natural\nSoundscapes': '#bfdbfe', // Light blue
      'Human\nNon-Speech': '#e9d5ff', // Light purple
      'Interior\nDomestic': '#fecaca', // Light red
      'Exterior\nUrban': '#fde68a' // Light orange
    };
    return colorMap[category] || '#f3f4f6'; // Light gray as fallback
  };

  // Handle chart click events
  const handleChartClick = (params: any) => {
    if (currentLevel === 'level1') {
      // Check if this is a main category (has children)
      if (params.data && params.data.children) {
        setSelectedCategory(params.name);
        setCurrentLevel('level2');
      } else if (params.data && params.data.classNum !== undefined) {
        // This is a subcategory in Level 1, go to Level 2 with parent category
        const parentCategory = getCategoryForClass(params.data.classNum);
        setSelectedCategory(parentCategory);
        setCurrentLevel('level2');
      }
    } else if (currentLevel === 'level2') {
      // Check if this is the center element (go back to level1)
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level1');
        setSelectedCategory('');
      } else if (params.data && params.data.classNum !== undefined) {
        // This is a subcategory, go to level3
        setSelectedSubcategory(params.data.classNum.toString());
        setCurrentLevel('level3');
      }
    } else if (currentLevel === 'level3') {
      // Check if this is the center element (go back to level2)
      if (params.data && params.data.isCenter) {
        setCurrentLevel('level2');
        setSelectedSubcategory('');
      } else if (params.data && params.data.ratings) {
        // This is an individual file, open detail view
        const fileRatings = params.data.ratings;
        
        const detailData: DetailViewData = {
          category: selectedCategory,
          subcategory: getSpecificCategoryName(parseInt(selectedSubcategory)),
          audioFiles: [{
            filename: params.data.filename,
            soundname: params.data.name,
            ratings: {
              freqshift: fileRatings.find((r: RatingData) => r.design === 'freqshift')?.rating || 0,
              hapticgen: fileRatings.find((r: RatingData) => r.design === 'hapticgen')?.rating || 0,
              percept: fileRatings.find((r: RatingData) => r.design === 'percept')?.rating || 0,
              pitchmatch: fileRatings.find((r: RatingData) => r.design === 'pitchmatch')?.rating || 0
            },
            average: params.data.value
          }],
          statistics: {
            average: params.data.value,
            min: Math.min(...fileRatings.map((r: RatingData) => r.rating)),
            max: Math.max(...fileRatings.map((r: RatingData) => r.rating)),
            count: fileRatings.length
          }
        };
        
        if (onDetailView) {
          onDetailView(detailData);
        }
      }
    }
  };

  // Chart configuration
  const sunburstOption = {
    backgroundColor: "#ffffff",
    tooltip: { 
      trigger: "item", 
      formatter: function(params: any) {
        if (currentLevel === 'level1') {
          if (params.data && params.data.children) {
            return `${params.name}<br/>Click to explore subcategories`;
          } else if (params.data && params.data.classNum !== undefined) {
            return `${params.name}<br/>Click to view category overview`;
          } else {
            return `${params.name}<br/>Subcategory`;
          }
        } else if (currentLevel === 'level2') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to all categories`;
          } else {
            return `${params.name}<br/>Average Rating: ${params.value.toFixed(1)}<br/>Click to view individual files`;
          }
        } else if (currentLevel === 'level3') {
          if (params.data && params.data.isCenter) {
            return `${params.name}<br/>Click to go back to subcategories`;
          } else {
            return `${params.name}<br/>Average Rating: ${params.value.toFixed(1)}<br/>Click for details`;
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
        emphasis: { focus: "ancestor" },
        levels: [
          {
            label: { 
              show: true, 
              color: "#000000", 
              fontSize: 12, 
              fontWeight: "bold",
              position: "inside"
            }
          }, 
          {
            r0: "15%",
            r: "40%",
            label: { show: false },
            itemStyle: { borderWidth: 2, borderColor: "#ffffff" }
          },
          {
            r0: "45%",
            r: "90%",
            label: { 
              show: true, 
              color: "#000000", 
              fontSize: 10, 
              fontWeight: "bold",
              formatter: function(params: any) {
                return params.name.replace('_', '\n');
              }
            },
            itemStyle: { borderWidth: 2, borderColor: "#ffffff" }
          }
        ],
        data: chartData
      }
    ]
  };

  return (
    <div className="hierarchical-sunburst">
      {/* Chart */}
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
          {currentLevel === 'level1' && '🌳 All Categories'}
          {currentLevel === 'level2' && `🌿 ${selectedCategory} Subcategories`}
          {currentLevel === 'level3' && `📁 ${getSpecificCategoryName(parseInt(selectedSubcategory))} Audio Files`}
        </h3>
        
        <ReactECharts 
          option={sunburstOption} 
          style={{ height: '400px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          onEvents={{
            click: handleChartClick
          }}
        />
      </div>
    </div>
  );
};

export default HierarchicalSunburst;
