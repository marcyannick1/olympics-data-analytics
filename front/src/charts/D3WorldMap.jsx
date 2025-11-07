import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const D3WorldMap = ({ data = [] }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 500;

    // Projection D3
    const projection = d3.geoMercator()
      .center([0, 30])
      .scale(130)
      .translate([width / 2, height / 2]);

    // Échelle de couleur selon total médailles
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(data, (d) => d.total || 0)])
      .interpolator(d3.interpolateBlues);

    // Ajout des cercles et drapeaux
    data.forEach((country) => {
      if (!country.lat || !country.lon) return;

      const [x, y] = projection([country.lon, country.lat]);
      const radius = Math.sqrt(country.total || 0) * 2;

      const g = svg.append('g').style('cursor', 'pointer');

      // Cercle d’arrière-plan
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius + 5)
        .attr('fill', colorScale(country.total))
        .attr('opacity', 0.3);

      // Cercle principal
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', colorScale(country.total))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);

      // 🏳️ Drapeau centré sur le cercle
      g.append('image')
        .attr(
          'href',
          `https://flagsapi.com/${country.noc.slice(0, 2).toUpperCase()}/flat/64.png`
        )
        .attr('x', x - radius / 2)
        .attr('y', y - radius / 2)
        .attr('width', radius)
        .attr('height', radius)
        .attr('clip-path', 'circle(50%)');
    });
  }, [data]);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden"
      style={{ height: '500px' }}
    >
      {/* 🗺️ Carte OpenStreetMap en fond */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {/* 🌍 Couche D3 par-dessus la carte */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 900 500"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'none', // ne bloque pas les interactions Leaflet
        }}
      />
    </div>
  );
};

export default D3WorldMap;
