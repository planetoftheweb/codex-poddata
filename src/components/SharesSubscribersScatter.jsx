import { scaleLinear } from 'd3-scale';
import { extent, max } from 'd3-array';
import ChartCard from './ChartCard.jsx';

const chartDimensions = {
  width: 640,
  height: 360,
  margin: { top: 24, right: 32, bottom: 52, left: 68 },
};

const calculateRegression = (points) => {
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n || 0 };
  }
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const SharesSubscribersScatter = ({ data, insight }) => {
  const { width, height, margin } = chartDimensions;

  const points = data.map((d) => ({
    x: d.socialMediaShares,
    y: d.subscribersGained,
    episode: d.episode,
    title: d.title,
  }));

  const xDomain = extent(points, (p) => p.x);
  const yDomain = [0, max(points, (p) => p.y) * 1.1];

  const xScale = scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
  const yScale = scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

  const regression = calculateRegression(points);
  const regressionLine = [
    { x: xDomain[0], y: regression.slope * xDomain[0] + regression.intercept },
    { x: xDomain[1], y: regression.slope * xDomain[1] + regression.intercept },
  ];

  const topShare = points.reduce((maxPoint, point) =>
    point.x > maxPoint.x ? point : maxPoint
  );

  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(5);

  return (
    <ChartCard
      title="Social Share Conversion"
      description="Correlate social push energy with subscriber lift to decide where to double down on promotion."
      insight={insight}
      legend={
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: '#38bdf8' }} /> Episode
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(250, 204, 21, 0.9)' }} /> Highest share push
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter plot of social shares vs subscribers">
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
              {Math.round(tick).toLocaleString()}
            </text>
          </g>
        ))}
        <line
          x1={xScale(regressionLine[0].x)}
          x2={xScale(regressionLine[1].x)}
          y1={yScale(regressionLine[0].y)}
          y2={yScale(regressionLine[1].y)}
          className="line-secondary"
        />
        {points.map((point) => {
          const isHighlight = point.episode === topShare.episode;
          return (
            <circle
              key={point.episode}
              cx={xScale(point.x)}
              cy={yScale(point.y)}
              r={isHighlight ? 6 : 4}
              className={isHighlight ? 'dot-highlight' : 'dot'}
            >
              <title>
                {`Ep ${point.episode}: ${point.title}
${point.x} shares → ${point.y} subscribers`}
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
            {tick.toLocaleString()}
          </text>
        ))}
        <text
          x={width / 2}
          y={height - 12}
          textAnchor="middle"
          className="axis-label"
        >
          Social media shares
        </text>
        <text
          transform={`translate(${margin.left - 42}, ${height / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-label"
        >
          Subscribers gained
        </text>
      </svg>
    </ChartCard>
  );
};

export default SharesSubscribersScatter;
