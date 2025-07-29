import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SummaryData } from '../utils/api';

interface OverviewChartProps {
  summary: SummaryData;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ summary }) => {
  const svgRef = useRef<SVGSVGElement>(null);

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
      rating: summary.averageRatings[design]
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

  return (
    <div className="overview-chart">
      <div style={{ width: '100%', height: 400 }}>
        <svg ref={svgRef} width="800" height="400" />
      </div>
      <div className="chart-stats" style={{
        marginTop: '20px',
        padding: '15px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p><strong>Total Audio Files:</strong> {summary.uniqueAudioFiles}</p>
        <p><strong>Total Classes:</strong> {summary.uniqueClasses}</p>
        <p><strong>Total Ratings:</strong> {summary.totalEntries}</p>
      </div>
    </div>
  );
};

export default OverviewChart; 