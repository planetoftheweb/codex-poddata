import { scaleLinear } from 'd3-scale';
import { extent, min, max } from 'd3-array';
import ChartCard from './ChartCard.jsx';

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

  const points = data.map((d) => ({
    x: d.durationMinutes,
    y: d.completionRate,
    episode: d.episode,
  }));

  const xDomain = extent(points, (d) => d.x);
  const yMin = Math.min(0.45, min(points, (d) => d.y) - 0.02);
  const yMax = Math.max(0.95, max(points, (d) => d.y) + 0.02);
  const yDomain = [yMin, yMax];

  const xScale = scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
  const yScale = scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

  const regression = regressionLine(points);
  const regressionSegment = [
    { x: xDomain[0], y: regression.slope * xDomain[0] + regression.intercept },
    { x: xDomain[1], y: regression.slope * xDomain[1] + regression.intercept },
  ];

  const yTicks = yScale.ticks(5);
  const xTicks = xScale.ticks(6);

  const bestCompletion = points.reduce((best, point) =>
    point.y > best.y ? point : best
  );

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
            >
              <title>
                {`Ep ${point.episode}\nDuration: ${point.x.toFixed(1)} min\nCompletion: ${(point.y * 100).toFixed(1)}%`}
              </title>
            </circle>
          );
        })}
        {xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
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
      </svg>
    </ChartCard>
  );
};

export default DurationCompletionScatter;
