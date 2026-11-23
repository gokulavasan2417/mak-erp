// MAK Tours & Travels ERP - Dashboard & Reports Charts Suite
import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { TrendingUp, DollarSign, Calendar, Car, Award } from 'lucide-react';

// 1. Monthly Revenue & Expenses Chart (Dual Bar & Trend Area)
export function MonthlyRevenueChart({
  data = [],
  height = 240
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Monthly Revenue vs Expenses"
          subtitle="Gross revenue, operating expenses, and net EBITDA"
        />
        <CardBody style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <TrendingUp size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>No financial records yet</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Financial charts will appear as bookings and payments are recorded.</div>
        </CardBody>
      </Card>
    );
  }

  const computedMax = Math.max(...data.flatMap((d) => [d.revenue || 0, d.expenses || 0, d.profit || 0]), 10);
  const maxVal = Math.max(Math.ceil(computedMax * 1.25), 10);
  const step = Math.max(1, Math.round(maxVal / 3));
  const gridVals = [0, step, step * 2, maxVal];
  const padding = 35;
  const svgWidth = 600;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = height - padding * 2;

  return (
    <Card>
      <CardHeader
        title="Monthly Revenue vs Expenses"
        subtitle="Gross revenue, operating expenses, and net EBITDA (in ₹ Thousands)"
        action={
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#2C3480' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2C3480' }} /> Revenue
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EF4444' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} /> Expenses
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Profit
            </span>
          </div>
        }
      />
      <CardBody style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${svgWidth} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}>
            {/* Horizontal Grid lines */}
            {gridVals.map((val) => {
              const y = height - padding - (val / maxVal) * chartHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={svgWidth - padding}
                    y2={y}
                    stroke="var(--border-light, #e2e8f0)"
                    strokeDasharray="4 4"
                  />
                  <text x={padding - 6} y={y + 3} fontSize="9" fill="var(--text-muted, #64748b)" textAnchor="end">
                    {maxVal >= 1000 ? (val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${Math.round(val / 1000)}k`) : `₹${val}k`}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((item, idx) => {
              const groupWidth = chartWidth / data.length;
              const barWidth = 14;
              const groupX = padding + idx * groupWidth;

              const revHeight = (item.revenue / maxVal) * chartHeight;
              const revY = height - padding - revHeight;

              const expHeight = (item.expenses / maxVal) * chartHeight;
              const expY = height - padding - expHeight;

              const profHeight = (item.profit / maxVal) * chartHeight;
              const profY = height - padding - profHeight;

              const isHovered = hoveredIdx === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${item.label || item.month}: Revenue ₹${Number(item.rawRevenue ?? (item.revenue >= 1000 ? item.revenue : item.revenue * 1000)).toLocaleString('en-IN')} | Expenses ₹${Number(item.rawExpenses ?? (item.expenses >= 1000 ? item.expenses : item.expenses * 1000)).toLocaleString('en-IN')} | Profit ₹${Number(item.rawProfit ?? (item.profit >= 1000 ? item.profit : item.profit * 1000)).toLocaleString('en-IN')}`}</title>
                  {/* Background highlight on hover */}
                  {isHovered && (
                    <rect
                      x={groupX}
                      y={padding - 10}
                      width={groupWidth}
                      height={chartHeight + 15}
                      fill="rgba(44, 52, 128, 0.05)"
                      rx="4"
                    />
                  )}

                  {/* Revenue Bar (Cobalt Blue #2C3480) */}
                  <rect
                    x={groupX + groupWidth / 2 - barWidth * 1.6}
                    y={revY}
                    width={barWidth}
                    height={revHeight}
                    fill="#2C3480"
                    rx="3"
                    opacity={isHovered ? 1 : 0.9}
                  />

                  {/* Expense Bar */}
                  <rect
                    x={groupX + groupWidth / 2 - barWidth * 0.5}
                    y={expY}
                    width={barWidth}
                    height={expHeight}
                    fill="#EF4444"
                    rx="3"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Profit Bar */}
                  <rect
                    x={groupX + groupWidth / 2 + barWidth * 0.6}
                    y={profY}
                    width={barWidth}
                    height={profHeight}
                    fill="#10B981"
                    rx="3"
                    opacity={isHovered ? 1 : 0.85}
                  />

                  {/* Month Label */}
                  <text
                    x={groupX + groupWidth / 2}
                    y={height - padding + 16}
                    fontSize="10"
                    fill="var(--text-muted, #64748b)"
                    textAnchor="middle"
                    fontWeight={isHovered ? 700 : 500}
                  >
                    {item.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
}

// 2. Booking Trends Chart (Multi-day Area Curve)
export function BookingTrendsChart({
  labels = [],
  bookings = [],
  height = 240
}) {
  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader
          title="Daily Booking Volume Trends"
          subtitle="Confirmed bookings across all authorized journey types"
        />
        <CardBody style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>No daily booking trends yet</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Daily booking trends will display here as bookings are placed.</div>
        </CardBody>
      </Card>
    );
  }

  const computedMax = Math.max(...bookings, 4);
  const maxVal = Math.ceil(computedMax * 1.25);
  const step = Math.max(1, Math.ceil(maxVal / 4));
  const gridVals = [0, step, step * 2, step * 3, step * 4];
  const minVal = 0;
  const padding = 35;
  const svgWidth = 600;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = height - padding * 2;

  const points = bookings.map((val, idx) => {
    const x = padding + (idx / (bookings.length - 1)) * chartWidth;
    const y = height - padding - (val / maxVal) * chartHeight;
    return { x, y, val, label: labels[idx] };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <Card>
      <CardHeader
        title="Daily Booking Volume Trends"
        subtitle="Confirmed bookings across all authorized journey types"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#10B981', fontWeight: 600 }}>
            <TrendingUp size={16} /> +18.4% Week-on-Week
          </div>
        }
      />
      <CardBody style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${svgWidth} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: `${height}px` }}>
            <defs>
              <linearGradient id="bookingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2C3480" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2C3480" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridVals.map((val) => {
              const y = height - padding - (val / maxVal) * chartHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={svgWidth - padding}
                    y2={y}
                    stroke="var(--border-light, #e2e8f0)"
                    strokeDasharray="4 4"
                  />
                  <text x={padding - 6} y={y + 3} fontSize="9" fill="var(--text-muted, #64748b)" textAnchor="end">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area & Stroke */}
            <path d={areaD} fill="url(#bookingTrendGradient)" />
            <path d={pathD} fill="none" stroke="#2C3480" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ffffff" stroke="#2C3480" strokeWidth="2.5" />
                <text x={pt.x} y={pt.y - 9} fontSize="10" fontWeight="700" fill="#2C3480" textAnchor="middle">
                  {pt.val}
                </text>
                <text x={pt.x} y={height - padding + 16} fontSize="10" fill="var(--text-muted, #64748b)" textAnchor="middle">
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardBody>
    </Card>
  );
}

// 3. Booking Status Donut Chart
export function BookingStatusDistribution({
  data = []
}) {
  const total = (data || []).reduce((acc, d) => acc + (d.count || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader title="Booking Status Distribution" subtitle="Active vs completed vs cancelled manifests" />
        <CardBody style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>No bookings to distribute</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Status breakdown will appear once bookings are added.</div>
        </CardBody>
      </Card>
    );
  }

  let cumulative = 0;

  const size = 180;
  const center = size / 2;
  const radius = 68;
  const strokeWidth = 24;

  const circumference = 2 * Math.PI * radius;

  return (
    <Card>
      <CardHeader title="Booking Status Distribution" subtitle="Active vs completed vs cancelled manifests" />
      <CardBody style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Donut SVG */}
          <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {data.map((item, idx) => {
                const ratio = item.count / total;
                const strokeDasharray = `${ratio * circumference} ${circumference}`;
                const strokeDashoffset = -cumulative * circumference;
                cumulative += ratio;

                return (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                );
              })}
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #090d16)' }}>{total}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trips</span>
            </div>
          </div>

          {/* Legend Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '180px' }}>
            {data.map((item, idx) => {
              const pct = ((item.count / total) * 100).toFixed(1);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary, #334155)', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-main, #090d16)' }}>{item.count}</span>
                    <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.75rem', width: '36px', textAlign: 'right' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// 4. Vehicle Utilization Chart (Horizontal Category Meters)
export function VehicleUtilizationChart({
  data = []
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title="Vehicle Fleet Utilization" subtitle="Fleet occupancy and on-road duty efficiency" />
        <CardBody style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <Car size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>No vehicle utilization data yet</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Fleet telematics and trip logs will populate utilization meters.</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Vehicle Fleet Utilization" subtitle="Fleet occupancy and on-road duty efficiency" />
      <CardBody style={{ padding: '1rem 1.25rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {data.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>{item.category}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{item.onRoad}% active</span>
              </div>
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  backgroundColor: 'var(--border-light, #e2e8f0)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${item.onRoad}%`,
                    backgroundColor: item.color,
                    borderRadius: '9999px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// 5. Tour Package Performance Chart (Ranked Horizontal Bars)
export function TourPackagePerformanceChart({
  data = []
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title="Tour Package Performance" subtitle="Best-selling curated holiday circuits by booking volume" />
        <CardBody style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <Award size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#2C3480' }} />
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main, #090d16)' }}>No package sales data yet</div>
          <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Tour package rankings will display here as packages are booked.</div>
        </CardBody>
      </Card>
    );
  }

  const maxBookings = Math.max(...data.map((d) => d.bookings), 1);

  return (
    <Card>
      <CardHeader title="Tour Package Performance" subtitle="Best-selling curated holiday circuits by booking volume" />
      <CardBody style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map((item, idx) => {
            const widthPct = (item.bookings / maxBookings) * 100;
            return (
              <div key={idx} style={{ padding: '0.375rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main, #090d16)' }}>
                    #{idx + 1} {item.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#2C3480' }}>{item.revenue}</span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px'
                      }}
                    >
                      {item.margin} margin
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: 'var(--border-light, #e2e8f0)',
                    borderRadius: '9999px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${widthPct}%`,
                      backgroundColor: '#2C3480',
                      borderRadius: '9999px'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
