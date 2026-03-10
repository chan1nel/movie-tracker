"use client";

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarItem[];
  title?: string;
  maxBars?: number;
}

export default function BarChart({ data, title, maxBars = 8 }: BarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const max = Math.max(...sorted.map(d => d.value), 1);

  return (
    <div>
      {title && <p className="editorial-label mb-4">{title}</p>}
      <div className="space-y-3">
        {sorted.map((item, i) => {
          const percent = (item.value / max) * 100;
          return (
            <div key={i} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)] font-medium truncate mr-3" style={{maxWidth: '60%'}}>
                  {item.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-semibold tabular-nums shrink-0">{item.value}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{background: 'rgba(0,0,0,0.04)'}}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                  style={{
                    width: `${percent}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
                    boxShadow: `0 1px 6px ${item.color}33`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
