import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RatingData } from '../utils/api';
import { getUniqueClasses, getClassStats } from '../utils/dataHelpers';

interface VolcanoContourPlotProps {
  data: RatingData[];
  onClassSelect?: (classCode: string) => void;
}

interface GridPoint {
  x: number;
  y: number;
  z: number;
  classCode: string;
  design: string;
}

const VolcanoContourPlot: React.FC<VolcanoContourPlotProps> = ({
  data,
  onClassSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [selectedContour, setSelectedContour] = useState<number | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    const margin = { top: 60, right: 80, bottom: 80, left: 120 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Prepare data
    const classes = getUniqueClasses(data);
    const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
    
    // Create grid data with original ratings (0-80 scale)
    const grid: GridPoint[] = [];
    classes.forEach((classCode, classIndex) => {
      const classData = getClassStats(data, classCode);
      designs.forEach((design, designIndex) => {
        const designData = classData.designs.find(d => d.design === design);
        const rating = designData ? designData.averageRating : 0;
        
        grid.push({
          x: classIndex,
          y: designIndex,
          z: rating,
          classCode,
          design
        });
      });
    });

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, classes.length - 1])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, designs.length - 1])
      .range([chartHeight, 0]);

    // Calculate rating range for better visualization
    const minRating = Math.min(...grid.map(d => d.z));
    const maxRating = Math.max(...grid.map(d => d.z));
    
    console.log('Rating range:', { minRating, maxRating, original: true });
    
    // Use 0-80 scale with turbo color scheme
    const colorScale = d3.scaleSequential(d3.interpolateTurbo)
      .domain([0, 80]);

    // Create z-matrix for contours
    const nCols = classes.length;
    const nRows = designs.length;
    const values = new Float32Array(nCols * nRows);
    
    // Fill the matrix with rating values
    for (let y = 0; y < nRows; y++) {
      for (let x = 0; x < nCols; x++) {
        const index = y * nCols + x;
        const gridPoint = grid.find(d => d.x === x && d.y === y);
        values[index] = gridPoint ? gridPoint.z : 0;
      }
    }

    // Generate contours with proper 0-80 scale thresholds
    const thresholds = d3.range(0, 80.1, 8);
    
    console.log('Contour data:', {
      nCols,
      nRows,
      minRating,
      maxRating,
      thresholds: thresholds,
      values: Array.from(values).slice(0, 20), // First 20 values for debugging
      sampleGridPoints: grid.slice(0, 5) // First 5 grid points for debugging
    });
    
    const contours = d3.contours()
      .size([nCols, nRows])
      .thresholds(thresholds)
      (Array.from(values));
    
    console.log('Generated contours:', contours.length);

    // Create chart group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw contours with better visibility
    g.selectAll("path")
      .data(contours)
      .enter()
      .append("path")
      .attr("d", d3.geoPath(d3.geoIdentity().scale(chartWidth / nCols)))
      .attr("fill", (d: any) => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.9)
      .on("mouseover", function(event, d: any) {
        d3.select(this).attr("opacity", 1);
        setSelectedContour(d.value);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9);
        setSelectedContour(null);
      });

    // Add grid points for interaction (larger and more visible)
    g.selectAll("circle")
      .data(grid)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 6)
      .attr("fill", d => colorScale(d.z))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.95)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        setHoveredPoint(`${d.classCode}-${d.design} (Rating: ${d.z.toFixed(1)}/80)`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 6);
        setHoveredPoint(null);
      })
      .on("click", (event, d) => {
        if (onClassSelect) {
          onClassSelect(d.classCode);
        }
      });

    // Add axes with better formatting and spacing
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d, i) => {
        const classCode = classes[i];
        return classCode ? `Class ${classCode}` : '';
      })
      .tickValues(d3.range(0, classes.length, Math.max(1, Math.floor(classes.length / 8))));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat((d, i) => {
        const design = designs[i];
        return design ? design.charAt(0).toUpperCase() + design.slice(1) : '';
      })
      .tickValues(d3.range(0, designs.length));

    // X-axis with fixed overlapping labels
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "start")
      .attr("dx", "0.5em")
      .attr("dy", "0.5em")
      .attr("transform", "rotate(-45)")
      .style("font-size", "10px")
      .style("font-weight", "500")
      .style("fill", "#555")
      .style("letter-spacing", "0.5px");

    // Y-axis with fixed overlapping labels
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#333")
      .style("letter-spacing", "0.3px")
      .attr("dy", "0.35em");

    // Add axis labels with better styling and positioning
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 70)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text("Semantic Classes");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -75)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text("Vibration Designs");

    // Add color legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legendX = chartWidth + 20;
    const legendY = 50;

    const legendScale = d3.scaleLinear()
      .domain([0, 80])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(8)
      .tickFormat(d => Number(d).toFixed(0));

    const legendG = g.append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Create gradient for legend
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "colorGradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale((1 - d) * 80));

    legendG.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#colorGradient)")
      .attr("stroke", "#ccc");

    legendG.append("g")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis);

    legendG.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#333")
      .text("Rating Scale");

    // Add title with better styling
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Volcano Contour Plot - Vibration Design Ratings");

  }, [data, onClassSelect]);

  return (
    <div className="volcano-contour-plot">
      <div className="plot-container" style={{ position: 'relative' }}>
        <svg ref={svgRef} width="800" height="500" />
        
        {hoveredPoint && (
          <div className="tooltip" style={{
            position: 'absolute',
            background: 'rgba(44, 62, 80, 0.95)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            maxWidth: '250px',
            wordWrap: 'break-word',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>📊 Data Point</div>
            {hoveredPoint}
          </div>
        )}
        
        {selectedContour !== null && (
          <div className="contour-info" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.95)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            border: '1px solid #dee2e6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#2c3e50' }}>🏔️ Contour Level</div>
            <div style={{ color: '#34495e' }}>{selectedContour.toFixed(1)}</div>
          </div>
        )}
      </div>
      
      <div className="plot-description" style={{
        marginTop: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        fontSize: '15px',
        lineHeight: '1.6',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#2c3e50', 
          fontSize: '18px',
          fontWeight: '600',
          borderBottom: '2px solid #3498db',
          paddingBottom: '8px'
        }}>
          📊 How to Read This Plot
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h5 style={{ margin: '0 0 10px 0', color: '#34495e', fontSize: '16px', fontWeight: '600' }}>
              🎯 Plot Elements
            </h5>
            <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'none' }}>
              <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#3498db' }}>•</span>
                <strong>X-axis:</strong> Semantic classes (sound categories)
              </li>
              <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#3498db' }}>•</span>
                <strong>Y-axis:</strong> Vibration designs (freqshift, hapticgen, percept, pitchmatch)
              </li>
              <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#3498db' }}>•</span>
                <strong>Color intensity:</strong> Average user rating scale
              </li>
              <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#3498db' }}>•</span>
                <strong>Contour lines:</strong> Connect points with similar ratings
              </li>
            </ul>
          </div>
          <div>
            <h5 style={{ margin: '0 0 10px 0', color: '#34495e', fontSize: '16px', fontWeight: '600' }}>
              🏔️ Topography Features
            </h5>
                         <ul style={{ margin: '0', paddingLeft: '20px', listStyleType: 'none' }}>
               <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '0', color: '#3498db' }}>•</span>
                 <strong>Blue areas:</strong> Lower ratings
               </li>
               <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '0', color: '#f39c12' }}>•</span>
                 <strong>Yellow areas:</strong> Medium ratings
               </li>
               <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '0', color: '#e74c3c' }}>•</span>
                 <strong>Red areas:</strong> Higher ratings
               </li>
               <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                 <span style={{ position: 'absolute', left: '0', color: '#27ae60' }}>•</span>
                 <strong>Contour lines:</strong> Connect similar rating levels
               </li>
             </ul>
          </div>
        </div>
        <div style={{ 
          marginTop: '15px', 
          padding: '12px', 
          background: 'rgba(52, 152, 219, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(52, 152, 219, 0.2)'
        }}>
          <p style={{ margin: '0', fontWeight: '500', color: '#2c3e50' }}>
            <strong>💡 Interaction:</strong> Hover over points to see detailed ratings, click to navigate to class view and explore audio samples.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolcanoContourPlot;
