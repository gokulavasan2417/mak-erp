import React from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';

export function SimpleChart({
  title,
  subtitle,
  data = [35, 48, 62, 55, 78, 92, 85],
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  type = 'line', // 'line' | 'bar'
  height = 200,
  accentColor = 'var(--color-primary)'
}) {
  const maxVal = Math.max(...data, 1);
  const minVal = 0;
  const range = maxVal - minVal;

  // Chart coordinates
  const svgWidth = 500;
  const svgHeight = height;
  const padding = 35;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  // Points for line chart
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * chartWidth;
    const y = svgHeight - padding - ((val - minVal) / range) * chartHeight;
    return { x, y, val, label: labels[idx] };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - padding} L ${points[0].x},${svgHeight - padding} Z`;

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody style={{ padding: '1rem 1.25rem' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', maxHeight: `${height}px`, overflow: 'visible' }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = svgHeight - padding - pct * chartHeight;
              return (
                <g key={idx}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={svgWidth - padding}
                    y2={y}
                    stroke="var(--border-light)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 8}
                    y={y + 4}
                    fontSize="10"
                    fill="var(--text-muted)"
                    textAnchor="end"
                  >
                    {Math.round(minVal + pct * range)}
                  </text>
                </g>
              );
            })}

            {type === 'bar' ? (
              // Bar chart renderer
              data.map((val, idx) => {
                const barWidth = chartWidth / data.length - 12;
                const x = padding + idx * (chartWidth / data.length) + 6;
                const barHeight = ((val - minVal) / range) * chartHeight;
                const y = svgHeight - padding - barHeight;
                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={accentColor}
                      opacity={0.85}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - padding + 18}
                      fontSize="11"
                      fill="var(--text-muted)"
                      textAnchor="middle"
                    >
                      {labels[idx]}
                    </text>
                  </g>
                );
              })
            ) : (
              // Line chart renderer with gradient area fill
              <>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={areaD} fill="url(#chartGradient)" />
                <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="var(--bg-surface)"
                      stroke="var(--color-primary)"
                      strokeWidth="2.5"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - padding + 18}
                      fontSize="11"
                      fill="var(--text-muted)"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
}

export default SimpleChart;
