import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SummaryData, RatingData } from '../utils/api';
import ReactECharts from 'echarts-for-react';

interface DashboardOverviewProps {
  summary: SummaryData;
  ratings: RatingData[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ summary, ratings }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Stop loading when we have data
  useEffect(() => {
    console.log('🔍 Dashboard data check:', { 
      hasSummary: !!summary, 
      hasRatings: !!ratings, 
      ratingsLength: ratings?.length,
      sampleRating: ratings?.[0]
    });
    
    if (summary) {
      console.log('📋 Summary data:', summary);
    }
    
    if (ratings && ratings.length > 0) {
      console.log('📊 Sample ratings:', ratings.slice(0, 3));
    }
    
    // Test D3.js functionality
    console.log('🧪 Testing D3.js:', {
      d3Available: typeof d3 !== 'undefined',
      d3Select: typeof d3?.select === 'function'
    });
    
    setIsLoading(!(summary && ratings && ratings.length > 0));
  }, [summary, ratings]);

  // Refs for each chart
  const categoryPieRef = useRef<SVGSVGElement>(null);
  const ratingHistogramRef = useRef<SVGSVGElement>(null);
  const topBottomPerformersRef = useRef<SVGSVGElement>(null);
  const performanceHeatmapRef = useRef<SVGSVGElement>(null);
  const ratingVsFrequencyRef = useRef<SVGSVGElement>(null);
  const designCorrelationsRef = useRef<SVGSVGElement>(null);

  // Container refs for responsive sizing
  const categoryPieContainerRef = useRef<HTMLDivElement>(null);
  const ratingHistogramContainerRef = useRef<HTMLDivElement>(null);
  const topBottomPerformersContainerRef = useRef<HTMLDivElement>(null);
  const performanceHeatmapContainerRef = useRef<HTMLDivElement>(null);
  const ratingVsFrequencyContainerRef = useRef<HTMLDivElement>(null);
  const designCorrelationsContainerRef = useRef<HTMLDivElement>(null);

  // Sunburst chart configuration
  const sunburstOption = {
    backgroundColor: "#ffffff",
    tooltip: { 
      trigger: "item", 
      formatter: "{b}" 
    },
    series: [
      {
        type: "sunburst",
        radius: [0, "90%"],
        sort: null,
        emphasis: { focus: "ancestor" },
        levels: [
          {}, 
          {
            r0: "20%",
            r: "45%",
            label: { show: false }, 
            itemStyle: { borderWidth: 2, borderColor: "#ffffff" }
          },
          {
            r0: "50%",
            r: "88%",
            label: { show: false }, 
            emphasis: { label: { show: true, color: "#0f172a" } },
            itemStyle: { borderWidth: 2, borderColor: "#ffffff" }
          }
        ],
        data: [
          {
            name: "Animals",
            itemStyle: { color: "#22c55e" },
            children: [
              { name: "dog", value: 1 },
              { name: "rooster", value: 1 },
              { name: "pig", value: 1 },
              { name: "cow", value: 1 },
              { name: "frog", value: 1 },
              { name: "cat", value: 1 },
              { name: "hen", value: 1 },
              { name: "insects", value: 1 },
              { name: "sheep", value: 1 },
              { name: "crow", value: 1 }
            ]
          },
          {
            name: "Natural soundscapes & water",
            itemStyle: { color: "#3b82f6" },
            children: [
              { name: "rain", value: 1 },
              { name: "sea_waves", value: 1 },
              { name: "crackling_fire", value: 1 },
              { name: "crickets", value: 1 },
              { name: "chirping_birds", value: 1 },
              { name: "water_drops", value: 1 },
              { name: "wind", value: 1 },
              { name: "pouring_water", value: 1 },
              { name: "toilet_flush", value: 1 },
              { name: "thunderstorm", value: 1 }
            ]
          },
          {
            name: "Human, non-speech",
            itemStyle: { color: "#a855f7" },
            children: [
              { name: "crying_baby", value: 1 },
              { name: "sneezing", value: 1 },
              { name: "clapping", value: 1 },
              { name: "breathing", value: 1 },
              { name: "coughing", value: 1 },
              { name: "footsteps", value: 1 },
              { name: "laughing", value: 1 },
              { name: "brushing_teeth", value: 1 },
              { name: "snoring", value: 1 },
              { name: "drinking_sipping", value: 1 }
            ]
          },
          {
            name: "Interior/domestic",
            itemStyle: { color: "#8b5cf6" },
            children: [
              { name: "door_wood_knock", value: 1 },
              { name: "mouse_click", value: 1 },
              { name: "keyboard_typing", value: 1 },
              { name: "door_wood_creaks", value: 1 },
              { name: "can_opening", value: 1 },
              { name: "washing_machine", value: 1 },
              { name: "vacuum_cleaner", value: 1 },
              { name: "clock_alarm", value: 1 },
              { name: "clock_tick", value: 1 },
              { name: "glass_breaking", value: 1 }
            ]
          },
          {
            name: "Exterior/urban",
            itemStyle: { color: "#6366f1" },
            children: [
              { name: "helicopter", value: 1 },
              { name: "chainsaw", value: 1 },
              { name: "siren", value: 1 },
              { name: "car_horn", value: 1 },
              { name: "engine", value: 1 },
              { name: "train", value: 1 },
              { name: "church_bells", value: 1 },
              { name: "airplane", value: 1 },
              { name: "fireworks", value: 1 },
              { name: "hand_saw", value: 1 }
            ]
          }
        ]
      }
    ]
  };

  // State for chart dimensions
  const [chartDimensions, setChartDimensions] = useState({
    width: 500,
    height: 450
  });

  // Function to get responsive dimensions
  const getResponsiveDimensions = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current) return { width: 500, height: 450 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate responsive dimensions with padding
    const width = Math.max(300, containerWidth - 40); // 20px padding on each side
    const height = Math.max(300, containerHeight - 40);
    
    return { width, height };
  };

  // Resize observer for responsive charts
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      // Trigger re-render of all charts when container sizes change
      setChartDimensions(prev => ({ ...prev }));
    });

    // Observe all chart containers
    const containers = [
      categoryPieContainerRef.current,
      ratingHistogramContainerRef.current,
      topBottomPerformersContainerRef.current,
      performanceHeatmapContainerRef.current,
      ratingVsFrequencyContainerRef.current,
      designCorrelationsContainerRef.current
    ].filter(Boolean);

    containers.forEach(container => {
      if (container) resizeObserver.observe(container);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Category Distribution Pie Chart
  useEffect(() => {
    console.log('🍰 Pie chart effect triggered with:', {
      hasRef: !!categoryPieRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!categoryPieRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Pie chart: Missing ref or data');
        return;
      }

    console.log('🍰 Creating pie chart...');

    try {
      console.log('🔍 Pie chart ref check:', {
        hasRef: !!categoryPieRef.current,
        refElement: categoryPieRef.current,
        refTagName: categoryPieRef.current?.tagName
      });
      
      const svg = d3.select(categoryPieRef.current);
      console.log('🔍 D3 selection result:', svg.node());
      
      svg.selectAll('*').remove();
    
      // SVG is working - proceed with chart creation
      console.log('🔍 SVG element ready for pie chart');
      
      const { width, height } = getResponsiveDimensions(categoryPieContainerRef);
      const radius = Math.min(width, height) / 2 - 40;

      svg.attr('width', width).attr('height', height);

      // Process data - aggregate by category
      const categoryData = d3.rollup(ratings, v => v.length, d => d.category);
      const pieData = Array.from(categoryData, ([category, count]) => ({
        category,
        count,
        percentage: (count / ratings.length * 100).toFixed(1)
      }));

      console.log('🥧 Pie data:', pieData);

      if (pieData.length === 0) {
        console.log('❌ No pie data available');
        return;
      }

      const color = d3.scaleOrdinal<string>()
        .domain(pieData.map(d => d.category))
        .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF8C42', '#9370DB', '#20B2AA', '#FF69B4']);

      const pie = d3.pie<typeof pieData[0]>().value(d => d.count);
      const arc = d3.arc<d3.PieArcDatum<typeof pieData[0]>>()
        .innerRadius(0)
        .outerRadius(radius);

      const g = svg.append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);

      // Create slices
      const slices = g.selectAll('path')
        .data(pie(pieData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.category))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mouseover', function() {
          d3.select(this).attr('stroke-width', 4);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 2);
        });
      
      console.log('🍰 Created', slices.size(), 'pie slices');

      // Add percentage labels inside the slices
      g.selectAll('text')
        .data(pie(pieData))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', Math.max(10, radius / 15) + 'px')
        .style('font-weight', 'bold')
        .text(d => `${d.data.percentage}%`);

      // Add legend below the pie chart
      const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - 80})`);

      // Calculate legend layout
      const legendItemWidth = Math.min(160, width / 3);
      const legendItemHeight = 20;
      const itemsPerRow = Math.max(1, Math.floor((width - 40) / legendItemWidth));
      
      legend.selectAll('rect')
        .data(pieData)
        .enter()
        .append('rect')
        .attr('x', (d, i) => (i % itemsPerRow) * legendItemWidth)
        .attr('y', (d, i) => Math.floor(i / itemsPerRow) * legendItemHeight)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => color(d.category));

      legend.selectAll('text')
        .data(pieData)
        .enter()
        .append('text')
        .attr('x', (d, i) => (i % itemsPerRow) * legendItemWidth + 18)
        .attr('y', (d, i) => Math.floor(i / itemsPerRow) * legendItemHeight + 10)
        .style('font-size', Math.max(8, width / 60) + 'px')
        .style('font-weight', '500')
        .style('fill', '#333')
        .text(d => `${d.category} (${d.percentage}%)`);

      console.log('✅ Pie chart rendered');
    } catch (error) {
      console.error('❌ Error creating pie chart:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Rating Distribution Histogram
  useEffect(() => {
    console.log('📊 Histogram effect triggered with:', {
      hasRef: !!ratingHistogramRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!ratingHistogramRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Histogram: Missing ref or data');
        return;
      }

    console.log('📊 Creating histogram...');

    try {
      const svg = d3.select(ratingHistogramRef.current);
      svg.selectAll('*').remove();
    
      // SVG is working - proceed with chart creation
      console.log('🔍 SVG element ready for histogram');

      const { width, height } = getResponsiveDimensions(ratingHistogramContainerRef);
      const margin = { 
        top: Math.max(30, height * 0.1), 
        right: Math.max(20, width * 0.05), 
        bottom: Math.max(40, height * 0.15), 
        left: Math.max(40, width * 0.1) 
      };
      const chartW = width - margin.left - margin.right;
      const chartH = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      // Create bins
      const bins = d3.histogram<RatingData, number>()
        .value(d => d.rating)
        .domain([0, 100])
        .thresholds(d3.range(0, 101, 10))(ratings);

      console.log('📊 Histogram bins:', bins.map(b => ({ x0: b.x0, x1: b.x1, length: b.length })));

      const x = d3.scaleLinear().domain([0, 100]).range([0, chartW]);
      const y = d3.scaleLinear()
        .domain([0, d3.max(bins, b => b.length) || 0])
        .nice()
        .range([chartH, 0]);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create bars
      const bars = g.selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0 || 0))
        .attr('y', d => y(d.length))
        .attr('width', d => x(d.x1 || 0) - x(d.x0 || 0) - 1)
        .attr('height', d => chartH - y(d.length))
        .attr('fill', '#4ECDC4')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8)
        .on('mouseover', function() {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.8);
        });
    
      console.log('📊 Created', bars.size(), 'histogram bars');

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(x));
      g.append('g').call(d3.axisLeft(y));

      // Add labels
      g.append('text')
        .attr('x', chartW/2).attr('y', chartH + margin.bottom - 10)
        .attr('text-anchor','middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, width / 50) + 'px')
        .text('Rating');
      g.append('text')
        .attr('transform','rotate(-90)')
        .attr('x', -chartH/2).attr('y', -margin.left + 10)
        .attr('text-anchor','middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, height / 40) + 'px')
        .text('Frequency');
      svg.append('text')
        .attr('x', width/2).attr('y', margin.top - 10)
        .attr('text-anchor','middle')
        .style('font-weight','600')
        .style('font-size', Math.max(12, width / 40) + 'px')
        .text('Rating Distribution');

      console.log('✅ Histogram rendered');
    } catch (error) {
      console.error('❌ Error creating histogram:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Top & Bottom Performers Bar Chart
  useEffect(() => {
    console.log('🏆 Top/Bottom effect triggered with:', {
      hasRef: !!topBottomPerformersRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!topBottomPerformersRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Top/Bottom: Missing ref or data');
        return;
      }

    console.log('🏆 Creating top/bottom chart...');

    try {
      const svg = d3.select(topBottomPerformersRef.current);
      svg.selectAll('*').remove();
    
      // SVG is working - proceed with chart creation
      console.log('🔍 SVG element ready for top/bottom chart');

      const { width, height } = getResponsiveDimensions(topBottomPerformersContainerRef);
      const margin = { 
        top: Math.max(30, height * 0.1), 
        right: Math.max(20, width * 0.05), 
        bottom: Math.max(60, height * 0.2), 
        left: Math.max(50, width * 0.12) 
      };
      const chartW = width - margin.left - margin.right;
      const chartH = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      // Calculate averages per class
      const classAvgs = d3.rollup(ratings, v => d3.mean(v, d => d.rating) || 0, d => d.class);
      const arr = Array.from(classAvgs, ([cls, val]) => ({ cls, val }))
        .sort((a,b) => b.val - a.val);
    
      console.log('🏆 Class averages:', arr);
    
      const top5 = arr.slice(0, 5);
      const bot5 = arr.slice(-5).reverse();
      const data = [...top5, ...bot5];
    
      if (data.length === 0) {
        console.log('❌ No class data available');
        return;
      }
    
      const x = d3.scaleBand()
        .domain(data.map(d => d.cls))
        .range([0, chartW])
        .padding(0.3);
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.val) || 0])
        .nice()
        .range([chartH, 0]);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create bars
      const bars = g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => x(d.cls) || 0)
        .attr('y', d => y(d.val))
        .attr('width', x.bandwidth())
        .attr('height', d => chartH - y(d.val))
        .attr('fill', d => top5.includes(d) ? '#FF6B6B' : '#4ECDC4')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function() {
          d3.select(this).attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 1);
        });
    
      console.log('🏆 Created', bars.size(), 'top/bottom bars');

      // Add value labels on bars
      g.selectAll('text')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => (x(d.cls) || 0) + x.bandwidth() / 2)
        .attr('y', d => y(d.val) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(8, width / 60) + 'px')
        .style('font-weight', 'bold')
        .text(d => d.val.toFixed(1));

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform','rotate(-45)')
        .attr('text-anchor','end')
        .style('font-size', Math.max(8, width / 80) + 'px');
      g.append('g').call(d3.axisLeft(y));

      // Add labels
      g.append('text')
        .attr('x', chartW/2).attr('y', chartH + margin.bottom - 10)
        .attr('text-anchor','middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, width / 50) + 'px')
        .text('Class Code');
      g.append('text')
        .attr('transform','rotate(-90)')
        .attr('x', -chartH/2).attr('y', -margin.left + 10)
        .attr('text-anchor','middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, height / 40) + 'px')
        .text('Avg Rating');
      svg.append('text')
        .attr('x', width/2).attr('y', margin.top - 10)
        .attr('text-anchor','middle')
        .style('font-weight','600')
        .style('font-size', Math.max(12, width / 40) + 'px')
        .text('Top 5 (red) & Bottom 5 (blue)');

      console.log('✅ Top/Bottom chart rendered');
    } catch (error) {
      console.error('❌ Error creating top/bottom chart:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Performance Heatmap
  useEffect(() => {
    console.log('🔥 Heatmap effect triggered with:', {
      hasRef: !!performanceHeatmapRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!performanceHeatmapRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Heatmap: Missing ref or data');
        return;
      }

    console.log('🔥 Creating heatmap...');

    try {
      const svg = d3.select(performanceHeatmapRef.current);
      svg.selectAll('*').remove();
    
      console.log('🔍 SVG element ready for heatmap');

      const { width, height } = getResponsiveDimensions(performanceHeatmapContainerRef);
      const margin = { 
        top: Math.max(40, height * 0.12), 
        right: Math.max(20, width * 0.05), 
        bottom: Math.max(60, height * 0.2), 
        left: Math.max(50, width * 0.12) 
      };
      const chartW = width - margin.left - margin.right;
      const chartH = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      // Create heatmap data - average ratings by category and design
      const heatmapData = d3.rollup(ratings, 
        v => d3.mean(v, d => d.rating) || 0, 
        d => d.category, 
        d => d.design
      );

      const categories = Array.from(heatmapData.keys());
      const designs = Array.from(heatmapData.get(categories[0])?.keys() || []);

      console.log('🔥 Heatmap data:', { categories, designs, heatmapData });

      // Create color scale
      const colorScale = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateRdYlGn);

      // Create scales
      const xScale = d3.scaleBand()
        .domain(designs)
        .range([0, chartW])
        .padding(0.1);

      const yScale = d3.scaleBand()
        .domain(categories)
        .range([0, chartH])
        .padding(0.1);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create heatmap cells
      g.selectAll('rect')
        .data(categories.flatMap(category => 
          designs.map(design => ({
            category,
            design,
            value: heatmapData.get(category)?.get(design) || 0
          }))
        ))
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.design) || 0)
        .attr('y', d => yScale(d.category) || 0)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke-width', 2);
          // Add tooltip
          svg.append('text')
            .attr('class', 'tooltip')
            .attr('x', event.pageX - 100)
            .attr('y', event.pageY - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', Math.max(10, width / 60) + 'px')
            .style('fill', '#333')
            .text(`${d.category} - ${d.design}: ${d.value.toFixed(1)}`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 1);
          svg.selectAll('.tooltip').remove();
        });

      // Add value labels inside cells
      g.selectAll('text')
        .data(categories.flatMap(category => 
          designs.map(design => ({
            category,
            design,
            value: heatmapData.get(category)?.get(design) || 0
          }))
        ))
        .enter()
        .append('text')
        .attr('x', d => (xScale(d.design) || 0) + xScale.bandwidth() / 2)
        .attr('y', d => (yScale(d.category) || 0) + yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(8, Math.min(xScale.bandwidth(), yScale.bandwidth()) / 8) + 'px')
        .style('font-weight', 'bold')
        .style('fill', d => d.value > 50 ? '#000' : '#fff')
        .text(d => d.value.toFixed(1));

      // Add color legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, ${height - 40})`);

      const legendScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 100]);

      const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format('d'));

      legend.append('g')
        .attr('transform', 'translate(0, 20)')
        .call(legendAxis);

      // Create legend gradient
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'heatmapGradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(0));

      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', colorScale(50));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(100));

      legend.append('rect')
        .attr('width', 100)
        .attr('height', 20)
        .style('fill', 'url(#heatmapGradient)')
        .attr('stroke', '#ccc');

      legend.append('text')
        .attr('x', 50)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(10, width / 60) + 'px')
        .style('font-weight', 'bold')
        .text('Rating');

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .style('font-size', Math.max(8, width / 80) + 'px');

      g.append('g')
        .call(d3.axisLeft(yScale));

      // Add labels
      g.append('text')
        .attr('x', chartW/2).attr('y', chartH + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, width / 50) + 'px')
        .text('Design');
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartH/2).attr('y', -margin.left + 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, height / 40) + 'px')
        .text('Category');

      svg.append('text')
        .attr('x', width/2).attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', '600')
        .style('font-size', Math.max(12, width / 40) + 'px')
        .text('Performance Heatmap');

      console.log('✅ Heatmap rendered');
    } catch (error) {
      console.error('❌ Error creating heatmap:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Rating vs Frequency Scatter Plot
  useEffect(() => {
    console.log('📊 Scatter plot effect triggered with:', {
      hasRef: !!ratingVsFrequencyRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!ratingVsFrequencyRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Scatter plot: Missing ref or data');
        return;
      }

    console.log('📊 Creating scatter plot...');

    try {
      const svg = d3.select(ratingVsFrequencyRef.current);
      svg.selectAll('*').remove();
    
      console.log('🔍 SVG element ready for scatter plot');

      const { width, height } = getResponsiveDimensions(ratingVsFrequencyContainerRef);
      const margin = { 
        top: Math.max(40, height * 0.12), 
        right: Math.max(20, width * 0.05), 
        bottom: Math.max(60, height * 0.2), 
        left: Math.max(50, width * 0.12) 
      };
      const chartW = width - margin.left - margin.right;
      const chartH = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      // Create frequency data by rating bins
      const ratingBins = d3.histogram<RatingData, number>()
        .value(d => d.rating)
        .domain([0, 100])
        .thresholds(d3.range(0, 101, 5))(ratings);

      const scatterData = ratingBins.map(bin => ({
        rating: (bin.x0 || 0) + (bin.x1 || 0) / 2, // center of bin
        frequency: bin.length
      }));

      console.log('📊 Scatter data:', scatterData);

      // Create scales
      const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, chartW]);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.frequency) || 0])
        .nice()
        .range([chartH, 0]);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create scatter points
      g.selectAll('circle')
        .data(scatterData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.rating))
        .attr('cy', d => yScale(d.frequency))
        .attr('r', Math.max(3, width / 100))
        .attr('fill', '#4ECDC4')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', Math.max(4, width / 80)).attr('opacity', 1);
          // Add tooltip
          svg.append('text')
            .attr('class', 'tooltip')
            .attr('x', event.pageX - 100)
            .attr('y', event.pageY - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', Math.max(10, width / 60) + 'px')
            .style('fill', '#333')
            .text(`Rating: ${d.rating.toFixed(1)}, Frequency: ${d.frequency}`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', Math.max(3, width / 100)).attr('opacity', 0.7);
          svg.selectAll('.tooltip').remove();
        });

      // Add value labels near points
      g.selectAll('text')
        .data(scatterData)
        .enter()
        .append('text')
        .attr('x', d => xScale(d.rating))
        .attr('y', d => yScale(d.frequency) - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(7, width / 80) + 'px')
        .style('font-weight', 'bold')
        .style('fill', '#666')
        .text(d => d.frequency.toString());

      // Add trend line
      const line = d3.line<{rating: number, frequency: number}>()
        .x(d => xScale(d.rating))
        .y(d => yScale(d.frequency));

      g.append('path')
        .datum(scatterData)
        .attr('fill', 'none')
        .attr('stroke', '#FF6B6B')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(xScale));

      g.append('g')
        .call(d3.axisLeft(yScale));

      // Add labels
      g.append('text')
        .attr('x', chartW/2).attr('y', chartH + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, width / 50) + 'px')
        .text('Rating');
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartH/2).attr('y', -margin.left + 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, height / 40) + 'px')
        .text('Frequency');

      svg.append('text')
        .attr('x', width/2).attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', '600')
        .style('font-size', Math.max(12, width / 40) + 'px')
        .text('Rating vs Frequency');

      console.log('✅ Scatter plot rendered');
    } catch (error) {
      console.error('❌ Error creating scatter plot:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Design Correlations Matrix
  useEffect(() => {
    console.log('🔗 Correlation matrix effect triggered with:', {
      hasRef: !!designCorrelationsRef.current,
      hasRatings: !!ratings,
      ratingsLength: ratings?.length,
      sampleData: ratings?.slice(0, 3)
    });
    
    // Wait for refs to be ready
    const timer = setTimeout(() => {
      if (!designCorrelationsRef.current || !ratings || ratings.length === 0) {
        console.log('❌ Correlation matrix: Missing ref or data');
        return;
      }

    console.log('🔗 Creating correlation matrix...');

    try {
      const svg = d3.select(designCorrelationsRef.current);
      svg.selectAll('*').remove();
    
      console.log('🔍 SVG element ready for correlation matrix');

      const { width, height } = getResponsiveDimensions(designCorrelationsContainerRef);
      const margin = { 
        top: Math.max(40, height * 0.12), 
        right: Math.max(20, width * 0.05), 
        bottom: Math.max(60, height * 0.2), 
        left: Math.max(50, width * 0.12) 
      };
      const chartW = width - margin.left - margin.right;
      const chartH = height - margin.top - margin.bottom;

      svg.attr('width', width).attr('height', height);

      // Calculate correlations between designs
      const designs = [...new Set(ratings.map(d => d.design))];
      const correlationData = [];

      for (let i = 0; i < designs.length; i++) {
        for (let j = 0; j < designs.length; j++) {
          const design1 = designs[i];
          const design2 = designs[j];
          
          // Get ratings for both designs by class
          const ratings1 = d3.rollup(ratings.filter(d => d.design === design1), 
            v => d3.mean(v, d => d.rating) || 0, d => d.class);
          const ratings2 = d3.rollup(ratings.filter(d => d.design === design2), 
            v => d3.mean(v, d => d.rating) || 0, d => d.class);
          
          // Calculate correlation
          const classes = [...new Set([...ratings1.keys(), ...ratings2.keys()])];
          const values1 = classes.map(cls => ratings1.get(cls) || 0);
          const values2 = classes.map(cls => ratings2.get(cls) || 0);
          
          const correlation = calculateCorrelation(values1, values2);
          
          correlationData.push({
            design1,
            design2,
            correlation: isNaN(correlation) ? 0 : correlation
          });
        }
      }

      console.log('🔗 Correlation data:', correlationData);

      // Create color scale
      const colorScale = d3.scaleSequential()
        .domain([-1, 1])
        .interpolator(d3.interpolateRdBu);

      // Create scales
      const xScale = d3.scaleBand()
        .domain(designs)
        .range([0, chartW])
        .padding(0.1);

      const yScale = d3.scaleBand()
        .domain(designs)
        .range([0, chartH])
        .padding(0.1);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create correlation cells
      g.selectAll('rect')
        .data(correlationData)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.design1) || 0)
        .attr('y', d => yScale(d.design2) || 0)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.correlation))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('stroke-width', 2);
          // Add tooltip
          svg.append('text')
            .attr('class', 'tooltip')
            .attr('x', event.pageX - 100)
            .attr('y', event.pageY - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', Math.max(10, width / 60) + 'px')
            .style('fill', '#333')
            .text(`${d.design1} vs ${d.design2}: ${d.correlation.toFixed(3)}`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 1);
          svg.selectAll('.tooltip').remove();
        });

      // Add correlation values inside cells
      g.selectAll('text')
        .data(correlationData)
        .enter()
        .append('text')
        .attr('x', d => (xScale(d.design1) || 0) + xScale.bandwidth() / 2)
        .attr('y', d => (yScale(d.design2) || 0) + yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(7, Math.min(xScale.bandwidth(), yScale.bandwidth()) / 10) + 'px')
        .style('font-weight', 'bold')
        .style('fill', d => Math.abs(d.correlation) > 0.5 ? '#fff' : '#000')
        .text(d => d.correlation.toFixed(2));

      // Add color legend
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, ${height - 40})`);

      const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([0, 100]);

      const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format('.1f'));

      legend.append('g')
        .attr('transform', 'translate(0, 20)')
        .call(legendAxis);

      // Create legend gradient
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'correlationGradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(-1));

      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', colorScale(0));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(1));

      legend.append('rect')
        .attr('width', 100)
        .attr('height', 20)
        .style('fill', 'url(#correlationGradient)')
        .attr('stroke', '#ccc');

      legend.append('text')
        .attr('x', 50)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.max(10, width / 60) + 'px')
        .style('font-weight', 'bold')
        .text('Correlation');

      // Add axes
      g.append('g')
        .attr('transform', `translate(0,${chartH})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .style('font-size', Math.max(8, width / 80) + 'px');

      g.append('g')
        .call(d3.axisLeft(yScale));

      // Add labels
      g.append('text')
        .attr('x', chartW/2).attr('y', chartH + margin.bottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, width / 50) + 'px')
        .text('Design 1');
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartH/2).attr('y', -margin.left + 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', Math.max(10, height / 40) + 'px')
        .text('Design 2');

      svg.append('text')
        .attr('x', width/2).attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .style('font-weight', '600')
        .style('font-size', Math.max(12, width / 40) + 'px')
        .text('Design Correlations');

      console.log('✅ Correlation matrix rendered');
    } catch (error) {
      console.error('❌ Error creating correlation matrix:', error);
    }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [ratings, chartDimensions]);

  // Helper function to calculate correlation
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = d3.sum(x.map(xi => xi * xi));
    const sumY2 = d3.sum(y.map(yi => yi * yi));
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>📊 Comprehensive Dashboard</h2>
        <p>Loading charts…</p>
        <p>Data status: {ratings ? `${ratings.length} ratings` : 'No ratings'}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview" style={{ paddingTop: '60px', paddingBottom: '40px', paddingLeft: '20px', paddingRight: '20px' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>📊 Comprehensive Dashboard</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Data: {ratings ? `${ratings.length} ratings loaded` : 'No ratings data'} | 
        Categories: {ratings ? [...new Set(ratings.map(r => r.category))].length : 0} | 
        Designs: {ratings ? [...new Set(ratings.map(r => r.design))].length : 0}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px', 
        maxWidth: '1400px',
        margin: '30px auto 0'
      }}>
        {/* Pie Chart */}
        <div ref={categoryPieContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>📊 Category Distribution</h3>
          <svg ref={categoryPieRef} style={{ width: '100%', height: '450px' }} />
        </div>
        
        {/* Histogram */}
        <div ref={ratingHistogramContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>📈 Rating Distribution</h3>
          <svg ref={ratingHistogramRef} style={{ width: '100%', height: '450px' }} />
        </div>
        
        {/* Sunburst Chart */}
        <div style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>🌳 Category Hierarchy</h3>
          <ReactECharts 
            option={sunburstOption} 
            style={{ height: '450px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
        
        {/* Top/Bottom Performers */}
        <div ref={topBottomPerformersContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>🏆 Top & Bottom Performers</h3>
          <svg ref={topBottomPerformersRef} style={{ width: '100%', height: '450px' }} />
        </div>
        
        {/* Performance Heatmap */}
        <div ref={performanceHeatmapContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>🔥 Performance Heatmap</h3>
          <svg ref={performanceHeatmapRef} style={{ width: '100%', height: '450px' }} />
        </div>
        
        {/* Rating vs Frequency Scatter Plot */}
        <div ref={ratingVsFrequencyContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>📊 Rating vs Frequency</h3>
          <svg ref={ratingVsFrequencyRef} style={{ width: '100%', height: '450px' }} />
        </div>
        
        {/* Design Correlations Matrix */}
        <div ref={designCorrelationsContainerRef} style={{ minHeight: '500px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#333' }}>🔗 Design Correlations</h3>
          <svg ref={designCorrelationsRef} style={{ width: '100%', height: '450px' }} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;