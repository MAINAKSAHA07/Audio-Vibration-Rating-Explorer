import React, { useEffect, useState } from 'react';
import './App.css';
import { fetchRatings, fetchSummary, RatingData, SummaryData } from './utils/api';
import { 
  getClassStats, 
  getUniqueCategories, 
  getUniqueClasses,
  getAudioFilesForClass
} from './utils/dataHelpers';
import OverviewChart from './components/OverviewChart';
import CategoryGrid from './components/CategoryGrid';
import ClassDetail from './components/ClassDetail';

import FilterPanel, { FilterState } from './components/FilterPanel';
import SoundGrid from './components/SoundGrid';
import DataTest from './components/DataTest';
import GeneratedVisualizations from './components/GeneratedVisualizations';
import ResearchChatbot from './components/ResearchChatbot';
import VolcanoContourPlot from './components/VolcanoContourPlot';
import RadialStackedBarChart from './components/RadialStackedBarChart';
import DashboardOverview from './components/DashboardOverview';
import ErrorBoundary from './components/ErrorBoundary';
import DetailView from './components/DetailView';
import AudioUpload from './components/AudioUpload';
import AlgorithmPerformanceSunburst from './components/AlgorithmPerformanceSunburst';


type ViewType = 'overview' | 'category' | 'class' | 'visualization' | 'creative' | 'chatbot' | 'dashboard' | 'enhanced' | 'filtered' | 'upload' | 'connected';

function App() {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('filtered');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [detailViewData, setDetailViewData] = useState<any>(null);
  
  // ESC-50 Category mapping
  const getCategoryForClass = (classNum: number): string => {
    if (classNum >= 0 && classNum <= 9) return 'Animals';
    if (classNum >= 10 && classNum <= 19) return 'Natural Soundscapes';
    if (classNum >= 20 && classNum <= 29) return 'Human Non-Speech';
    if (classNum >= 30 && classNum <= 39) return 'Interior Domestic';
    if (classNum >= 40 && classNum <= 49) return 'Exterior Urban';
    return 'Unknown';
  };

  // Category mapping between FilterPanel and Sunburst
  const getSunburstCategoryName = (filterPanelCategory: string): string => {
    const categoryMap: Record<string, string> = {
      'Animals': 'Animals',
      'Natural soundscapes & water': 'Natural\nSoundscapes',
      'Human, non-speech': 'Human\nNon-Speech',
      'Interior/domestic': 'Interior\nDomestic',
      'Exterior/urban': 'Exterior\nUrban'
    };
    return categoryMap[filterPanelCategory] || filterPanelCategory;
  };

  const getFilterPanelCategoryName = (sunburstCategory: string): string => {
    const categoryMap: Record<string, string> = {
      'Animals': 'Animals',
      'Natural\nSoundscapes': 'Natural soundscapes & water',
      'Natural Soundscapes': 'Natural soundscapes & water',
      'Human\nNon-Speech': 'Human, non-speech',
      'Human Non-Speech': 'Human, non-speech',
      'Interior\nDomestic': 'Interior/domestic',
      'Interior Domestic': 'Interior/domestic',
      'Exterior\nUrban': 'Exterior/urban',
      'Exterior Urban': 'Exterior/urban'
    };
    return categoryMap[sunburstCategory] || sunburstCategory;
  };
  
  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    categories: [],
    classes: [],
    designs: [],
    algorithms: [],
    ratingRange: { min: 35, max: 100 },
    sortBy: 'average',
    sortOrder: 'desc'
  });

  // Bidirectional connection state
  const [connectedAlgorithm, setConnectedAlgorithm] = useState<string>('');
  const [connectedCategory, setConnectedCategory] = useState<string>('');
  const [connectedSubcategory, setConnectedSubcategory] = useState<string>('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading enhanced data...');
        const [ratingsData, summaryData] = await Promise.all([
          fetchRatings(),
          fetchSummary()
        ]);
        console.log('Enhanced data loaded successfully:', {
          ratingsCount: ratingsData.length,
          summary: summaryData
        });
        setRatings(ratingsData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading Enhanced Audio-Vibration Explorer...</h2>
          <p>Please wait while we load the enhanced data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!summary || ratings.length === 0) {
    return (
      <div className="App">
        <div className="error">
          <h2>No Data Available</h2>
          <p>No ratings data found. Please check that the data files are properly loaded.</p>
        </div>
      </div>
    );
  }

  const categories = getUniqueCategories(ratings);
  const classes = getUniqueClasses(ratings);

  // Bidirectional connection handlers
  const handleAlgorithmSelect = (algorithm: string) => {
    console.log('🔄 handleAlgorithmSelect called:', {
      algorithm,
      currentConnectedAlgorithm: connectedAlgorithm,
      currentFilterAlgorithms: filterState.algorithms
    });
    
    setConnectedAlgorithm(algorithm);
    
    // Update filter state to reflect the selected algorithm
    setFilterState(prev => ({
      ...prev,
      algorithms: algorithm ? [algorithm] : []
    }));
    
    console.log('✅ Algorithm selection updated:', {
      connectedAlgorithm: algorithm,
      filterAlgorithms: algorithm ? [algorithm] : []
    });
  };

  const handleCategorySelect = (category: string) => {
    console.log('🔄 handleCategorySelect called:', {
      category,
      categoryLength: category.length,
      isEmpty: category === '',
      currentConnectedCategory: connectedCategory,
      currentConnectedAlgorithm: connectedAlgorithm,
      currentFilterCategories: filterState.categories
    });
    
    setConnectedCategory(category);
    
    if (category) {
      // Convert sunburst category name to filter panel category name
      const filterPanelCategory = getFilterPanelCategoryName(category);
      
      // Get the category group from FilterPanel
      const categoryGroups = [
        { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
        { name: 'Natural soundscapes & water', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
        { name: 'Human, non-speech', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
        { name: 'Interior/domestic', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
        { name: 'Exterior/urban', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
      ];
      
      const categoryGroup = categoryGroups.find(cg => cg.name === filterPanelCategory);
      
      if (categoryGroup) {
        // Select all subcategories in the group
        setFilterState(prev => ({
          ...prev,
          categories: categoryGroup.sounds
        }));
        
        console.log('✅ Category selection updated:', {
          connectedCategory: category,
          filterCategories: categoryGroup.sounds
        });
      } else {
        // Handle individual subcategory selection
        setFilterState(prev => ({
          ...prev,
          categories: [category]
        }));
        
        console.log('✅ Individual category selection updated:', {
          connectedCategory: category,
          filterCategories: [category]
        });
      }
    } else {
      // Clear category selection
      setFilterState(prev => ({
        ...prev,
        categories: []
      }));
      
      console.log('✅ Category selection cleared:', {
        connectedAlgorithm: connectedAlgorithm,
        filterAlgorithms: filterState.algorithms
      });
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    console.log('🔄 handleSubcategorySelect called:', {
      subcategory,
      currentConnectedSubcategory: connectedSubcategory,
      currentFilterCategories: filterState.categories,
      currentConnectedCategory: connectedCategory
    });
    
    setConnectedSubcategory(subcategory);
    
    if (subcategory) {
      // Update filter state to include only this subcategory
      setFilterState(prev => ({
        ...prev,
        categories: [subcategory]
      }));
      
      console.log('✅ Subcategory selection updated:', {
        connectedSubcategory: subcategory,
        filterCategories: [subcategory]
      });
    } else {
      // Clear subcategory selection
      // Don't try to restore parent category here - let the AlgorithmPerformanceSunburst handle it
      // by calling onCategorySelect(selectedCategory) after clearing the subcategory
      setFilterState(prev => ({
        ...prev,
        categories: []
      }));
      
      console.log('✅ Subcategory cleared, categories cleared (parent category will be restored by AlgorithmPerformanceSunburst)');
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    console.log('🔄 handleFilterChange called:', {
      newAlgorithms: filters.algorithms,
      currentConnectedAlgorithm: connectedAlgorithm,
      currentFilterAlgorithms: filterState.algorithms
    });
    
    setFilterState(filters);
    
    // Update selected algorithm based on filter changes
    if (filters.algorithms.length === 1) {
      console.log('✅ Single algorithm selected:', filters.algorithms[0]);
      setConnectedAlgorithm(filters.algorithms[0]);
    } else if (filters.algorithms.length === 0) {
      console.log('✅ All algorithms deselected');
      setConnectedAlgorithm('');
    } else {
      console.log('⚠️ Multiple algorithms selected, clearing connection');
      setConnectedAlgorithm('');
    }
    
    // Update selected category based on filter changes
    if (filters.categories.length > 0) {
      // Check if all categories belong to the same group
      const categoryGroups = [
        { name: 'Animals', sounds: ['dog', 'rooster', 'pig', 'cow', 'frog', 'cat', 'hen', 'insects', 'sheep', 'crow'] },
        { name: 'Natural soundscapes & water', sounds: ['rain', 'sea_waves', 'crackling_fire', 'crickets', 'chirping_birds', 'water_drops', 'wind', 'pouring_water', 'toilet_flush', 'thunderstorm'] },
        { name: 'Human, non-speech', sounds: ['crying_baby', 'sneezing', 'clapping', 'breathing', 'coughing', 'footsteps', 'laughing', 'brushing_teeth', 'snoring', 'drinking_sipping'] },
        { name: 'Interior/domestic', sounds: ['door_wood_knock', 'mouse_click', 'keyboard_typing', 'door_wood_creaks', 'can_opening', 'washing_machine', 'vacuum_cleaner', 'clock_alarm', 'clock_tick', 'glass_breaking'] },
        { name: 'Exterior/urban', sounds: ['helicopter', 'chainsaw', 'siren', 'car_horn', 'engine', 'train', 'church_bells', 'airplane', 'fireworks', 'hand_saw'] }
      ];
      
      // Find which category group contains all the selected categories
      const matchingGroup = categoryGroups.find(group => 
        filters.categories.every(cat => group.sounds.includes(cat))
      );
      
      if (matchingGroup && filters.categories.length === matchingGroup.sounds.length) {
        // All subcategories of a group are selected, set the group category
        const sunburstCategory = getSunburstCategoryName(matchingGroup.name);
        setConnectedCategory(sunburstCategory);
      } else if (filters.categories.length === 1) {
        // Single category selected
        setConnectedCategory(filters.categories[0]);
      } else {
        // Multiple categories from different groups, clear connected category
        setConnectedCategory('');
      }
    } else {
      setConnectedCategory('');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'filtered':
        return (
          <ErrorBoundary>
            <SoundGrid 
              ratings={ratings} 
              filterState={filterState} 
              onFilterChange={(updates) => setFilterState(prev => ({ ...prev, ...updates }))}
              selectedAlgorithm={connectedAlgorithm}
              onAlgorithmSelect={handleAlgorithmSelect}
              selectedCategory={connectedCategory}
              onCategorySelect={handleCategorySelect}
              selectedSubcategory={connectedSubcategory}
              onSubcategorySelect={handleSubcategorySelect}
            />
          </ErrorBoundary>
        );
      
      case 'overview':
        return <OverviewChart 
          summary={summary} 
          onNavigateToFiltered={() => setCurrentView('filtered')} 
          filterState={filterState}
          ratings={ratings}
          onAlgorithmSelect={(algorithm) => {
            if (algorithm) {
              setFilterState(prev => ({ ...prev, algorithms: [algorithm] }));
            } else {
              setFilterState(prev => ({ ...prev, algorithms: [] }));
            }
          }}
        />;
      
      case 'enhanced':
        return <DashboardOverview summary={summary} ratings={ratings} />;
      
      case 'category':
        if (selectedCategory) {
          return <CategoryGrid category={selectedCategory} />;
        }
        return (
          <div className="category-overview">
            <h2>Select a Category</h2>
            <p>Choose a category from the dropdown above to view detailed ratings.</p>
          </div>
        );
      
      case 'class':
        if (selectedClass) {
          console.log('Rendering class view for:', selectedClass);
          const classStats = getClassStats(ratings, selectedClass);
          const audioFiles = getAudioFilesForClass(ratings, selectedClass);
          const vibrationFiles = ratings.filter(r => r.class === selectedClass);
          console.log('Class data:', {
            classStats,
            audioFilesCount: audioFiles.length,
            vibrationFilesCount: vibrationFiles.length
          });
          return (
            <div>
              <DataTest ratings={ratings} selectedClass={selectedClass} />
              <ClassDetail
                classStats={classStats}
                audioFiles={audioFiles}
                vibrationFiles={vibrationFiles}
              />
            </div>
          );
        }
        return (
          <div className="class-overview">
            <h2>Select a Class</h2>
            <p>Choose a class from the dropdown above to view detailed information and audio players.</p>
            {selectedClass && <DataTest ratings={ratings} selectedClass={selectedClass} />}
          </div>
        );
      
      case 'visualization':
        return <GeneratedVisualizations />;
      
      case 'creative':
        return (
          <div>
            <VolcanoContourPlot
              data={ratings}
              onClassSelect={setSelectedClass}
            />
            <div style={{ marginTop: '40px' }}>
              <RadialStackedBarChart
                data={ratings}
                onClassSelect={setSelectedClass}
              />
            </div>
          </div>
        );
      
      case 'connected':
        return (
          <div>
            <div style={{ 
              marginBottom: '30px',
              textAlign: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>
                🔗 Connected Analysis View
              </h2>
              <p style={{ margin: '0', fontSize: '16px', opacity: '0.9' }}>
                Click on any class in the Volcano Plot to see its performance breakdown in the Sunburst Chart
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1f2937' 
                }}>
                  🏔️ Volcano Contour Plot
                </h3>
                <VolcanoContourPlot
                  data={ratings}
                  onClassSelect={(classCode) => {
                    setSelectedClass(classCode);
                    // Trigger sunburst to show details for this class
                    setCurrentView('connected');
                  }}
                />
              </div>
              
              <div>
                <h3 style={{ 
                  textAlign: 'center', 
                  marginBottom: '20px', 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1f2937' 
                }}>
                  🏆 Algorithm Performance Sunburst
                </h3>
                <AlgorithmPerformanceSunburst 
                  onDetailView={(data) => setDetailViewData(data)}
                />
              </div>
            </div>
            
            {selectedClass && (
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                border: '2px solid #3b82f6',
                marginTop: '20px'
              }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#1f2937', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  📊 Selected Class: {selectedClass} ({getCategoryForClass(parseInt(selectedClass))})
                </h4>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                  Explore the performance breakdown for this class in the sunburst chart above. 
                  The chart shows how each algorithm performs across different categories and subcategories.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'chatbot':
        return <ResearchChatbot ratings={ratings} summary={summary} />;
      
      case 'dashboard':
        return <DashboardOverview summary={summary} ratings={ratings} />;
      
      case 'upload':
        return <AudioUpload />;
      
      default:
        return <DashboardOverview summary={summary} ratings={ratings} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Sound2Hap: Learning Audio-to-Vibrotactile Haptic Generation from Human Ratings</h1>
            {/* <p>Explore how well four vibration designs match everyday sounds with enhanced analytics</p> */}
          </div>
          <div className="header-tabs">
            <button
              onClick={() => setCurrentView('filtered')}
              className={currentView === 'filtered' ? 'active' : ''}
            >
              📈 Dataset Visualization
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={currentView === 'upload' ? 'active' : ''}
            >
              🎵 Audio to Vibrations Generation
            </button>
          </div>
        </div>
      </header>

      <main className="App-main">
        <div className="app-layout">
          {/* Filter Panel - Hidden only on Upload */}
          {currentView !== 'upload' && (
            <aside className="filter-sidebar">
              <FilterPanel
                ratings={ratings}
                filterState={filterState}
                onFilterChange={handleFilterChange}
                isOpen={true}
                onToggle={() => {}} // No-op since filters are always visible
                selectedAlgorithm={connectedAlgorithm}
                onAlgorithmSelect={handleAlgorithmSelect}
                selectedCategory={connectedCategory}
                onCategorySelect={handleCategorySelect}
              />
            </aside>
          )}

          {/* Main Content Area */}
          <div className={`main-content-area ${currentView === 'upload' ? 'full-width' : ''}`}>
            <div className="content" style={{
              height: '100%',
              overflow: 'auto',
              padding: currentView === 'filtered' ? '0' : '2rem'
            }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      
      {/* Detail View Modal */}
      {detailViewData && (
        <DetailView 
          data={detailViewData} 
          onClose={() => setDetailViewData(null)}
          onNavigateToFiltered={() => setCurrentView('filtered')}
        />
      )}
    </div>
  );
}

export default App;
