"use client";

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  maxBars?: number;
}

export default function BarChart({ data, title, maxBars = 10 }: BarChartProps) {
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(d => d.value));

  if (displayData.length === 0) return null;

  return (
    <div className="w-full">
      <p className="editorial-label mb-6">{title}</p>
      <div className="space-y-4">
        {displayData.map((item, i) => (
          <div key={i} className="group">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[0.65rem] font-medium text-[var(--text-secondary)] truncate flex-1 pr-4">{item.label}</span>
              <span className="text-[0.65rem] font-bold text-[var(--purple-mid)]">{item.value}</span>
            </div>
            <div className="h-2 w-full bg-[var(--cream-dark)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 overflow-hidden"
                style={{ 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                  boxShadow: `0 0 10px ${item.color}40`,
                  animationDelay: `${i * 100}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
