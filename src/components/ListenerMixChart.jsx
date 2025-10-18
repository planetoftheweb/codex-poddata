import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';
import { area, curveMonotoneX, stack } from 'd3-shape';
import ChartCard from './ChartCard.jsx';
import { useZoomPan } from '../hooks/useZoomPan.js';

const chartDimensions = {
  width: 640,
  height: 360,
  margin: { top: 24, right: 24, bottom: 42, left: 60 },
};

const ListenerMixChart = ({ data, insight }) => {
  const { width, height, margin } = chartDimensions;

  const baseXDomain = extent(data, (d) => d.episode);

  const { xDomain, zoomRef, resetZoom, xRange } = useZoomPan({
    width,
    height,
    margin,
    xDomain: baseXDomain,
    maxZoom: 12,
  });

  const xScale = scaleLinear()
    .domain(xDomain)
    .range(xRange ?? [margin.left, width - margin.right]);

  const yScale = scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);

  const shareData = data.map((d) => ({
    newShare: d.listenersTotal === 0 ? 0 : d.newListeners / d.listenersTotal,
    returningShare: d.listenersTotal === 0 ? 0 : d.returningListeners / d.listenersTotal,
  }));

  const stacked = stack().keys(['returningShare', 'newShare'])(shareData);

  const areaGenerator = area()
    .x((_, idx) => xScale(data[idx].episode))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]))
    .curve(curveMonotoneX);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = xScale.ticks(6);

  return (
    <ChartCard
      title="Listener Mix"
      description="See how the audience blend between new and returning listeners shifts, so you can balance acquisition campaigns and retention hooks."
      insight={insight}
      legend={
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch stack-returning" /> Returning listeners
          </span>
          <span className="legend-item">
            <span className="legend-swatch stack-new" /> New listeners
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stacked area showing listener composition">
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              className="grid-line"
              x1={margin.left}
              x2={width - margin.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
            />
            <text
              x={margin.left - 16}
              y={yScale(tick) + 4}
              textAnchor="end"
              className="axis-label"
            >
              {(tick * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        <path d={areaGenerator(stacked[0])} className="stack-returning" />
        <path d={areaGenerator(stacked[1])} className="stack-new" />
        {xTicks.map((tick) => (
          <text
            key={`x-${tick.toFixed(3)}`}
            x={xScale(tick)}
            y={height - margin.bottom + 28}
            textAnchor="middle"
            className="axis-label"
          >
            Ep {Math.round(tick)}
          </text>
        ))}
        <text
          x={margin.left - 10}
          y={margin.top}
          textAnchor="end"
          className="axis-label"
        >
          Audience share
        </text>
        <rect
          ref={zoomRef}
          x={margin.left}
          y={margin.top}
          width={width - margin.left - margin.right}
          height={height - margin.top - margin.bottom}
          fill="transparent"
          className="interaction-layer"
          onDoubleClick={resetZoom}
          aria-hidden="true"
        >
          <title>Drag to pan, scroll to zoom, double-click to reset</title>
        </rect>
      </svg>
    </ChartCard>
  );
};

export default ListenerMixChart;
