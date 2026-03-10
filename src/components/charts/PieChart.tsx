"use client";

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
  title?: string;
}

export default function PieChart({ data, size = 220, title }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;

  let cumulativeAngle = -90; // Start from top

  const slices = data.map((d) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Label position (midpoint of arc)
    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const labelRadius = radius * 0.65;
    const labelX = cx + labelRadius * Math.cos(midAngle);
    const labelY = cy + labelRadius * Math.sin(midAngle);

    return {
      ...d,
      percentage,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      labelX,
      labelY,
    };
  });

  return (
    <div className="flex flex-col items-center">
      {title && <p className="editorial-label mb-3">{title}</p>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        {slices.map((s, i) => (
          <g key={i}>
            <path
              d={s.path}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-300 hover:opacity-80"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))',
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <title>{s.label}: {(s.percentage * 100).toFixed(1)}%</title>
            </path>
            {s.percentage > 0.08 && (
              <text
                x={s.labelX} y={s.labelY}
                textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="10" fontWeight="600"
                style={{pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.3)'}}
              >
                {(s.percentage * 100).toFixed(0)}%
              </text>
            )}
          </g>
        ))}
        {/* Inner circle for donut look */}
        <circle cx={cx} cy={cy} r={radius * 0.38} fill="white" opacity="0.9" />
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4 max-w-xs">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{background: s.color}} />
            <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
