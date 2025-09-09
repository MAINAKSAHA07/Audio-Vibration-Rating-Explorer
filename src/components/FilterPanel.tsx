import React, { useState, useEffect, useMemo } from 'react';
import { RatingData } from '../utils/api';
import colors from '../colors.js';

export interface FilterState {
  search: string;
  categories: string[];
  classes: string[];
  designs: string[];
  algorithms: string[];
  ratingRange: { min: number; max: number };
  sortBy: 'average' | 'variance' | 'filename';
  sortOrder: 'asc' | 'desc';
}

interface FilterPanelProps {
  ratings: RatingData[];
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
  selectedAlgorithm?: string;
  onAlgorithmSelect?: (algorithm: string) => void;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategorySelect?: (subcategory: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  ratings,
  filterState,
  onFilterChange,
  isOpen,
  onToggle,
  selectedAlgorithm,
  onAlgorithmSelect,
  selectedCategory,
  onCategorySelect,
  selectedSubcategory,
  onSubcategorySelect
}) => {
  console.log('🔍 FilterPanel rendering with:', { ratings: ratings.length, filterState, isOpen });
  const [localFilters, setLocalFilters] = useState<FilterState>(filterState);

  // Get actual category names and classes from data
  const actualCategories = useMemo(() => {
    const categories = [...new Set(ratings.map(r => r.category))].sort();
    console.log('📁 Actual categories in data:', categories);
    console.log('📁 Total categories found:', categories.length);
    
    // Check if all expected categories are present
    const expectedCategories = [
      'dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow',
      'rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm',
      'crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping',
      'door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking',
      'helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'
    ];
    
    const missingCategories = expectedCategories.filter(cat => !categories.includes(cat));
    const extraCategories = categories.filter(cat => !expectedCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      console.warn('⚠️ Missing categories:', missingCategories);
    }
    if (extraCategories.length > 0) {
      console.warn('⚠️ Extra categories:', extraCategories);
    }
    
    return categories;
  }, [ratings]);



  // Group categories by type for better organization
  const categoryGroups = useMemo(() => {
    const animals = ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'];
    const naturalSoundscapes = ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'];
    const humanNonSpeech = ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'];
    const interiorDomestic = ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'];
    const exteriorUrban = ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'];

    const groups = [
      { name: 'Animals', sounds: animals, },
      { name: 'Natural soundscapes & water', sounds: naturalSoundscapes,  },
      { name: 'Human, non-speech', sounds: humanNonSpeech,  },
      { name: 'Interior/domestic', sounds: interiorDomestic,  },
      { name: 'Exterior/urban', sounds: exteriorUrban,}
    ];

    // Debug: Check how many sounds are found in each group
    groups.forEach(group => {
      const foundSounds = group.sounds.filter(sound => 
        ratings.some(r => r.category === sound)
      );
      const missingSounds = group.sounds.filter(sound => 
        !ratings.some(r => r.category === sound)
      );
      
      console.log(`📁 ${group.name}: Found ${foundSounds.length}/${group.sounds.length} sounds`);
      if (missingSounds.length > 0) {
        console.warn(`⚠️ Missing in ${group.name}:`, missingSounds);
      }
    });

    return groups;
  }, [ratings]);



  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filterState);
  }, [filterState]);

  // Handle external category selection changes from AlgorithmPerformanceSunburst
  useEffect(() => {
    if (selectedCategory) {
      console.log('🔄 FilterPanel received category selection from Sunburst:', selectedCategory);
      
      // Map Sunburst category name to FilterPanel category name
      const filterPanelCategoryName = selectedCategory === 'Natural\nSoundscapes' ? 'Natural soundscapes & water' :
                                     selectedCategory === 'Human\nNon-Speech' ? 'Human, non-speech' :
                                     selectedCategory === 'Interior\nDomestic' ? 'Interior/domestic' :
                                     selectedCategory === 'Exterior\nUrban' ? 'Exterior/urban' :
                                     selectedCategory; // Animals stays the same
      
      // Find the category group
      const categoryGroup = categoryGroups.find(cg => cg.name === filterPanelCategoryName);
      
      if (categoryGroup) {
        // Select all subcategories in the group
        setLocalFilters(prev => ({
          ...prev,
          categories: categoryGroup.sounds
        }));
        
        console.log('✅ FilterPanel updated categories from Sunburst:', {
          sunburstCategory: selectedCategory,
          filterPanelCategory: filterPanelCategoryName,
          selectedSubcategories: categoryGroup.sounds
        });
      } else {
        // Handle individual subcategory selection
        setLocalFilters(prev => ({
          ...prev,
          categories: [selectedCategory]
        }));
        
        console.log('✅ FilterPanel updated categories from Sunburst subcategory:', {
          sunburstCategory: selectedCategory,
          selectedSubcategories: [selectedCategory]
        });
      }
    } else {
      console.log('🔄 FilterPanel received category deselection from Sunburst');
      // Clear categories when deselection occurs
      setLocalFilters(prev => ({
        ...prev,
        categories: []
      }));
      
      console.log('✅ FilterPanel cleared categories from Sunburst deselection');
    }
  }, [selectedCategory]);

  // Handle external subcategory selection changes from AlgorithmPerformanceSunburst
  useEffect(() => {
    if (selectedSubcategory) {
      console.log('🔄 FilterPanel received subcategory selection from Sunburst:', selectedSubcategory);
      
      // Select only this subcategory
      setLocalFilters(prev => ({
        ...prev,
        categories: [selectedSubcategory]
      }));
      
      console.log('✅ FilterPanel updated categories from Sunburst subcategory:', {
        selectedSubcategory,
        filterCategories: [selectedSubcategory]
      });
    } else {
      console.log('🔄 FilterPanel received subcategory deselection from Sunburst');
      // Clear categories when subcategory deselection occurs
      setLocalFilters(prev => ({
        ...prev,
        categories: []
      }));
      
      console.log('✅ FilterPanel cleared categories from Sunburst subcategory deselection');
    }
  }, [selectedSubcategory]);

  // Debounced filter update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔍 FilterPanel updating filters:', localFilters);
      onFilterChange(localFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localFilters, onFilterChange]);

  const updateFilter = (updates: Partial<FilterState>) => {
    setLocalFilters(prev => ({ ...prev, ...updates }));
  };

  // Keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      // Escape to clear search
      if (event.key === 'Escape' && localFilters.search) {
        updateFilter({ search: '' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [localFilters.search]);

  const toggleCategory = (categoryName: string) => {
    const category = categoryGroups.find(c => c.name === categoryName);
    if (!category) return;

    // Check if this is a category group
    const isGroup = categoryGroups.some(c => c.name === categoryName);
    
    if (isGroup) {
      // Handle category group selection
      const selectedSubcategories = category.sounds.filter(sound => 
        localFilters.categories.includes(sound)
      );
      const isFullySelected = selectedSubcategories.length === category.sounds.length;
      
      if (isFullySelected) {
        // If all subcategories are selected, deselect all subcategories
        const newCategories = localFilters.categories.filter(c => 
          !category.sounds.includes(c)
        );
        updateFilter({
          categories: newCategories
        });
        
        // Trigger bidirectional connection - clear category selection
        if (onCategorySelect) {
          onCategorySelect('');
        }
      } else {
        // If group is not selected, select only the subcategories (not the group name)
        const newCategories = [
          ...localFilters.categories, 
          ...category.sounds
        ];
        updateFilter({
          categories: newCategories
        });
        
        // Trigger bidirectional connection - select category group
        if (onCategorySelect) {
          // Map FilterPanel category name to Sunburst category name
          const sunburstCategoryName = categoryName === 'Natural soundscapes & water' ? 'Natural\nSoundscapes' :
                                      categoryName === 'Human, non-speech' ? 'Human\nNon-Speech' :
                                      categoryName === 'Interior/domestic' ? 'Interior\nDomestic' :
                                      categoryName === 'Exterior/urban' ? 'Exterior\nUrban' :
                                      categoryName; // Animals stays the same
          onCategorySelect(sunburstCategoryName);
        }
      }
    } else {
      // Handle individual subcategory selection
      const newCategories = localFilters.categories.includes(categoryName)
        ? localFilters.categories.filter(c => c !== categoryName)
        : [...localFilters.categories, categoryName];

      updateFilter({
        categories: newCategories
      });
      
      // Trigger bidirectional connection for individual subcategory
      if (onCategorySelect) {
        if (localFilters.categories.includes(categoryName)) {
          onCategorySelect(''); // Clear selection
        } else {
          onCategorySelect(categoryName); // Select subcategory
        }
      }
    }
  };

  const toggleSubcategory = (subcategoryName: string) => {
    // When toggling a subcategory, we need to handle the relationship with its parent category
    const parentCategory = categoryGroups.find(c => c.sounds.includes(subcategoryName));
    
    if (!parentCategory) return;

    const isSubcategorySelected = localFilters.categories.includes(subcategoryName);
    
    let newCategories: string[];
    
    if (isSubcategorySelected) {
      // Remove the subcategory
      newCategories = localFilters.categories.filter(c => c !== subcategoryName);
    } else {
      // Add the subcategory
      newCategories = [...localFilters.categories, subcategoryName];
    }
    
    updateFilter({
      categories: newCategories
    });
    
    // Trigger bidirectional connection for subcategory
    if (onCategorySelect) {
      if (isSubcategorySelected) {
        onCategorySelect(''); // Clear selection
      } else {
        onCategorySelect(subcategoryName); // Select subcategory
      }
    }
  };



  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      categories: [],
      classes: [],
      designs: [],
      algorithms: [],
      ratingRange: { min: 35, max: 100 },
      sortBy: 'average',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    
    // Clear bidirectional selections
    if (onAlgorithmSelect) {
      onAlgorithmSelect('');
    }
    if (onCategorySelect) {
      onCategorySelect('');
    }
  };

  const getFilteredCount = () => {
    // This will be calculated by the parent component
    return 0;
  };

  return (
    <div className="filter-sidebar-panel">
      <div className="filter-sidebar-header">
      <h3>🔍 Filters</h3>
      </div>

      <div className="filter-sidebar-content">
        {/* Search Filter */}
        <div className="filter-section">
          <h4>🔍 Search <span className="keyboard-shortcut">⌘K</span></h4>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search soundnames (Dog_1), categories (Animals), or classes..."
              value={localFilters.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
              className="search-input"
            />
            {localFilters.search && (
              <button
                className="clear-search-btn"
                onClick={() => updateFilter({ search: '' })}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {localFilters.search && (
            <div className="search-info">
              <small>Searching across: soundnames, categories, category groups (Animals, Natural soundscapes & water), and classes</small>
            </div>
          )}
        </div>

        {/* Algorithm Filter */}
        <div className="filter-section">
          <h4>⚙️ Algorithms</h4>
          <div className="filter-description">
            <small>Show sounds where selected algorithms achieved the best rating</small>
          </div>
          <div className="algorithm-list">
            {[
              { key: 'freqshift', name: 'Frequency Shift', color: colors(0) },
              { key: 'hapticgen', name: 'HapticGen', color: colors(1) },
              { key: 'percept', name: 'Perceptual Mapping', color: colors(2) },
              { key: 'pitchmatch', name: 'Pitch Match', color: colors(3) }
            ].map(algorithm => {
              const isSelected = localFilters.algorithms.includes(algorithm.key);
              
              // Check if this algorithm is connected from Sunburst
              const isConnectedFromSunburst = selectedAlgorithm === algorithm.key;
              
              // Count sounds where this algorithm is the best performer
              const algorithmCount = ratings.filter(r => {
                // Group by audio file to get unique sounds
                const audioFile = r.audioFile;
                const soundRatings = ratings.filter(r2 => r2.audioFile === audioFile);
                
                // Find the best rating for this sound
                const maxRating = Math.max(...soundRatings.map(sr => sr.rating));
                
                // Check if this algorithm achieved the best rating
                return r.design === algorithm.key && r.rating === maxRating;
              }).length;
              
              return (
                <label key={algorithm.key} className={`algorithm-checkbox ${isSelected ? 'algorithm-selected' : ''} ${isConnectedFromSunburst ? 'algorithm-connected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      const newAlgorithms = isSelected
                        ? localFilters.algorithms.filter(a => a !== algorithm.key)
                        : [algorithm.key]; // Only select this algorithm, deselect others
                      updateFilter({ algorithms: newAlgorithms });
                      
                      // Trigger bidirectional connection
                      if (onAlgorithmSelect) {
                        if (isSelected) {
                          onAlgorithmSelect(''); // Clear selection
                        } else {
                          onAlgorithmSelect(algorithm.key); // Select algorithm
                        }
                      }
                    }}
                  />
                  <span className="checkmark"></span>
                  <span 
                    className="algorithm-name" 
                    style={{ 
                      
                      color: '#000000',
                    
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      display: 'inline-block'
                    }}
                  >
                    {algorithm.name}
                  </span>
                  <span className="algorithm-count">
                    ({algorithmCount})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <h4>📁 Categories</h4>
          <div className="category-list">
            {categoryGroups.map(category => {
              const selectedSubcategories = category.sounds.filter(sound => 
                localFilters.categories.includes(sound)
              );
              const hasSubcategoriesSelected = selectedSubcategories.length > 0;
              const isFullySelected = selectedSubcategories.length === category.sounds.length;
              
              // Determine the checkbox state
              let checkboxState = false;
              let isIndeterminate = false;
              
              if (isFullySelected) {
                checkboxState = true;
                isIndeterminate = false;
              } else if (hasSubcategoriesSelected) {
                checkboxState = false;
                isIndeterminate = true;
              } else {
                checkboxState = false;
                isIndeterminate = false;
              }
              
              // Count actual sounds in this category
              const soundsInCategory = ratings.filter(r => 
                category.sounds.includes(r.category)
              ).length / 4; // Divide by 4 since each sound has 4 ratings (one per design)

              // Check if this category is connected from Sunburst
              const isConnectedFromSunburst = selectedCategory && (
                (category.name === 'Animals' && selectedCategory === 'Animals') ||
                (category.name === 'Natural soundscapes & water' && selectedCategory === 'Natural\nSoundscapes') ||
                (category.name === 'Human, non-speech' && selectedCategory === 'Human\nNon-Speech') ||
                (category.name === 'Interior/domestic' && selectedCategory === 'Interior\nDomestic') ||
                (category.name === 'Exterior/urban' && selectedCategory === 'Exterior\nUrban')
              );

              return (
                <div key={category.name} className={`category-item ${isConnectedFromSunburst ? 'category-connected' : ''}`}>
                  <label className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={checkboxState}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = isIndeterminate;
                        }
                      }}
                      onChange={() => toggleCategory(category.name)}
                    />
                    <span className="checkmark"></span>
                    <span className="category-name">{category.name}</span>
                    <span className="class-count">
                      {isFullySelected
                        ? `(${category.sounds.length} items)` 
                        : `(${selectedSubcategories.length}/${category.sounds.length} items)`
                      }
                    </span>
                  </label>
                  
                  <div className="class-list-grid">
                    {category.sounds.map(sound => {
                      const isSoundSelected = localFilters.categories.includes(sound);
                      
                      return (
                        <label key={sound} className={`class-checkbox-grid ${isSoundSelected ? 'sound-selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSoundSelected}
                            onChange={() => toggleSubcategory(sound)}
                          />
                          <span className="checkmark"></span>
                          <span className="class-name">{sound.replace(/_/g, ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating Range Filter */}
        <div className="filter-section">
          <h4>⭐ Rating Range</h4>
          <div className="rating-range">
            <div className="range-display">
              <span className="range-label">Range: {localFilters.ratingRange.min} - {localFilters.ratingRange.max}</span>
              <div className="range-info">
                <small>Available range: 35 - 100</small>
              </div>
            </div>
            <div className="dual-range-slider">
              <div className="range-track">
                <div className="range-track-inactive" style={{ width: '35%' }}></div>
                <div className="range-track-active" style={{ width: '65%' }}></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.ratingRange.min}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value);
                  if (newMin <= localFilters.ratingRange.max) {
                    updateFilter({
                      ratingRange: {
                        ...localFilters.ratingRange,
                        min: newMin
                      }
                    });
                  }
                }}
                className="range-slider-min"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters.ratingRange.max}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value);
                  if (newMax >= localFilters.ratingRange.min) {
                    updateFilter({
                      ratingRange: {
                        ...localFilters.ratingRange,
                        max: newMax
                      }
                    });
                  }
                }}
                className="range-slider-max"
              />
            </div>
          </div>
        </div>

        {/* Sort Options
        <div className="filter-section">
          <h4>📊 Sort By</h4>
          <div className="sort-options">
            <select
              value={localFilters.sortBy}
              onChange={(e) => updateFilter({ 
                sortBy: e.target.value as 'average' | 'variance' | 'filename' 
              })}
            >
              <option value="average">Highest Average</option>
              <option value="variance">Most Variable</option>
              <option value="filename">Filename</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => updateFilter({
                sortOrder: localFilters.sortOrder === 'asc' ? 'desc' : 'asc'
              })}
            >
              {localFilters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div> */}

        {/* Filter Summary */}
        <div className="filter-section">
          <h4>📋 Active Filters</h4>
          <div className="filter-summary">
            {localFilters.categories.length > 0 && (
              <div className="filter-tag">
                Categories: {localFilters.categories.length}
              </div>
            )}
            {localFilters.algorithms.length > 0 && (
              <div className="filter-tag">
                Algorithms: {localFilters.algorithms.length}
              </div>
            )}
            {localFilters.search && (
              <div className="filter-tag">
                Search: "{localFilters.search}"
              </div>
            )}
            {(localFilters.ratingRange.min > 0 || localFilters.ratingRange.max < 100) && (
              <div className="filter-tag">
                Rating: {localFilters.ratingRange.min}-{localFilters.ratingRange.max}
              </div>
            )}
            {localFilters.categories.length === 0 && 
             localFilters.algorithms.length === 0 &&
             !localFilters.search && 
             localFilters.ratingRange.min === 0 && 
             localFilters.ratingRange.max === 100 && (
              <div className="filter-tag" style={{ background: '#f8f9fa', color: '#6c757d', borderColor: '#dee2e6' }}>
                No active filters
              </div>
            )}
          </div>
          <button 
            className="clear-filters-btn" 
            onClick={clearAllFilters}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
