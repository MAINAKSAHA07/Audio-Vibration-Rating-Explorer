import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SummaryData, RatingData, fetchRatings } from '../utils/api';

interface OverviewChartProps {
  summary: SummaryData;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ summary }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineChartRef = useRef<SVGSVGElement>(null);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

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

  // Original bar chart
  useEffect(() => {
    if (!svgRef.current || !summary) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 60, right: 80, bottom: 80, left: 80 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Prepare data
    const chartData = summary.designs.map(design => ({
      design: design.charAt(0).toUpperCase() + design.slice(1),
      rating: summary.averageRatings.byDesign[design]
    }));

    // Create scales
    const xScale = d3.scaleBand()
      .domain(chartData.map(d => d.design))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.rating) || 100])
      .range([chartHeight, 0]);

    // Create vibrant color scale
    const colorScale = d3.scaleOrdinal<string, string>()
      .domain(chartData.map(d => d.design))
      .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create vibrant box plots
    chartData.forEach((d, i) => {
      const x = xScale(d.design);
      const y = yScale(d.rating);
      const boxWidth = xScale.bandwidth();
      const boxHeight = chartHeight - y;

      if (x !== undefined) {
        // Main box with vibrant color
        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", boxWidth)
          .attr("height", boxHeight)
          .attr("fill", colorScale(d.design))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("rx", 8)
          .attr("ry", 8)
          .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))")
          .on("mouseover", function() {
            d3.select(this)
              .attr("stroke-width", 3)
              .style("filter", "drop-shadow(0 6px 12px rgba(0,0,0,0.3))");
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke-width", 2)
              .style("filter", "drop-shadow(0 4px 8px rgba(0,0,0,0.2))");
          });

        // Add gradient overlay for more vibrancy
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
          .attr("id", `gradient-${i}`)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");

        const baseColor = colorScale(d.design) as string;
        const brighterColor = d3.color(baseColor)?.brighter(0.3)?.toString() || baseColor;

        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", brighterColor);

        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", baseColor);

        // Add value label
        g.append("text")
          .attr("x", x + boxWidth / 2)
          .attr("y", y - 10)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("font-weight", "600")
          .style("fill", "#2c3e50")
          .text(d.rating.toFixed(1) as string);
      }
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#555")
      .style("text-anchor", "middle")
      .attr("dy", "0.5em");

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
      .text("Vibration Designs");

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
      .style("font-size", "20px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Vibrant Color Box Plot - Average Ratings by Design");

  }, [summary]);

  // New line chart with hierarchical connections
  useEffect(() => {
    if (!lineChartRef.current || !ratings || ratings.length === 0) return;

    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 500;
    const margin = { top: 80, right: 120, bottom: 100, left: 80 };

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

    // Color scale for methods
    const methodColors = {
      freqshift: '#FF6B6B',
      hapticgen: '#4ECDC4', 
      percept: '#45B7D1',
      pitchmatch: '#96CEB4'
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
        .attr("stroke-width", hoveredMethod === method ? 4 : 2)
        .attr("stroke-opacity", hoveredMethod && hoveredMethod !== method ? 0.3 : 1)
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
            .text("Hover over points for details");
        })
        .on("mouseout", function() {
          setHoveredMethod(null);
          d3.select(this).attr("stroke-width", 2);
          svg.selectAll(".method-tooltip").remove();
        });

      // Add data points
      g.selectAll(`.point-${method}`)
        .data(methodData)
        .enter()
        .append("circle")
        .attr("class", `point-${method}`)
        .attr("cx", d => xScale(d.class))
        .attr("cy", d => yScale(d.rating))
        .attr("r", 3)
        .attr("fill", methodColors[method as keyof typeof methodColors])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
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
          setSelectedClass(selectedClass === d.class ? null : d.class);
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
      .style("font-size", "20px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Overview Statistics - Vibration Method Performance Across Classes");

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

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
        .style("font-weight", "500")
        .style("fill", "#333")
        .text(method);
    });

  }, [ratings, hoveredMethod, selectedClass]);

  return (
    <div className="overview-chart">
      {/* Original bar chart */}
      <div style={{ width: '100%', height: 400, marginBottom: '40px' }}>
        <svg ref={svgRef} width="800" height="400" />
      </div>
      
      {/* New line chart */}
      <div style={{ width: '100%', height: 500 }}>
        <svg ref={lineChartRef} width="1200" height="500" />
      </div>
      
      <div className="chart-stats" style={{
        marginTop: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Total Audio Files:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.audioFile)).size : summary.uniqueAudioFiles}</p>
        <p><strong>Total ESC-50 Classes:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.target)).size : summary.uniqueClasses}</p>
        <p><strong>Total Ratings:</strong> {ratings.length > 0 ? ratings.length : summary.totalEntries}</p>
        <p><strong>Vibration Methods:</strong> {summary.designs.join(', ')}</p>
        <p><strong>Data Classes:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.class)).size : 0} (A, B, C, etc.)</p>
        <p><strong>Categories:</strong> {ratings.length > 0 ? new Set(ratings.map(r => r.category)).size : summary.uniqueCategories}</p>
        {selectedClass !== null && (
          <p><strong>Selected Class:</strong> {selectedClass} ({getCategoryForClass(selectedClass)})</p>
        )}
      </div>
    </div>
  );
};

export default OverviewChart; 