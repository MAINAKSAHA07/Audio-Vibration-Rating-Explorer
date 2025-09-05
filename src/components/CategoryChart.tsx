import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CategoryStats } from '../utils/dataHelpers';

interface CategoryChartProps {
  categoryStats: CategoryStats;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ categoryStats }) => {
  const chartData = categoryStats.designs.map(design => ({
    design: design.design.charAt(0).toUpperCase() + design.design.slice(1),
    rating: design.averageRating,
    count: design.count
  }));



  return (
    <div className="category-chart">
      <h2>Ratings for Category: {categoryStats.category}</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="design" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}`, 
                name === 'rating' ? 'Average Rating' : name
              ]}
              labelFormatter={(label) => `Design: ${label}`}
            />
            <Legend />
            <Bar dataKey="rating" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-stats">
        <p>Total Audio Files: {categoryStats.totalCount}</p>
        <p>Average Ratings:</p>
        <ul>
          {categoryStats.designs.map((design, index) => (
            <li key={design.design}>
              {design.design.charAt(0).toUpperCase() + design.design.slice(1)}: {design.averageRating.toFixed(1)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryChart; 