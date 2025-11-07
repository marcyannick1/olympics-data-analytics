import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const D3WorldMap = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 500;

    const positions = {
      'USA': [-95, 37],
      'CHN': [105, 35],
      'JPN': [138, 36],
      'GBR': [-3, 54],
      'RUS': [105, 61],
      'AUS': [133, -27],
      'NLD': [5, 52],
      'FRA': [2, 46],
      'DEU': [10, 51],
      'ITA': [12, 42]
    };

    const projection = d3.geoMercator().center([0, 30]).scale(130).translate([width / 2, height / 2]);
    const colorScale = d3.scaleSequential().domain([0, d3.max(data, d => d.total)]).interpolator(d3.interpolateBlues);

    data.forEach(country => {
      const pos = positions[country.code];
      if (pos) {
        const [x, y] = projection(pos);
        const radius = Math.sqrt(country.total) * 2;

        const g = svg.append('g').style('cursor', 'pointer');
        g.append('circle').attr('cx', x).attr('cy', y).attr('r', radius + 5).attr('fill', colorScale(country.total)).attr('opacity', 0.3);
        g.append('circle').attr('cx', x).attr('cy', y).attr('r', radius).attr('fill', colorScale(country.total)).attr('stroke', '#fff').attr('stroke-width', 2).attr('opacity', 0.8);
        g.append('text').attr('x', x).attr('y', y).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-size', radius * 0.7).text(country.flag);
      }
    });
  }, [data]);

  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
      <svg ref={svgRef} width="100%" height="500" viewBox="0 0 900 500" />
    </div>
  );
};

export default D3WorldMap;