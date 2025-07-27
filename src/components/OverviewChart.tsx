import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SummaryData } from '../utils/api';

interface OverviewChartProps {
  summary: SummaryData;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ summary }) => {
  const chartData = summary.designs.map(design => ({
    design: design.charAt(0).toUpperCase() + design.slice(1),
    rating: summary.averageRatings[design]
  }));

  return (
    <div className="overview-chart">
      <h2>Average Ratings by Design</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="design" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}`, 'Average Rating']}
              labelFormatter={(label) => `Design: ${label}`}
            />
            <Bar dataKey="rating" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-stats">
        <p>Total Audio Files: {summary.uniqueAudioFiles}</p>
        <p>Total Classes: {summary.uniqueClasses}</p>
        <p>Total Ratings: {summary.totalEntries}</p>
      </div>
    </div>
  );
};

export default OverviewChart; 