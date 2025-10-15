import { scaleLinear } from 'd3-scale';
import { extent, max } from 'd3-array';
import { area, line, curveMonotoneX } from 'd3-shape';
import ChartCard from './ChartCard.jsx';

const chartDimensions = {
  width: 640,
  height: 360,
  margin: { top: 24, right: 24, bottom: 42, left: 60 },
};

const SubscriberGrowthChart = ({ data, insight }) => {
  const { width, height, margin } = chartDimensions;
  const xScale = scaleLinear()
    .domain(extent(data, (d) => d.episode))
    .range([margin.left, width - margin.right]);

  const yScale = scaleLinear()
    .domain([0, max(data, (d) => d.cumulativeSubscribers) * 1.05])
    .range([height - margin.bottom, margin.top]);

  const areaPath = area()
    .x((d) => xScale(d.episode))
    .y0(yScale(0))
    .y1((d) => yScale(d.cumulativeSubscribers))
    .curve(curveMonotoneX);

  const linePath = line()
    .x((d) => xScale(d.episode))
    .y((d) => yScale(d.cumulativeSubscribers))
    .curve(curveMonotoneX);

  const xTicks = xScale.ticks(6);
  const yTicks = yScale.ticks(5);

  return (
    <ChartCard
      title="Subscriber Trajectory"
      description="Cumulative subscriber growth shows which seasons or campaigns produced inflection points and where momentum slowed."
      insight={insight}
      legend={
        <div className="legend">
          <span className="legend-item">
            <span className="legend-swatch" style={{ background: 'rgba(56, 189, 248, 0.3)' }} /> Total subscribers
          </span>
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative subscribers over time">
        <defs>
          <linearGradient id="subsFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(129, 140, 248, 0.5)" />
            <stop offset="100%" stopColor="rgba(129, 140, 248, 0)" />
          </linearGradient>
        </defs>
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
        <path d={areaPath(data)} fill="url(#subsFill)" />
        <path d={linePath(data)} className="line-secondary" />
        {xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
            x={xScale(tick)}
            y={height - margin.bottom + 28}
            textAnchor="middle"
            className="axis-label"
          >
            Ep {tick}
          </text>
        ))}
        <text
          x={margin.left}
          y={margin.top - 10}
          textAnchor="start"
          className="axis-label"
        >
          Total subscribers
        </text>
        {yTicks.map((tick) => (
          <text
            key={`ylab-${tick}`}
            x={margin.left - 12}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="axis-label"
          >
            {Math.round(tick).toLocaleString()}
          </text>
        ))}
      </svg>
    </ChartCard>
  );
};

export default SubscriberGrowthChart;
