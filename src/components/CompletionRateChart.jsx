import { scaleLinear } from 'd3-scale';
import { extent, max, min } from 'd3-array';
import { line, curveMonotoneX } from 'd3-shape';
import ChartCard from './ChartCard.jsx';
import { useZoomPan } from '../hooks/useZoomPan.js';

const chartDimensions = {
  width: 640,
  height: 360,
  margin: { top: 24, right: 24, bottom: 42, left: 60 },
};

const CompletionRateChart = ({ data, averageCompletionRate, insight }) => {
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

  const minRate = min(data, (d) => d.completionRate);
  const maxRate = max(data, (d) => d.completionRate);
  const yScale = scaleLinear()
    .domain([Math.min(0.45, minRate - 0.02), Math.max(0.95, maxRate + 0.02)])
    .range([height - margin.bottom, margin.top]);

  const completionLine = line()
    .x((d) => xScale(d.episode))
    .y((d) => yScale(d.completionRate))
    .curve(curveMonotoneX);

  const rollingLine = line()
    .x((d) => xScale(d.episode))
    .y((d) => yScale(d.completionRolling))
    .curve(curveMonotoneX);

  const xTicks = xScale.ticks(6);
  const yTicks = yScale.ticks(5);

  return (
    <ChartCard
      title="Completion Discipline"
      description="Track how well episodes keep listeners to the end and spot the dips that signal pacing or segment order issues."
      insight={insight}
      legend={
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: '#38bdf8' }} /> Completion rate
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(129, 140, 248, 0.85)' }} /> Rolling average
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: '#facc15' }} /> Portfolio average
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Episode completion rate trend">
        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            className="grid-line"
            x1={margin.left}
            x2={width - margin.right}
            y1={yScale(tick)}
            y2={yScale(tick)}
          />
        ))}
        <line
          x1={margin.left}
          x2={width - margin.right}
          y1={yScale(averageCompletionRate)}
          y2={yScale(averageCompletionRate)}
          stroke="#facc15"
          strokeDasharray="6 6"
          strokeWidth={1.8}
        />
        <path d={completionLine(data)} className="line-primary" />
        <path d={rollingLine(data)} className="line-secondary" />
        {data.map((point) => (
          <circle
            key={point.episode}
            className="dot"
            cx={xScale(point.episode)}
            cy={yScale(point.completionRate)}
            r={3}
          />
        ))}
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
          x={margin.left - 12}
          y={margin.top}
          textAnchor="end"
          className="axis-label"
        >
          Completion %
        </text>
        {yTicks.map((tick) => (
          <text
            key={`ylab-${tick}`}
            x={margin.left - 14}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="axis-label"
          >
            {(tick * 100).toFixed(0)}%
          </text>
        ))}
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

export default CompletionRateChart;
