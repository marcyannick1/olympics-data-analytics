import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

/**
 * D3LineChart
 * Props:
 * - data: [{ year, medals }]  // optionnel si on veut tout passer depuis le parent
 * - noc: string               // ex: 'USA' - utilisé pour fetch si data est vide
 * - historyEndpoint: string   // ex: '/api/history?noc='  (par défaut: `${VITE_API_BASE_URL}/api/medals/history?noc=`)
 */
const D3LineChart = ({
  data = [],
  noc = '',
  historyEndpoint = `${import.meta.env?.VITE_API_BASE_URL || ''}/api/medals/history?noc=`,
}) => {
  const svgRef = useRef();
  const [fetched, setFetched] = useState([]);

  // --- 1) Fetch backend si pas de data fournie et si noc est présent
  useEffect(() => {
    const mustFetch = (!data || data.length === 0) && noc;
    if (!mustFetch) return;

    const url = `${historyEndpoint}${encodeURIComponent(noc)}`;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Supporte {data: [...] } ou [...] directement
        setFetched(Array.isArray(json) ? json : (json?.data || []));
      } catch (e) {
        console.error('❌ D3LineChart: erreur fetch history:', e);
        setFetched([]);
      }
    })();
  }, [data, noc, historyEndpoint]);

  // --- 2) Normalisation du format (backend -> {year, medals})
  const normalized = useMemo(() => {
    const src = (data && data.length ? data : fetched) || [];

    const pickYear = (d) =>
      Number(
        d.year ??
        d.game_year ??
        d.edition_year ??
        d.season_year ??
        d.Year // fallback éventuel
      );

    const pickMedals = (d) =>
      Number(
        d.medals ??
        d.total ??
        d.medals_total ??
        d.count // fallback éventuel
      );

    const rows = src
      .map((d) => ({
        year: pickYear(d),
        medals: pickMedals(d),
      }))
      .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.medals));

    // Tri chronologique + dédoublonnage au besoin (garde la dernière occurrence)
    const byYear = new Map();
    rows.forEach((r) => byYear.set(r.year, r));
    const uniqueSorted = Array.from(byYear.values()).sort((a, b) => a.year - b.year);

    return uniqueSorted;
  }, [data, fetched]);

  // --- 3) Render D3
  useEffect(() => {
    if (!normalized || normalized.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const x = d3.scaleLinear()
      .domain(d3.extent(normalized, (d) => d.year))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(normalized, (d) => d.medals) * 1.1])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x((d) => x(d.year))
      .y((d) => y(d.medals))
      .curve(d3.curveMonotoneX);

    const area = d3.area()
      .x((d) => x(d.year))
      .y0(height - margin.bottom)
      .y1((d) => y(d.medals))
      .curve(d3.curveMonotoneX);

    // 🌫️ Grille horizontale légère sur Y
    svg.append('g')
      .attr('class', 'grid-y')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3.axisLeft(y)
          .ticks(6)
          .tickSize(-width + margin.left + margin.right)
          .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '4 4');

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    // Area + line
    svg.append('path')
      .datum(normalized)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area);

    svg.append('path')
      .datum(normalized)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Points
    svg.selectAll('circle')
      .data(normalized)
      .join('circle')
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => y(d.medals))
      .attr('r', 6)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(200).attr('r', 8);
        svg.append('text')
          .attr('class', 'tooltip')
          .attr('x', x(d.year))
          .attr('y', y(d.medals) - 15)
          .attr('text-anchor', 'middle')
          .attr('fill', '#1f2937')
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .text(`${d.medals} médailles`);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200).attr('r', 6);
        svg.selectAll('.tooltip').remove();
      });

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', '#6b7280')
      .style('font-size', '12px');
  }, [normalized]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="300" viewBox="0 0 800 300" />
    </div>
  );
};

export default D3LineChart;
