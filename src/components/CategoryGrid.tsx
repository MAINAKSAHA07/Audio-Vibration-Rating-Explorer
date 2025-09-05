import React, { useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { RatingData, fetchRatings } from '../utils/api';
import colors from '../colors.js';

interface SoundCard {
  id: string;
  filename: string;
  ratings: {
    freqshift: number;
    hapticgen: number;
    percept: number;
    pitchmatch: number;
  };
  average: number;
  duration?: number;
  category: string;
  audioFile: string;
  vibrationFiles: {
    freqshift: string;
    hapticgen: string;
    percept: string;
    pitchmatch: string;
  };
  hasZeroRatings?: boolean;
}

interface CategoryGridProps {
  category: string;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ category }) => {
  const [sounds, setSounds] = useState<SoundCard[]>([]);
  const [selectedSound, setSelectedSound] = useState<SoundCard | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'average' | 'variance' | 'filename'>('average');
  const [filterMin, setFilterMin] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Close drawer when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDetailsOpen && !target.closest('.details-drawer') && !target.closest('.sound-card')) {
        setIsDetailsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDetailsOpen]);

  // Color system (consistent everywhere)
  const chartColors = {
    freqshift: colors(0),  // Pink
    hapticgen: colors(1),  // Blue
    percept: colors(2),    // Yellow
    pitchmatch: colors(3)  // Lavender
  };

  // Load data for the category
  React.useEffect(() => {
    const loadCategoryData = async () => {
      setIsLoading(true);
      try {
        const allRatings = await fetchRatings();
        const categoryData = allRatings.filter(r => r.category === category);
        
        if (categoryData.length === 0) {
          console.warn(`No data found for category: ${category}`);
          setSounds([]);
          return;
        }
        
        // Group by audio file to create sound cards
        const soundMap = new Map<string, SoundCard>();
        
        categoryData.forEach(rating => {
          if (!soundMap.has(rating.audioFile)) {
            soundMap.set(rating.audioFile, {
              id: rating.id,
              filename: rating.audioFile,
              ratings: {
                freqshift: 0,
                hapticgen: 0,
                percept: 0,
                pitchmatch: 0
              },
              average: 0,
              category: rating.category,
              audioFile: rating.audioFile,
              vibrationFiles: {
                freqshift: '',
                hapticgen: '',
                percept: '',
                pitchmatch: ''
              }
            });
          }
          
          const sound = soundMap.get(rating.audioFile)!;
          sound.ratings[rating.design as keyof typeof sound.ratings] = rating.rating;
          sound.vibrationFiles[rating.design as keyof typeof sound.vibrationFiles] = rating.vibrationFile;
        });

        // Calculate averages and include all sounds (including those with zero ratings)
        const soundCards = Array.from(soundMap.values())
          .map(sound => {
            // Check if sound has any ratings (including zero ratings)
            const hasAnyRatings = Object.values(sound.ratings).some(rating => rating >= 0);
            
            // Debug: Log sounds with zero ratings
            const zeroRatings = Object.values(sound.ratings).filter(rating => rating === 0).length;
            if (zeroRatings > 0) {
              console.log(`⚠️ Sound with zero ratings: ${sound.filename} - zero ratings: ${zeroRatings}, all ratings:`, sound.ratings);
            }
            
            // Include all sounds that have any ratings (including zero)
            return {
              ...sound,
              average: Object.values(sound.ratings).reduce((sum, rating) => sum + rating, 0) / 4,
              hasZeroRatings: Object.values(sound.ratings).some(rating => rating === 0)
            };
          })
          .filter(sound => {
            // Only include sounds that have at least one rating (including zero ratings)
            return Object.values(sound.ratings).some(rating => rating >= 0);
          });

        console.log(`Loaded ${soundCards.length} sounds for category: ${category}`);
        setSounds(soundCards);
      } catch (error) {
        console.error('Error loading category data:', error);
        setSounds([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (category) {
      loadCategoryData();
    }
  }, [category]);

  // Memoized sorted and filtered sounds
  const processedSounds = useMemo(() => {
    let filtered = sounds.filter(sound => sound.average >= filterMin);
    
    switch (sortBy) {
      case 'average':
        return filtered.sort((a, b) => b.average - a.average);
      case 'variance':
        return filtered.sort((a, b) => {
          const varianceA = Object.values(a.ratings).reduce((sum, rating) => 
            sum + Math.pow(rating - a.average, 2), 0) / 4;
          const varianceB = Object.values(b.ratings).reduce((sum, rating) => 
            sum + Math.pow(rating - b.average, 2), 0) / 4;
          return varianceB - varianceA;
        });
      case 'filename':
        return filtered.sort((a, b) => a.filename.localeCompare(b.filename));
      default:
        return filtered;
    }
  }, [sounds, sortBy, filterMin]);

  // Category average calculation
  const categoryAverage = useMemo(() => {
    if (sounds.length === 0) return { freqshift: 0, hapticgen: 0, percept: 0, pitchmatch: 0 };
    
    const totals = { freqshift: 0, hapticgen: 0, percept: 0, pitchmatch: 0 };
    sounds.forEach(sound => {
      totals.freqshift += sound.ratings.freqshift;
      totals.hapticgen += sound.ratings.hapticgen;
      totals.percept += sound.ratings.percept;
      totals.pitchmatch += sound.ratings.pitchmatch;
    });
    
    return {
      freqshift: totals.freqshift / sounds.length,
      hapticgen: totals.hapticgen / sounds.length,
      percept: totals.percept / sounds.length,
      pitchmatch: totals.pitchmatch / sounds.length
    };
  }, [sounds]);

  // Mini 4-bar chart component
  const MiniBarChart: React.FC<{ ratings: SoundCard['ratings'] }> = ({ ratings }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    React.useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      const width = 60;
      const height = 40;
      const margin = { top: 2, right: 2, bottom: 2, left: 2 };
      const chartWidth = width - margin.left - margin.right;
      const chartHeight = height - margin.top - margin.bottom;
      
      const data = [
        { design: 'freqshift', rating: ratings.freqshift },
        { design: 'hapticgen', rating: ratings.hapticgen },
        { design: 'percept', rating: ratings.percept },
        { design: 'pitchmatch', rating: ratings.pitchmatch }
      ];
      
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.design))
        .range([0, chartWidth])
        .padding(0.1);
      
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);
      
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.design)!)
        .attr("y", d => yScale(d.rating))
        .attr("width", xScale.bandwidth())
        .attr("height", d => chartHeight - yScale(d.rating))
        .attr("fill", d => chartColors[d.design as keyof typeof chartColors])
        .attr("rx", 1)
        .attr("ry", 1);
    }, [ratings]);
    
    return <svg ref={svgRef} width="60" height="40" />;
  };

  // Mini Radar Chart component for category average
  const MiniRadarChart: React.FC<{ averages: typeof categoryAverage }> = ({ averages }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredDesign, setHoveredDesign] = useState<string | null>(null);
    
    React.useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      const width = 320;
      const height = 320;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 10;
      
      const data = [
        { design: 'freqshift', rating: averages.freqshift, angle: 0, label: 'FreqShift' },
        { design: 'hapticgen', rating: averages.hapticgen, angle: Math.PI / 2, label: 'HapticGen' },
        { design: 'percept', rating: averages.percept, angle: Math.PI, label: 'Percept' },
        { design: 'pitchmatch', rating: averages.pitchmatch, angle: 3 * Math.PI / 2, label: 'PitchMatch' }
      ];
      
      const g = svg.append("g")
        .attr("transform", `translate(${centerX},${centerY})`);
      
      // Draw background circles with labels
      for (let i = 1; i <= 4; i++) {
        const circleRadius = (radius * i) / 4;
        g.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", circleRadius)
          .attr("fill", "none")
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1);
        
        // Add value labels on the right side
        if (i === 4) {
          g.append("text")
            .attr("x", circleRadius + 12)
            .attr("y", -12)
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("fill", "#999")
            .style("font-weight", "600")
            .text("100");
        } else if (i === 2) {
          g.append("text")
            .attr("x", circleRadius + 12)
            .attr("y", -12)
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("fill", "#999")
            .style("font-weight", "600")
            .text("50");
        }
      }
      
      // Draw axis lines
      data.forEach(d => {
        const x = Math.cos(d.angle) * radius;
        const y = Math.sin(d.angle) * radius;
        g.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", x)
          .attr("y2", y)
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 1);
      });
      
      // Draw radar polygon with gradient
      const points = data.map(d => {
        const normalizedRating = d.rating / 100;
        const x = Math.cos(d.angle) * radius * normalizedRating;
        const y = Math.sin(d.angle) * radius * normalizedRating;
        return `${x},${y}`;
      }).join(" ");
      
      // Create gradient for the polygon
      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "radarGradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "rgba(102, 126, 234, 0.4)");
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgba(102, 126, 234, 0.2)");
      
      g.append("polygon")
        .attr("points", points)
        .attr("fill", "url(#radarGradient)")
        .attr("stroke", "#667eea")
        .attr("stroke-width", 2)
        .style("filter", "drop-shadow(0 2px 4px rgba(102, 126, 234, 0.2))");
      
      // Add data points with hover effects
      data.forEach(d => {
        const normalizedRating = d.rating / 100;
        const x = Math.cos(d.angle) * radius * normalizedRating;
        const y = Math.sin(d.angle) * radius * normalizedRating;
        
        const pointGroup = g.append("g");
        
        // Add glow effect
        pointGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 12)
          .attr("fill", "rgba(255, 255, 255, 0.8)")
          .attr("stroke", chartColors[d.design as keyof typeof chartColors])
          .attr("stroke-width", 3)
          .style("filter", "drop-shadow(0 3px 6px rgba(0,0,0,0.2))");
        
        // Add inner point
        pointGroup.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 6)
          .attr("fill", chartColors[d.design as keyof typeof chartColors])
          .attr("stroke", "white")
          .attr("stroke-width", 2);
        
        // Add tooltip on hover
        pointGroup
          .style("cursor", "pointer")
          .on("mouseenter", () => {
            setHoveredDesign(d.design);
            pointGroup.selectAll("circle")
              .transition()
              .duration(200)
              .attr("r", (d, i) => i === 0 ? 18 : 9);
          })
          .on("mouseleave", () => {
            setHoveredDesign(null);
            pointGroup.selectAll("circle")
              .transition()
              .duration(200)
              .attr("r", (d, i) => i === 0 ? 12 : 6);
          });
      });
      
              // Add design labels with better positioning
        data.forEach(d => {
          const labelRadius = radius + 55;
          const x = Math.cos(d.angle) * labelRadius;
          const y = Math.sin(d.angle) * labelRadius;
          
          const labelGroup = g.append("g")
            .style("cursor", "pointer")
            .on("mouseenter", () => {
              setHoveredDesign(d.design);
              labelGroup.select("rect")
                .transition()
                .duration(200)
                .attr("stroke-width", 4)
                .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))");
            })
            .on("mouseleave", () => {
              setHoveredDesign(null);
              labelGroup.select("rect")
                .transition()
                .duration(200)
                .attr("stroke-width", 2.5)
                .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
            });
          
          // Add background for better readability
          labelGroup.append("rect")
            .attr("x", x - 40)
            .attr("y", y - 20)
            .attr("width", 80)
            .attr("height", 40)
            .attr("fill", "rgba(255, 255, 255, 0.98)")
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("stroke", chartColors[d.design as keyof typeof chartColors])
            .attr("stroke-width", 2.5)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");
          
          labelGroup.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "15px")
            .style("font-weight", "700")
            .style("fill", chartColors[d.design as keyof typeof chartColors])
            .text(d.label);
        });
      
      // Add center value display
      const overallAverage = Object.values(averages).reduce((sum, val) => sum + val, 0) / 4;
      
      // Add background circle for center value
      const centerGroup = g.append("g")
        .style("cursor", "pointer")
        .on("mouseenter", () => {
          setHoveredDesign("overall");
          centerGroup.select("circle")
            .transition()
            .duration(200)
            .attr("r", 30)
            .attr("stroke-width", 3);
        })
        .on("mouseleave", () => {
          setHoveredDesign(null);
          centerGroup.select("circle")
            .transition()
            .duration(200)
            .attr("r", 25)
            .attr("stroke-width", 2);
        });
      
      centerGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 25)
        .attr("fill", "rgba(255, 255, 255, 0.95)")
        .attr("stroke", "#667eea")
        .attr("stroke-width", 2);
      
      centerGroup.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#667eea")
        .text(overallAverage.toFixed(1));
      
    }, [averages]);
    
    return (
      <div className="mini-radar-wrapper">
        <svg ref={svgRef} width="320" height="320" />
        {hoveredDesign && (
          <div className="radar-tooltip">
            {hoveredDesign === "overall" 
              ? `Overall Average: ${(Object.values(averages).reduce((sum, val) => sum + val, 0) / 4).toFixed(1)}`
              : `${hoveredDesign.charAt(0).toUpperCase() + hoveredDesign.slice(1)}: ${averages[hoveredDesign as keyof typeof averages].toFixed(1)}`
            }
          </div>
        )}
      </div>
    );
  };

  // Sound Card Component
  const SoundCard: React.FC<{ sound: SoundCard }> = ({ sound }) => {
    const hasZeroRatings = sound.hasZeroRatings || Object.values(sound.ratings).some(rating => rating === 0);
    
    return (
      <div 
        className={`sound-card ${hasZeroRatings ? 'has-zero-ratings' : ''}`}
        onClick={() => {
          setSelectedSound(sound);
          setIsDetailsOpen(true);
        }}
      >
        <div className="card-header">
          <h4 className="filename">{sound.filename}</h4>
          <span className="average-badge">{sound.average.toFixed(1)}</span>
          {hasZeroRatings && (
            <span className="zero-rating-indicator" title="Has zero ratings">⚠️</span>
          )}
        </div>
        
        <div className="mini-chart">
          <MiniBarChart ratings={sound.ratings} />
        </div>
        
        <div className="card-stats">
          <div className="rating-breakdown">
            <span style={{ color: chartColors.freqshift }}>F: {sound.ratings.freqshift.toFixed(0)}</span>
            <span style={{ color: chartColors.hapticgen }}>H: {sound.ratings.hapticgen.toFixed(0)}</span>
            <span style={{ color: chartColors.percept }}>P: {sound.ratings.percept.toFixed(0)}</span>
            <span style={{ color: chartColors.pitchmatch }}>M: {sound.ratings.pitchmatch.toFixed(0)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Details Drawer Component
  const DetailsDrawer: React.FC<{ sound: SoundCard | null; isOpen: boolean }> = ({ sound, isOpen }) => {
    if (!sound) return null;
    
    return (
      <div className={`details-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>{sound.filename}</h3>
          <button 
            className="close-button"
            onClick={() => setIsDetailsOpen(false)}
          >
            ×
          </button>
        </div>
        
        <div className="drawer-content">
          <div className="audio-section">
            <h4>Audio Player</h4>
            {/* Audio player will go here */}
            <p>Audio player implementation coming soon...</p>
          </div>
          
          <div className="vibration-section">
            <h4>Vibration Designs</h4>
            <div className="vibration-buttons">
              {Object.entries(sound.vibrationFiles).map(([design, file]) => (
                <button 
                  key={design}
                  className="vibration-button"
                  style={{ backgroundColor: chartColors[design as keyof typeof chartColors] }}
                >
                  {design.charAt(0).toUpperCase() + design.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="ratings-section">
            <h4>Detailed Ratings</h4>
            <div className="full-ratings-chart">
              {/* Full ratings chart will go here */}
              <p>Full ratings chart implementation coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="category-grid-loading">
        <div className="loading-spinner">Loading {category} sounds...</div>
      </div>
    );
  }

  return (
    <div className="category-grid-container">
      {/* Top Header */}
      <div className="category-header">
        <div className="header-left">
          <h2>{category} — {sounds.length} sounds</h2>
          <div className="category-average">
            <div className="category-average-info">
              <div className="category-average-header">
                <span>Category Average:</span>
                <span className="overall-average">
                  {(Object.values(categoryAverage).reduce((sum, val) => sum + val, 0) / 4).toFixed(1)}
                </span>
              </div>
              <div className="average-summary">
                <div className="average-item">
                  <span className="design-label" style={{ color: chartColors.freqshift }}>FreqShift</span>
                  <span className="average-value">{categoryAverage.freqshift.toFixed(1)}</span>
                </div>
                <div className="average-item">
                  <span className="design-label" style={{ color: chartColors.hapticgen }}>HapticGen</span>
                  <span className="average-value">{categoryAverage.hapticgen.toFixed(1)}</span>
                </div>
                <div className="average-item">
                  <span className="design-label" style={{ color: chartColors.percept }}>Percept</span>
                  <span className="average-value">{categoryAverage.percept.toFixed(1)}</span>
                </div>
                <div className="average-item">
                  <span className="design-label" style={{ color: chartColors.pitchmatch }}>PitchMatch</span>
                  <span className="average-value">{categoryAverage.pitchmatch.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="radar-chart-container">
              <MiniRadarChart averages={categoryAverage} />
            </div>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="filter-control">
            <label>Min Average:</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={filterMin} 
              onChange={(e) => setFilterMin(Number(e.target.value))}
            />
            <span>{filterMin}</span>
          </div>
          
          <div className="sort-control">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="average">Highest Average</option>
              <option value="variance">Most Variable</option>
              <option value="filename">Filename</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="sound-grid">
        {processedSounds.length === 0 ? (
          <div className="empty-state">
            <p>No sounds found matching the current filter.</p>
          </div>
        ) : (
          processedSounds.map(sound => (
            <SoundCard key={sound.id} sound={sound} />
          ))
        )}
      </div>

      {/* Details Drawer */}
      <DetailsDrawer sound={selectedSound} isOpen={isDetailsOpen} />
    </div>
  );
};

export default CategoryGrid;
