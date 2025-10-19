import { useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { extent, min, max } from 'd3-array';
import ChartCard from './ChartCard.jsx';
import { useZoomPan } from '../hooks/useZoomPan.js';

const chartDimensions = {
  width: 640,
  height: 360,
  margin: { top: 24, right: 32, bottom: 52, left: 68 },
};

const regressionLine = (points) => {
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: 0 };
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const DurationCompletionScatter = ({ data, insight }) => {
  const { width, height, margin } = chartDimensions;

  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = data.map((d) => ({
    x: d.durationMinutes,
    y: d.completionRate,
    episode: d.episode,
  }));

  const xDomain = extent(points, (d) => d.x);
  const yMin = Math.min(0.45, min(points, (d) => d.y) - 0.02);
  const yMax = Math.max(0.95, max(points, (d) => d.y) + 0.02);
  const yDomain = [yMin, yMax];

  const { xDomain: zoomedXDomain, yDomain: zoomedYDomain, zoomRef, resetZoom, xRange, yRange } = useZoomPan({
    width,
    height,
    margin,
    xDomain,
    yDomain,
    maxZoom: 12,
  });

  const xScale = scaleLinear()
    .domain(zoomedXDomain)
    .range(xRange ?? [margin.left, width - margin.right]);
  const yScale = scaleLinear()
    .domain(zoomedYDomain)
    .range(yRange ?? [height - margin.bottom, margin.top]);

  const regression = regressionLine(points);
  const regressionSegment = [
    { x: zoomedXDomain[0], y: regression.slope * zoomedXDomain[0] + regression.intercept },
    { x: zoomedXDomain[1], y: regression.slope * zoomedXDomain[1] + regression.intercept },
  ];

  const yTicks = yScale.ticks(5);
  const xTicks = xScale.ticks(6);

  const bestCompletion = points.reduce((best, point) =>
    point.y > best.y ? point : best
  );

  const tooltip = (() => {
    if (!hoveredPoint) {
      return null;
    }

    const pointX = xScale(hoveredPoint.x);
    const pointY = yScale(hoveredPoint.y);
    const lines = [
      `Episode ${hoveredPoint.episode}`,
      `Duration: ${hoveredPoint.x.toFixed(1)} min`,
      `Completion: ${(hoveredPoint.y * 100).toFixed(1)}%`,
    ];

    const padding = 12;
    const lineHeight = 18;
    const textOffsetX = 12;
    const textOffsetY = 20;
    const estimatedWidth = Math.max(...lines.map((line) => line.length * 6.2), 150);
    const tooltipWidth = Math.min(estimatedWidth, width - margin.left - margin.right);
    const tooltipHeight = lines.length * lineHeight + padding;

    let tooltipX = pointX + 12;
    let tooltipY = pointY - tooltipHeight - 12;

    if (tooltipX + tooltipWidth > width - margin.right) {
      tooltipX = pointX - tooltipWidth - 12;
    }

    if (tooltipY < margin.top) {
      tooltipY = pointY + 12;
    }

    tooltipX = Math.max(margin.left, tooltipX);
    tooltipY = Math.max(margin.top - 4, tooltipY);

    return (
      <g className="chart-tooltip" transform={`translate(${tooltipX}, ${tooltipY})`} pointerEvents="none">
        <rect className="chart-tooltip__bg" width={tooltipWidth} height={tooltipHeight} rx={8} ry={8} />
        <text className="chart-tooltip__text" x={textOffsetX} y={textOffsetY}>
          {lines.map((line, index) => (
            <tspan key={line} x={textOffsetX} dy={index === 0 ? 0 : lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  })();

  return (
    <ChartCard
      title="Episode Duration vs Completion"
      description="Check whether tighter edits or longer conversations keep listeners engaged, and cluster runtimes that need rethinking."
      insight={insight}
      legend={
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: '#38bdf8' }} /> Episode
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: '#facc15' }} /> Highest completion
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter plot showing duration versus completion rate">
        {yTicks.map((tick) => (
          <g key={`y-${tick.toFixed(3)}`}>
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
        <line
          x1={xScale(regressionSegment[0].x)}
          x2={xScale(regressionSegment[1].x)}
          y1={yScale(regressionSegment[0].y)}
          y2={yScale(regressionSegment[1].y)}
          className="line-secondary"
        />
        {points.map((point) => {
          const isBest = point.episode === bestCompletion.episode;
          return (
            <circle
              key={point.episode}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={isBest ? 6 : 4}
              className={isBest ? 'dot-highlight' : 'dot'}
              tabIndex={0}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              onFocus={() => setHoveredPoint(point)}
              onBlur={() => setHoveredPoint(null)}
              aria-label={`Episode ${point.episode}, duration ${point.x.toFixed(1)} minutes, completion ${(point.y * 100).toFixed(1)} percent`}
            />
          );
        })}
        {tooltip}
        {xTicks.map((tick) => (
          <text
            key={`x-${tick.toFixed(3)}`}
            x={xScale(tick)}
            y={height - margin.bottom + 30}
            textAnchor="middle"
            className="axis-label"
          >
            {tick.toFixed(0)} min
          </text>
        ))}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="axis-label"
        >
          Episode duration (minutes)
        </text>
        <text
          transform={`translate(${margin.left - 42}, ${height / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-label"
        >
          Completion rate
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

export default DurationCompletionScatter;
