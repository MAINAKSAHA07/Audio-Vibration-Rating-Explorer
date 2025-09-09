import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SummaryData, RatingData, fetchRatings } from '../utils/api';
import colors from '../colors.js';
// import HierarchicalSunburst from './HierarchicalSunburst';
import AlgorithmPerformanceSunburst from './AlgorithmPerformanceSunburst';
import DetailView from './DetailView';
import { FilterState } from './FilterPanel';

interface OverviewChartProps {
  summary: SummaryData;
  onNavigateToFiltered?: () => void;
  filterState?: FilterState;
  ratings?: RatingData[];
  onAlgorithmSelect?: (algorithm: string) => void;
  onSoundSelect?: (sound: any) => void;
  selectedAlgorithm?: string;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategorySelect?: (subcategory: string) => void;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ 
  summary, 
  onNavigateToFiltered, 
  filterState,
  ratings: externalRatings,
  onAlgorithmSelect,
  onSoundSelect,
  selectedAlgorithm: externalSelectedAlgorithm,
  selectedCategory: externalSelectedCategory,
  onCategorySelect,
  selectedSubcategory: externalSelectedSubcategory,
  onSubcategorySelect
}) => {
  const lineChartRef = useRef<SVGSVGElement>(null);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [selectedPoint, setSelectedPoint] = useState<{algorithm: string, class: number, category: string, subcategory: string} | null>(null);
  const [detailViewData, setDetailViewData] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Use external ratings if provided, otherwise fetch them
  useEffect(() => {
    if (externalRatings && externalRatings.length > 0) {
      setRatings(externalRatings);
    } else {
      const loadRatings = async () => {
        try {
          const data = await fetchRatings();
          setRatings(data);
        } catch (error) {
          console.error('Error loading ratings for line chart:', error);
        }
      };
      loadRatings();
    }
  }, [externalRatings]);

  // Sync selectedAlgorithm with filterState
  useEffect(() => {
    if (filterState?.algorithms && filterState.algorithms.length === 1) {
      setSelectedAlgorithm(filterState.algorithms[0]);
    } else if (!filterState?.algorithms || filterState.algorithms.length === 0) {
      setSelectedAlgorithm('');
    }
  }, [filterState?.algorithms]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter ratings based on algorithm selection
  const filteredRatings = React.useMemo(() => {
    if (!filterState || !filterState.algorithms || filterState.algorithms.length === 0) {
      return ratings;
    }

    // If algorithms are selected, filter to only show data for those algorithms
    return ratings.filter(rating => filterState.algorithms.includes(rating.design));
  }, [ratings, filterState]);

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
      if (!lineChartRef.current || !filteredRatings || filteredRatings.length === 0) {
        console.log('Line chart: waiting for data or ref', { ratingsLength: filteredRatings?.length });
        return;
      }

    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();

      // Get the container width for responsive design
      const containerWidth = lineChartRef.current.parentElement?.clientWidth || 800;
      const width = Math.max(Math.min(containerWidth - 40, 1200), 800); // Max width of 1200px, min 800px
      
      console.log('Line chart rendering:', { containerWidth, width, ratingsCount: filteredRatings.length });
    const height = 500;
    const margin = { top: 120, right: 50, bottom: 80, left: 80 };

    // Set the SVG size
    svg.attr("width", width).attr("height", height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

          // Process data for line chart - Only show winning points for each algorithm
    const methods = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
    
    // Process ratings data to find winning algorithms for each class
    const winningData: { [key: string]: Array<{class: number, rating: number, category: string}> } = {
      freqshift: [],
      hapticgen: [],
      percept: [],
      pitchmatch: []
    };

    // Group ratings by class and audio file to handle individual sounds
    const classAudioGroups = new Map<number, Map<string, RatingData[]>>();
    filteredRatings.forEach(rating => {
      const classNum = parseInt(rating.target);
      const audioFile = rating.audioFile;
      
      if (!classAudioGroups.has(classNum)) {
        classAudioGroups.set(classNum, new Map());
      }
      
      const audioMap = classAudioGroups.get(classNum)!;
      if (!audioMap.has(audioFile)) {
        audioMap.set(audioFile, []);
      }
      
      audioMap.get(audioFile)!.push(rating);
    });

    // For each class, find which algorithm wins for individual sounds
    classAudioGroups.forEach((audioMap, classNum) => {
      // Track which algorithms have won for any sound in this class
      const classWinners = new Set<string>();
      
      // Process each audio file separately
      audioMap.forEach((audioRatings) => {
        // Group by algorithm for this specific audio file
        const algorithmRatings = new Map<string, number[]>();
        audioRatings.forEach(rating => {
          if (!algorithmRatings.has(rating.design)) {
            algorithmRatings.set(rating.design, []);
          }
          algorithmRatings.get(rating.design)!.push(rating.rating);
        });

        // Calculate average rating for each algorithm for this audio file
        const algorithmAverages = new Map<string, number>();
        algorithmRatings.forEach((ratings, algorithm) => {
          algorithmAverages.set(algorithm, d3.mean(ratings) || 0);
        });

        // Find the winning algorithm(s) for this audio file - including ties
        const maxRating = Math.max(...Array.from(algorithmAverages.values()));
        const winners = Array.from(algorithmAverages.entries())
          .filter(([_, rating]) => rating === maxRating)
          .map(([algorithm, _]) => algorithm);

        // Add to class winners
        winners.forEach(winner => {
          if (methods.includes(winner)) {
            classWinners.add(winner);
          }
        });
      });

      // Add points for all algorithms that won for any sound in this class
      classWinners.forEach(winner => {
        // Calculate the overall average rating for this algorithm in this class for display
        const allClassRatings = Array.from(audioMap.values()).flat();
        const algorithmRatings = allClassRatings
          .filter(rating => rating.design === winner)
          .map(rating => rating.rating);
        
        const averageRating = d3.mean(algorithmRatings) || 0;
        
        winningData[winner].push({
          class: classNum,
          rating: averageRating,
          category: getCategoryForClass(classNum)
        });
      });
    });



    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 49])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Color scale for methods - New color scheme
    const methodColors = {
      freqshift: colors(0), // Pink
      hapticgen: colors(1), // Blue
      percept: colors(2),   // Yellow
      pitchmatch: colors(3) // Lavender
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
      const bandColor = i % 2 === 0 ? 'rgba(250, 250, 250, 0.3)' : 'rgba(205, 205, 205, 0.3)';
      
      g.append("rect")
        .attr("x", xScale(range.start))
        .attr("y", 0)
        .attr("width", xScale(range.end) - xScale(range.start))
        .attr("height", chartHeight)
        .attr("fill", bandColor)
        .attr("stroke", "#444")
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

    // Draw lines and points for each method (only winning points)
    methods.forEach(method => {
      const methodData = winningData[method];

      // Sort data by class for proper line drawing
      const sortedData = methodData.sort((a, b) => a.class - b.class);

      // Draw line connecting the points
      if (sortedData.length > 0) {
        g.append("path")
          .datum(sortedData)
          .attr("fill", "none")
          .attr("stroke", methodColors[method as keyof typeof methodColors])
          .attr("stroke-width", 5)
          .attr("stroke-opacity", selectedAlgorithm === method ? 1 : (hoveredMethod && hoveredMethod !== method ? 0.3 : 0.8))
          .attr("d", line)
          .style("cursor", "pointer")
          .on("mouseover", function(event) {
            setHoveredMethod(method);
            d3.select(this).attr("stroke-width", 6);
            d3.select(this).attr("stroke-opacity", 1);
          })
          .on("mouseout", function() {
            setHoveredMethod(null);
            d3.select(this).attr("stroke-width", 5);
            d3.select(this).attr("stroke-opacity", selectedAlgorithm === method ? 1 : (hoveredMethod && hoveredMethod !== method ? 0.3 : 0.8));
          })
          .on("click", function() {
            const newAlgorithm = selectedAlgorithm === method ? '' : method;
            setSelectedAlgorithm(newAlgorithm);
            if (onAlgorithmSelect) {
              onAlgorithmSelect(newAlgorithm);
            }
          });
      }

      // Add data points for winning algorithm
      g.selectAll(`.point-${method}`)
        .data(methodData)
        .enter()
        .append("circle")
        .attr("class", `point-${method}`)
        .attr("cx", (d: any) => xScale(d.class))
        .attr("cy", (d: any) => yScale(d.rating))
        .attr("r", selectedAlgorithm === method ? 5 : 3)
        .attr("fill", methodColors[method as keyof typeof methodColors])
        .attr("stroke", "#fff")
        .attr("stroke-width", selectedAlgorithm === method ? 2 : 1)
        .style("cursor", "pointer")
                 .on("mouseover", function(event, d: any) {
           d3.select(this).attr("r", 7);
           setHoveredMethod(method);
           
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
             .attr("width", 220)
             .attr("height", 80)
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
             .text(`Avg Rating: ${d.rating.toFixed(1)}`);
           
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
             .attr("y", 60)
             .style("font-size", "10px")
             .style("fill", "#999")
             .text(`Class ${d.class}`);
           
           // Additional info
           tooltip.append("text")
             .attr("x", 10)
             .attr("y", 75)
             .style("font-size", "9px")
             .style("fill", "#666")
             .text("Wins for individual sounds");
         })
                 .on("mouseout", function() {
           d3.select(this).attr("r", selectedAlgorithm === method ? 5 : 3);
           setHoveredMethod(null);
           svg.selectAll(".tooltip").remove();
         })
        .on("click", function(event, d: any) {
          // Toggle between class selection and algorithm selection
          if (event.shiftKey) {
            // Shift+click for class selection (existing behavior)
            setSelectedClass(selectedClass === d.class ? null : d.class);
          } else {
            // Regular click for algorithm selection
            const newSelectedPoint = {
              algorithm: method,
              class: d.class,
              category: d.category,
              subcategory: getSpecificCategoryName(d.class)
            };
            
            // Toggle point selection
            if (selectedPoint && 
                selectedPoint.algorithm === newSelectedPoint.algorithm && 
                selectedPoint.class === newSelectedPoint.class) {
              setSelectedPoint(null);
              const newAlgorithm = '';
              setSelectedAlgorithm(newAlgorithm);
              if (onAlgorithmSelect) {
                onAlgorithmSelect(newAlgorithm);
              }
            } else {
              setSelectedPoint(newSelectedPoint);
              const newAlgorithm = method;
              setSelectedAlgorithm(newAlgorithm);
              if (onAlgorithmSelect) {
                onAlgorithmSelect(newAlgorithm);
              }
            }
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
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Algorithm Wins Across Classes");
    
    // Add subtitle
    {/*svg.append("text")
      .attr("x", width / 2)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "400")
      .style("fill", "#666")
      .text("Lines connect winning points for each algorithm across classes");*/}

    // Add legend above the chart
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, 65)`);

    // Method name mapping for display
    const methodDisplayNames = {
      'freqshift': 'Frequency Shifting',
      'hapticgen': 'HapticGen', 
      'percept': 'Perception-Level Mapping',
      'pitchmatch': 'Pitch Matching'
    };

    // Calculate spacing for horizontal legend - better distribution
    const legendItemWidth = chartWidth / methods.length;
    const legendLineLength = 40;
    const legendLineStart = -legendLineLength / 2;
    const legendLineEnd = legendLineLength / 2;
    
    methods.forEach((method, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${i * legendItemWidth + legendItemWidth/2}, 0)`);

      // Create a group for the entire legend item to handle hover effects
      const legendGroup = legendItem.append("g")
        .style("cursor", "pointer")
        .on("mouseover", function() {
          setHoveredMethod(method);
          // Highlight the line
          legendItem.select("line")
            .attr("stroke-width", 6)
            .attr("stroke-opacity", 1);
          // Highlight the text
          legendItem.select("text")
            .style("font-weight", "600")
            .style("fill", methodColors[method as keyof typeof methodColors]);
        })
        .on("mouseout", function() {
          setHoveredMethod(null);
          // Reset the line
          legendItem.select("line")
            .attr("stroke-width", 5)
            .attr("stroke-opacity", 0.8);
          // Reset the text
          legendItem.select("text")
            .style("font-weight", "500")
            .style("fill", "rgb(51, 51, 51)");
        })
        .on("click", () => {
          const newAlgorithm = selectedAlgorithm === method ? '' : method;
          setSelectedAlgorithm(newAlgorithm);
          if (onAlgorithmSelect) {
            onAlgorithmSelect(newAlgorithm);
          }
        });

      legendGroup.append("line")
        .attr("x1", legendLineStart)
        .attr("y1", 0)
        .attr("x2", legendLineEnd)
        .attr("y2", 0)
        .attr("stroke", methodColors[method as keyof typeof methodColors])
        .attr("stroke-width", 5)
        .attr("stroke-opacity", 0.8);

      legendGroup.append("text")
        .attr("x", 0)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "500")
        .style("fill", "rgb(51, 51, 51)")
        .text(methodDisplayNames[method as keyof typeof methodDisplayNames]);
    });
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
      }, [filteredRatings, hoveredMethod, selectedClass, selectedAlgorithm, windowWidth]);

  return (
    <div className="overview-chart">
      {/* Side-by-side layout for Sunburst and Line Chart */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start',
        height: '500px',
        marginBottom: '40px',
        width: '100%',
        minWidth: windowWidth > 1600 ? '1400px' : '1200px',
        overflowX: 'auto'
      }}>
        {/* Algorithm Performance Sunburst chart - Left side */}
        <div style={{ 
          flex: '0 0 500px', 
          height: '500px',
          minWidth: '500px'
        }}>
          <AlgorithmPerformanceSunburst 
            onDetailView={(data) => setDetailViewData(data)} 
            onSoundSelect={onSoundSelect}
            selectedAlgorithm={externalSelectedAlgorithm || selectedAlgorithm}
            selectedPoint={selectedPoint}
            hoveredMethod={hoveredMethod}
            ratings={ratings}
            onAlgorithmSelect={onAlgorithmSelect}
            onCategorySelect={onCategorySelect}
            onSubcategorySelect={onSubcategorySelect}
          />
      </div>
      
        {/* New line chart - Right side */}
        <div style={{ 
          flex: '1', 
          height: '500px', 
          overflow: 'auto',
          minWidth: windowWidth > 1600 ? '800px' : '700px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '8px',
          position: 'relative',
          width: '100%'
        }}>
          <svg ref={lineChartRef} width="100%" height="500" style={{ maxWidth: '100%' }} />
          {(!filteredRatings || filteredRatings.length === 0) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#666'
            }}>
              <p>Loading line chart data...</p>
              <p>Ratings: {filteredRatings?.length || 0}</p>
            </div>
          )}
      </div>
      </div>
      

      
      {/* Detailed View Button 
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
      </div>*/}
      
      {/* <div className="chart-stats" style={{
        marginTop: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Chart Type:</strong> Algorithm Wins with Connected Lines</p>
        <p><strong>Total Audio Files:</strong> {filteredRatings.length > 0 ? new Set(filteredRatings.map(r => r.audioFile)).size : summary.uniqueAudioFiles}</p>
        <p><strong>Total Ratings:</strong> {filteredRatings.length > 0 ? filteredRatings.length : summary.totalEntries}</p>
        <p><strong>Vibration Methods:</strong> {summary.designs.map(d => ({
          'freqshift': 'Frequency Shift',
          'hapticgen': 'HapticGen', 
          'percept': 'Perceptual Mapping',
          'pitchmatch': 'Pitch Match'
        })[d]).join(', ')}</p>
        <p><strong>Categories:</strong> Animals, Natural Soundscapes, Human Non-Speech, Interior/Domestic, Exterior/Urban</p>
        <p><strong>Classes:</strong> {filteredRatings.length > 0 ? new Set(filteredRatings.map(r => r.category)).size : summary.uniqueCategories}</p>
        {selectedClass !== null && (
          <p><strong>Selected Class:</strong> {selectedClass} ({getCategoryForClass(selectedClass)})</p>
        )}
      </div> */}
      
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