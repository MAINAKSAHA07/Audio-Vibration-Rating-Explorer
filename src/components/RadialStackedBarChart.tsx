import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { RatingData } from '../utils/api';
import { getUniqueClasses, getClassStats } from '../utils/dataHelpers';

interface RadialStackedBarChartProps {
  data: RatingData[];
  onClassSelect?: (classCode: string) => void;
}

interface StackedData {
  classCode: string;
  designs: {
    design: string;
    rating: number;
  }[];
}

const RadialStackedBarChart: React.FC<RadialStackedBarChartProps> = ({
  data,
  onClassSelect
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 100;

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Prepare data
    const classes = getUniqueClasses(data);
    const designs = ['freqshift', 'hapticgen', 'percept', 'pitchmatch'];
    
    const stackedData: StackedData[] = classes.map(classCode => {
      const classData = getClassStats(data, classCode);
      return {
        classCode,
        designs: designs.map(design => {
          const designData = classData.designs.find(d => d.design === design);
          return {
            design,
            rating: designData ? designData.averageRating : 0
          };
        })
      };
    });

    // Create scales
    const angleScale = d3.scalePoint()
      .domain(classes)
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => 
        d.designs.reduce((sum: number, design: any) => sum + design.rating, 0)
      ) || 100])
      .range([0, radius]);

    const colorScale = d3.scaleOrdinal<string, string>()
      .domain(designs)
      .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']);

    // Create arc generator
    const arc = d3.arc<d3.PieArcDatum<any>>()
      .innerRadius((d, i) => {
        const prevSum = d.data.designs
          .slice(0, i)
          .reduce((sum: number, design: any) => sum + design.rating, 0);
        return radiusScale(prevSum);
      })
      .outerRadius((d, i) => {
        const sum = d.data.designs
          .slice(0, i + 1)
          .reduce((total: number, design: any) => total + design.rating, 0);
        return radiusScale(sum);
      })
      .startAngle((d, i) => {
        const angle = angleScale(d.data.classCode);
        return angle ? angle - 0.3 : 0;
      })
      .endAngle((d, i) => {
        const angle = angleScale(d.data.classCode);
        return angle ? angle + 0.3 : 0;
      });

    // Create stacked arcs for each class
    stackedData.forEach((classData, classIndex) => {
      const angle = angleScale(classData.classCode);
      if (angle === undefined) return;

      // Draw stacked arcs for this class
      classData.designs.forEach((design, designIndex) => {
        const prevSum = classData.designs
          .slice(0, designIndex)
          .reduce((sum: number, d: any) => sum + d.rating, 0);
        
        const currentSum = classData.designs
          .slice(0, designIndex + 1)
          .reduce((sum: number, d: any) => sum + d.rating, 0);

        const innerRadius = radiusScale(prevSum);
        const outerRadius = radiusScale(currentSum);
        const startAngle = angle - 0.3;
        const endAngle = angle + 0.3;

        // Create arc path manually
        const arcPath = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(startAngle)
          .endAngle(endAngle);

        const segment = g.append("path")
          .attr("d", arcPath({} as any))
          .attr("fill", colorScale(design.design))
          .attr("stroke", "#fff")
          .attr("stroke-width", 1)
          .attr("opacity", 0.8)
          .attr("class", `segment-${classData.classCode}-${design.design}`)
          .on("mouseover", function(event) {
            d3.select(this)
              .attr("opacity", 1)
              .attr("stroke-width", 3)
              .style("cursor", "pointer");
            
            setHoveredSegment(`Class ${classData.classCode} - ${design.design.charAt(0).toUpperCase() + design.design.slice(1)}: ${design.rating.toFixed(1)}`);
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("opacity", 0.8)
              .attr("stroke-width", 1);
            
            setHoveredSegment(null);
          })
          .on("click", () => {
            setSelectedClass(classData.classCode);
            if (onClassSelect) {
              onClassSelect(classData.classCode);
            }
          });

        // Add animation on load
        segment
          .attr("opacity", 0)
          .transition()
          .duration(500)
          .delay(designIndex * 100 + classIndex * 200)
          .attr("opacity", 0.8);
      });

      // Add class label with interaction
      const classLabel = g.append("text")
        .attr("x", (radius + 40) * Math.cos(angle))
        .attr("y", (radius + 40) * Math.sin(angle))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", selectedClass === classData.classCode ? "#e74c3c" : "#2c3e50")
        .style("cursor", "pointer")
        .text(`Class ${classData.classCode}`)
        .on("mouseover", function() {
          d3.select(this)
            .style("font-size", "13px")
            .style("font-weight", "700");
        })
        .on("mouseout", function() {
          d3.select(this)
            .style("font-size", "11px")
            .style("font-weight", "600");
        })
        .on("click", () => {
          setSelectedClass(classData.classCode);
          if (onClassSelect) {
            onClassSelect(classData.classCode);
          }
        });

      // Add total rating label with enhanced styling
      const totalRating = classData.designs.reduce((sum, design) => sum + design.rating, 0);
      g.append("text")
        .attr("x", (radius + 70) * Math.cos(angle))
        .attr("y", (radius + 70) * Math.sin(angle))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "9px")
        .style("font-weight", "500")
        .style("fill", selectedClass === classData.classCode ? "#e74c3c" : "#666")
        .text(`Total: ${totalRating.toFixed(1)}`);
    });

    // Add interactive legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, 50)`);

    designs.forEach((design, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`)
        .style("cursor", "pointer")
        .on("mouseover", function() {
          d3.select(this).select("rect")
            .attr("stroke-width", 2)
            .attr("stroke", "#333");
          d3.select(this).select("text")
            .style("font-weight", "700");
        })
        .on("mouseout", function() {
          d3.select(this).select("rect")
            .attr("stroke-width", 1)
            .attr("stroke", "#fff");
          d3.select(this).select("text")
            .style("font-weight", "500");
        });

      legendItem.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(design))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("rx", 2);

      legendItem.append("text")
        .attr("x", 25)
        .attr("y", 12)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .style("fill", "#333")
        .text(design.charAt(0).toUpperCase() + design.slice(1));
    });

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .style("fill", "#2c3e50")
      .text("Radial Stacked Bar Chart - Design Ratings by Class");

    // Add description
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text("Each arc represents a class, with stacked segments showing design ratings");

  }, [data, onClassSelect]);

  return (
    <div className="radial-stacked-chart" style={{ position: 'relative' }}>
      <svg ref={svgRef} width="800" height="600" />
      
      {hoveredSegment && (
        <div style={{
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
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>📊 Segment Details</div>
          {hoveredSegment}
        </div>
      )}
      
      {selectedClass && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255,255,255,0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          border: '1px solid #dee2e6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px', color: '#2c3e50' }}>🎯 Selected Class</div>
          <div style={{ color: '#34495e' }}>Class {selectedClass}</div>
        </div>
      )}
    </div>
  );
};

export default RadialStackedBarChart; 