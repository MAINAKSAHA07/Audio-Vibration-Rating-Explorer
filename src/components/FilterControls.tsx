import React from 'react';

interface FilterControlsProps {
  categories: string[];
  classes: string[];
  selectedCategory: string;
  selectedClass: string;
  onCategoryChange: (category: string) => void;
  onClassChange: (classCode: string) => void;
  onViewChange: (view: 'overview' | 'category' | 'class' | 'visualization') => void;
  currentView: 'overview' | 'category' | 'class' | 'visualization';
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
        <button
          onClick={() => onViewChange('overview')}
          className={currentView === 'overview' ? 'active' : ''}
        >
          Overview
        </button>
        <button
          onClick={() => onViewChange('category')}
          className={currentView === 'category' ? 'active' : ''}
        >
          By Category
        </button>
        <button
          onClick={() => onViewChange('class')}
          className={currentView === 'class' ? 'active' : ''}
        >
          By Class
        </button>
        <button
          onClick={() => onViewChange('visualization')}
          className={currentView === 'visualization' ? 'active' : ''}
        >
          📊 All Visualizations
        </button>
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