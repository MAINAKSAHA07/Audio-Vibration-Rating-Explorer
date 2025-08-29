import React from 'react';

interface FilterControlsProps {
  categories: string[];
  classes: string[];
  selectedCategory: string;
  selectedClass: string;
  onCategoryChange: (category: string) => void;
  onClassChange: (classCode: string) => void;
  onViewChange: (view: 'overview' | 'category' | 'class' | 'visualization' | 'creative' | 'chatbot' | 'dashboard' | 'enhanced' | 'filtered' | 'upload' | 'connected') => void;
  currentView: 'overview' | 'category' | 'class' | 'visualization' | 'creative' | 'chatbot' | 'dashboard' | 'enhanced' | 'filtered' | 'upload' | 'connected';
}

const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  classes,
  selectedCategory,
  selectedClass,
  onCategoryChange,
  onClassChange,
  onViewChange,
  currentView
}) => {
  return (
    <div className="filter-controls">
      <div className="view-buttons">
        {/* <button
          onClick={() => onViewChange('enhanced')}
          className={currentView === 'enhanced' ? 'active' : ''}
        >
          🚀 Enhanced Dashboard
        </button> 
        <button
          onClick={() => onViewChange('overview')}
          className={currentView === 'overview' ? 'active' : ''}
        >
           Overview
        </button>*/}
        <button
          onClick={() => onViewChange('filtered')}
          className={currentView === 'filtered' ? 'active' : ''}
        >
          📈 Audio Overview
        </button>
        <button
          onClick={() => onViewChange('upload')}
          className={currentView === 'upload' ? 'active' : ''}
        >
          🎵 Audio Upload
        </button>
       {/* <button
          onClick={() => onViewChange('connected')}
          className={currentView === 'connected' ? 'active' : ''}
        >
          🔗 Connected Analysis
        </button>
         <button
          onClick={() => onViewChange('dashboard')}
          className={currentView === 'dashboard' ? 'active' : ''}
        >
          📊 Dashboard
        </button> */}
       {/* <button
          onClick={() => onViewChange('category')}
          className={currentView === 'category' ? 'active' : ''}
        >
          🏷️ By Category
        </button>
        <button
          onClick={() => onViewChange('class')}
          className={currentView === 'class' ? 'active' : ''}
        >
          🎓 By Class
        </button>
        <button
          onClick={() => onViewChange('visualization')}
          className={currentView === 'visualization' ? 'active' : ''}
        >
          📊 All Visualizations
        </button>*/}


        {/* <button
          onClick={() => onViewChange('creative')}
          className={currentView === 'creative' ? 'active' : ''}
        >
          🎨 Creative Visualizations
        </button> */}
        {/* <button
          onClick={() => onViewChange('chatbot')}
          className={currentView === 'chatbot' ? 'active' : ''}
        >
          🤖 Research Assistant
        </button> */}
      </div>

      {currentView === 'category' && (
        <div className="category-filter">
          <label htmlFor="category-select">Select Category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentView === 'class' && (
        <div className="class-filter">
          <label htmlFor="class-select">Select Class:</label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
          >
            <option value="">Select a Class</option>
            {classes.map(classCode => (
              <option key={classCode} value={classCode}>
                Class {classCode}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FilterControls; 