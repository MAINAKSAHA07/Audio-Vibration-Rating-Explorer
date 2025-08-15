import React, { useEffect, useState } from 'react';
import './App.css';
import { fetchRatings, fetchSummary, fetchMetadata, RatingData, SummaryData, MetadataData } from './utils/api';
import { 
  getCategoryStats, 
  getClassStats, 
  getUniqueCategories, 
  getUniqueClasses,
  getAudioFilesForClass
} from './utils/dataHelpers';
import OverviewChart from './components/OverviewChart';
import CategoryChart from './components/CategoryChart';
import ClassDetail from './components/ClassDetail';
import FilterControls from './components/FilterControls';
import DataTest from './components/DataTest';
import GeneratedVisualizations from './components/GeneratedVisualizations';
import ResearchChatbot from './components/ResearchChatbot';
import VolcanoContourPlot from './components/VolcanoContourPlot';
import RadialStackedBarChart from './components/RadialStackedBarChart';
import DashboardOverview from './components/DashboardOverview';



type ViewType = 'overview' | 'category' | 'class' | 'visualization' | 'creative' | 'chatbot' | 'dashboard' | 'enhanced';

function App() {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [metadata, setMetadata] = useState<MetadataData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading enhanced data...');
        const [ratingsData, summaryData, metadataData] = await Promise.all([
          fetchRatings(),
          fetchSummary(),
          fetchMetadata()
        ]);
        console.log('Enhanced data loaded successfully:', {
          ratingsCount: ratingsData.length,
          summary: summaryData,
          metadata: metadataData
        });
        setRatings(ratingsData);
        setSummary(summaryData);
        setMetadata(metadataData);
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

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewChart summary={summary} />;
      
      case 'enhanced':
        return <DashboardOverview summary={summary} ratings={ratings} />;
      
      case 'category':
        if (selectedCategory) {
          const categoryStats = getCategoryStats(ratings, selectedCategory);
          return <CategoryChart categoryStats={categoryStats} />;
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
      
      case 'chatbot':
        return <ResearchChatbot ratings={ratings} summary={summary} />;
      
      case 'dashboard':
        return <DashboardOverview summary={summary} ratings={ratings} />;
      
      default:
        return <DashboardOverview summary={summary} ratings={ratings} />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Enhanced Audio-Vibration Rating Explorer</h1>
        <p>Explore how well four vibration designs match everyday sounds with enhanced analytics</p>
      </header>

      <main className="App-main">
        <FilterControls
          categories={categories}
          classes={classes}
          selectedCategory={selectedCategory}
          selectedClass={selectedClass}
          onCategoryChange={setSelectedCategory}
          onClassChange={setSelectedClass}
          onViewChange={setCurrentView}
          currentView={currentView}
        />

        <div className="content">
          {renderContent()}
        </div>
      </main>

      <footer className="App-footer">
        <p>Made by <a href="https://mainaksaha.in/">Mainak saha</a></p>
      </footer>
    </div>
  );
}

export default App;
