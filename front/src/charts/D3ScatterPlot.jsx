import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3ScatterPlot = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.gdp) * 1.1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.total) * 1.1])
      .range([height - margin.bottom, margin.top]);

    const size = d3.scaleSqrt().domain([0, d3.max(data, d => d.total)]).range([5, 30]);

    const defs = svg.append('defs');
    data.forEach((d, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${i}`)
        .attr('cx', '30%')
        .attr('cy', '30%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa');
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb');
    });

    svg.selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.gdp))
      .attr('cy', d => y(d.total))
      .attr('r', d => size(d.total))
      .attr('fill', (d, i) => `url(#gradient-${i})`)
      .attr('opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(200).attr('opacity', 1).attr('stroke-width', 3);
        const tooltip = svg.append('g').attr('class', 'tooltip');
        const text = tooltip.append('text')
          .attr('x', x(d.gdp))
          .attr('y', y(d.total) - size(d.total) - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#1f2937')
          .attr('font-weight', 'bold')
          .text(`${d.country}: ${d.total} médailles`);
        const bbox = text.node().getBBox();
        tooltip.insert('rect', 'text')
          .attr('x', bbox.x - 5)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 4)
          .attr('fill', 'white')
          .attr('stroke', '#e5e7eb')
          .attr('rx', 4);
        text.raise();
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200).attr('opacity', 0.7).attr('stroke-width', 2);
        svg.selectAll('.tooltip').remove();
      });

    // Flags + axes
    svg.selectAll('text.flag')
      .data(data)
      .join('text')
      .attr('class', 'flag')
      .attr('x', d => x(d.gdp))
      .attr('y', d => y(d.total))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => size(d.total) * 0.8)
      .text(d => d.flag);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400" />
    </div>
  );
};

export default D3ScatterPlot;