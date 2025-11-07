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

    const maxGDP = d3.max(data, d => +d.gdp || 0) || 0;
    const maxTotal = d3.max(data, d => +d.total || 0) || 0;

    // Domaines "arrondis"
    const yMax = Math.ceil(maxTotal * 1.05);
    const xMax = Math.ceil(maxGDP * 1.05);

    // Choix de pas "agréables" (majeur / mineur) pour Y
    const pickYSteps = (m) => {
      if (m <= 50)   return { major: 10, minor: 2 };
      if (m <= 120)  return { major: 20, minor: 5 };
      if (m <= 250)  return { major: 50, minor: 10 };
      if (m <= 600)  return { major: 100, minor: 20 };
      return { major: 200, minor: 50 };
    };
    const { major: yStepMajor, minor: yStepMinor } = pickYSteps(yMax);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, xMax])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    const size = d3.scaleSqrt()
      .domain([0, maxTotal || 1])
      .range([5, 30]);

    // --- GRILLE HORIZONTALE ---

    // 1) Lignes mineures
    const yMinorTicks = d3.range(0, yMax + yStepMinor, yStepMinor);
    svg.append('g')
      .attr('class', 'grid-y-minor')
      .selectAll('line')
      .data(yMinorTicks)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-dasharray', '3 3');

    // 2) Lignes majeures
    const yMajorTicks = d3.range(0, yMax + yStepMajor, yStepMajor);
    svg.append('g')
      .attr('class', 'grid-y-major')
      .selectAll('line')
      .data(yMajorTicks)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1.2);

    // --- Grille verticale légère pour le PIB ---
    const pickXSteps = (m) => {
      if (m <= 500) return 50;
      if (m <= 2000) return 200;
      if (m <= 5000) return 500;
      if (m <= 12000) return 1000;
      return 2000;
    };
    const xStep = pickXSteps(xMax);
    const xTicks = d3.range(0, xMax + xStep, xStep);
    svg.append('g')
      .attr('class', 'grid-x')
      .selectAll('line')
      .data(xTicks)
      .join('line')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('x1', d => x(d))
      .attr('x2', d => x(d))
      .attr('stroke', '#eef2f7')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '4 4');

    // --- Dégradés pour les cercles ---
    const defs = svg.append('defs');
    data.forEach((d, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${i}`)
        .attr('cx', '30%')
        .attr('cy', '30%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#60a5fa');
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#2563eb');
    });

    // --- Points (cercles) ---
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
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(200)
          .attr('opacity', 1)
          .attr('stroke-width', 3);
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
        d3.select(this).transition().duration(200)
          .attr('opacity', 0.7)
          .attr('stroke-width', 2);
        svg.selectAll('.tooltip').remove();
      });

    // --- 🏳️ Drapeaux sur chaque point ---
    svg.selectAll('image.flag')
      .data(data)
      .join('image')
      .attr('class', 'flag')
      .attr('x', d => x(d.gdp) - 10) // centré horizontalement
      .attr('y', d => y(d.total) - size(d.total) - 15) // un peu au-dessus du cercle
      .attr('width', 20)
      .attr('height', 15)
      .attr('href', d =>
        d.noc
          ? `https://flagsapi.com/${d.noc.slice(0, 2).toUpperCase()}/flat/64.png`
          : ''
      )
      .on('error', (event) => {
        event.target.setAttribute(
          'href',
          'https://cdn-icons-png.flaticon.com/512/3178/3178283.png'
        );
      });

    // --- Axes ---
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(Math.max(5, Math.ceil(yMax / yStepMajor))))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');

    // Labels des axes
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '14px')
      .text('PIB (Milliards $)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '14px')
      .text('Nombre de médailles');
  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400" />
    </div>
  );
};

export default D3ScatterPlot;
