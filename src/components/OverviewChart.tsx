import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SummaryData, RatingData, fetchRatings } from '../utils/api';
import HierarchicalSunburst from './HierarchicalSunburst';
import AlgorithmPerformanceSunburst from './AlgorithmPerformanceSunburst';
import DetailView from './DetailView';

interface OverviewChartProps {
  summary: SummaryData;
  onNavigateToFiltered?: () => void;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ summary, onNavigateToFiltered }) => {
  const lineChartRef = useRef<SVGSVGElement>(null);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [detailViewData, setDetailViewData] = useState<any>(null);

  // Fetch detailed ratings data for line chart
  useEffect(() => {
    const loadRatings = async () => {
      try {
        const data = await fetchRatings();
        setRatings(data);
      } catch (error) {
        console.error('Error loading ratings for line chart:', error);
      }
    };
    loadRatings();
  }, []);

  // ESC-50 Category mapping for hierarchical structure
  const getCategoryForClass = (classNum: number): string => {
    if (classNum >= 0 && classNum <= 9) return 'Animals';
    if (classNum >= 10 && classNum <= 19) return 'Natural Soundscapes';
    if (classNum >= 20 && classNum <= 29) return 'Human Non-Speech';
    if (classNum >= 30 && classNum <= 39) return 'Interior/Domestic';
    if (classNum >= 40 && classNum <= 49) return 'Exterior/Urban';
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





  // New line chart with hierarchical connections
  useEffect(() => {
    if (!lineChartRef.current) return;

    // Add a small delay to ensure the container is properly sized
    const timer = setTimeout(() => {
      if (!lineChartRef.current || !ratings || ratings.length === 0) {
        console.log('Line chart: waiting for data or ref', { ratingsLength: ratings?.length });
        return;
      }

    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();

      // Get the container width for responsive design
      const containerWidth = lineChartRef.current.parentElement?.clientWidth || 600;
      const width = Math.max(Math.min(containerWidth - 40, 900), 600); // Max width of 900px, min 600px
      
      console.log('Line chart rendering:', { containerWidth, width, ratingsCount: ratings.length });
    const height = 500;
    const margin = { top: 80, right: 150, bottom: 100, left: 80 };

    // Set the SVG size
    svg.attr("width", width).attr("height", height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

          // Process data for line chart
      const methods = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
    const classRange = Array.from({ length: 50 }, (_, i) => i);

    // Calculate average ratings for each method per class
    const lineData = classRange.map(classNum => {
      const classData: any = { class: classNum, category: getCategoryForClass(classNum) };
      
      methods.forEach(method => {
        const methodRatings = ratings.filter(r => 
          parseInt(r.target) === classNum && r.design === method
        );
        classData[method] = methodRatings.length > 0 
          ? d3.mean(methodRatings, d => d.rating) || 0 
          : 0;
      });
      
      return classData;
    });



    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 49])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Color scale for methods - Bright and vibrant colors
    const methodColors = {
      freqshift: '#FF1744', // Bright red
      hapticgen: '#00E676', // Bright green
      percept: '#2196F3',   // Bright blue
      pitchmatch: '#9C27B0' // Bright purple
    };

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add category background bands
    const categoryRanges = [
      { start: 0, end: 9, name: 'Animals' },
      { start: 10, end: 19, name: 'Natural Soundscapes' },
      { start: 20, end: 29, name: 'Human Non-Speech' },
      { start: 30, end: 39, name: 'Interior/Domestic' },
      { start: 40, end: 49, name: 'Exterior/Urban' }
    ];

    categoryRanges.forEach((range, i) => {
      const bandColor = i % 2 === 0 ? 'rgba(240, 240, 240, 0.3)' : 'rgba(250, 250, 250, 0.3)';
      
      g.append("rect")
        .attr("x", xScale(range.start))
        .attr("y", 0)
        .attr("width", xScale(range.end) - xScale(range.start))
        .attr("height", chartHeight)
        .attr("fill", bandColor)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1);

      // Add category labels
      g.append("text")
        .attr("x", (xScale(range.start) + xScale(range.end)) / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#666")
        .text(range.name);
    });

    // Create line generator
    const line = d3.line<any>()
      .x(d => xScale(d.class))
      .y(d => yScale(d.rating))
      .curve(d3.curveMonotoneX);

    // Draw lines for each method
    methods.forEach(method => {
      const methodData = lineData.map(d => ({
        class: d.class,
        rating: d[method],
        category: d.category
      }));

      // Main line
      g.append("path")
        .datum(methodData)
        .attr("fill", "none")
        .attr("stroke", methodColors[method as keyof typeof methodColors])
        .attr("stroke-width", selectedAlgorithm === method ? 5 : (hoveredMethod === method ? 4 : 2))
        .attr("stroke-opacity", selectedAlgorithm === method ? 1 : (hoveredMethod && hoveredMethod !== method ? 0.3 : 1))
        .attr("d", line)
        .style("cursor", "pointer")
        .on("mouseover", function(event) {
          setHoveredMethod(method);
          d3.select(this).attr("stroke-width", 4);
          
          // Get mouse position relative to SVG
          const mousePos = d3.pointer(event);
          
          // Show method info tooltip
          const tooltip = svg.append("g")
            .attr("class", "method-tooltip")
            .attr("transform", `translate(${mousePos[0] + 10}, ${mousePos[1] - 20})`);
          
          tooltip.append("rect")
            .attr("width", 150)
            .attr("height", 40)
            .attr("fill", "white")
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1)
            .attr("rx", 3)
            .attr("ry", 3)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
          
          tooltip.append("text")
            .attr("x", 10)
            .attr("y", 15)
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", methodColors[method as keyof typeof methodColors])
            .text(method);
          
          tooltip.append("text")
            .attr("x", 10)
            .attr("y", 30)
            .style("font-size", "11px")
            .style("fill", "#666")
            .text("Click to select algorithm");
        })
        .on("mouseout", function() {
          setHoveredMethod(null);
          d3.select(this).attr("stroke-width", 2);
          svg.selectAll(".method-tooltip").remove();
        })
        .on("click", function() {
          setSelectedAlgorithm(selectedAlgorithm === method ? '' : method);
        });

      // Add data points
      g.selectAll(`.point-${method}`)
        .data(methodData)
        .enter()
        .append("circle")
        .attr("class", `point-${method}`)
        .attr("cx", d => xScale(d.class))
        .attr("cy", d => yScale(d.rating))
        .attr("r", selectedAlgorithm === method ? 5 : 3)
        .attr("fill", methodColors[method as keyof typeof methodColors])
        .attr("stroke", "#fff")
        .attr("stroke-width", selectedAlgorithm === method ? 2 : 1)
        .style("cursor", "pointer")
                 .on("mouseover", function(event, d) {
           d3.select(this).attr("r", 6);
           
           // Get specific category name
           const specificName = getSpecificCategoryName(d.class);
           const categoryGroup = getCategoryForClass(d.class);
           
           // Get mouse position relative to SVG
           const mousePos = d3.pointer(event);
           
           // Remove any existing tooltips first
           svg.selectAll(".tooltip").remove();
           
           // Show clean tooltip
           const tooltip = svg.append("g")
             .attr("class", "tooltip")
             .attr("transform", `translate(${mousePos[0] + 10}, ${mousePos[1] - 30})`);
           
           // Tooltip background
           tooltip.append("rect")
             .attr("width", 200)
             .attr("height", 60)
             .attr("fill", "white")
             .attr("stroke", "#ddd")
             .attr("stroke-width", 1)
             .attr("rx", 5)
             .attr("ry", 5)
             .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
           
           // Method name
           tooltip.append("text")
             .attr("x", 10)
             .attr("y", 15)
             .style("font-size", "12px")
             .style("font-weight", "bold")
             .style("fill", methodColors[method as keyof typeof methodColors])
             .text(method);
           
           // Rating value
           tooltip.append("text")
             .attr("x", 10)
             .attr("y", 30)
             .style("font-size", "11px")
             .style("fill", "#333")
             .text(`Rating: ${d.rating.toFixed(1)}`);
           
           // Specific category name
           tooltip.append("text")
             .attr("x", 10)
             .attr("y", 45)
             .style("font-size", "11px")
             .style("fill", "#666")
             .text(`${specificName} (${categoryGroup})`);
           
           // Class number
           tooltip.append("text")
             .attr("x", 10)
             .attr("y", 55)
             .style("font-size", "10px")
             .style("fill", "#999")
             .text(`Class ${d.class}`);
         })
                 .on("mouseout", function() {
           d3.select(this).attr("r", 3);
           svg.selectAll(".tooltip").remove();
         })
        .on("click", function(event, d) {
          // Toggle between class selection and algorithm selection
          if (event.shiftKey) {
            // Shift+click for class selection (existing behavior)
            setSelectedClass(selectedClass === d.class ? null : d.class);
          } else {
            // Regular click for algorithm selection
            setSelectedAlgorithm(selectedAlgorithm === method ? '' : method);
          }
        });
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 49])
      .tickFormat(d => d.toString());

    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#555");

    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#555");

    // Add axis labels
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + 60)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text("ESC-50 Classes (0-49)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text("Average Rating");

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Vibration Method Performance Across Classes");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

    // Method name mapping for display
    const methodDisplayNames = {
      'freqshift': 'Frequency Shift',
      'hapticgen': 'HapticGen', 
      'percept': 'Perceptual Mapping',
      'pitchmatch': 'Pitch Match'
    };

    methods.forEach((method, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 20)
        .attr("y2", 0)
        .attr("stroke", methodColors[method as keyof typeof methodColors])
        .attr("stroke-width", 3);

      legendItem.append("text")
        .attr("x", 25)
        .attr("y", 4)
        .style("font-size", "12px")
        .style("font-weight", selectedAlgorithm === method ? "700" : "500")
        .style("fill", selectedAlgorithm === method ? methodColors[method as keyof typeof methodColors] : "#333")
        .style("cursor", "pointer")
        .text(methodDisplayNames[method as keyof typeof methodDisplayNames])
        .on("click", () => {
          setSelectedAlgorithm(selectedAlgorithm === method ? '' : method);
        });
    });
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [ratings, hoveredMethod, selectedClass, selectedAlgorithm]);

  return (
    <div className="overview-chart">
      {/* Side-by-side layout for Sunburst and Line Chart */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start',
        height: '500px',
        marginBottom: '40px'
      }}>
        {/* Hierarchical Sunburst chart - Left side */}
        <div style={{ 
          flex: '0 0 500px', 
          height: '500px',
          minWidth: '500px'
        }}>
          <HierarchicalSunburst onDetailView={(data) => setDetailViewData(data)} />
      </div>
      
        {/* New line chart - Right side */}
        <div style={{ 
          flex: '1', 
          height: '500px', 
          overflow: 'auto',
          minWidth: '600px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <svg ref={lineChartRef} width="100%" height="500" />
          {(!ratings || ratings.length === 0) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#666'
            }}>
              <p>Loading line chart data...</p>
              <p>Ratings: {ratings?.length || 0}</p>
            </div>
          )}
      </div>
      </div>
      
      {/* Algorithm Performance Sunburst - New section */}
      <div style={{ 
        marginTop: '40px',
        marginBottom: '40px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🏆 Algorithm Performance Analysis
        </h2>
        <p style={{
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '16px',
          color: '#6b7280',
          maxWidth: '800px',
          margin: '0 auto 30px auto'
        }}>
          Explore which algorithms perform best across different sound categories. 
          Segment sizes represent winning percentages, with ties counted for both algorithms.
        </p>
        <AlgorithmPerformanceSunburst 
          onDetailView={(data) => setDetailViewData(data)} 
          selectedAlgorithm={selectedAlgorithm}
        />
      </div>
      
      {/* Detailed View Button */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <button
          onClick={onNavigateToFiltered}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          🔍 Explore Detailed View
        </button>
      </div>
      
      <div className="chart-stats" style={{
        marginTop: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Total Audio Files:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.audioFile)).size : summary.uniqueAudioFiles}</p>
        <p><strong>Total Ratings:</strong> {ratings.length > 0 ? ratings.length : summary.totalEntries}</p>
        <p><strong>Vibration Methods:</strong> {summary.designs.map(d => ({
          'freqshift': 'Frequency Shift',
          'hapticgen': 'HapticGen', 
          'percept': 'Perceptual Mapping',
          'pitchmatch': 'Pitch Match'
        })[d]).join(', ')}</p>
        <p><strong>Categories:</strong> Animals, Natural Soundscapes, Human Non-Speech, Interior/Domestic, Exterior/Urban</p>
        <p><strong>Classes:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.category)).size : summary.uniqueCategories}</p>
        {selectedClass !== null && (
          <p><strong>Selected Class:</strong> {selectedClass} ({getCategoryForClass(selectedClass)})</p>
        )}
      </div>
      
      {/* Detail View Modal */}
      {detailViewData && (
        <DetailView 
          data={detailViewData} 
          onClose={() => setDetailViewData(null)}
          onNavigateToFiltered={onNavigateToFiltered}
        />
      )}
    </div>
  );
};

export default OverviewChart; 