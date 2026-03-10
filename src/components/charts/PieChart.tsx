"use client";

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  size?: number;
}

export default function PieChart({ data, title, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <p className="editorial-label mb-6 text-center">{title}</p>
      
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-lg">
            {data.map((item, i) => {
              const startAngle = currentAngle;
              const angle = (item.value / total) * 360;
              currentAngle += angle;
              
              const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos(((startAngle + angle) * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin(((startAngle + angle) * Math.PI) / 180);
              const largeArcFlag = angle > 180 ? 1 : 0;

              return (
                <path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={item.color}
                  className="hover:scale-[1.05] transition-transform origin-center cursor-pointer"
                  style={{ transitionDelay: `${i * 50}ms` }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[60%] h-[60%] bg-white rounded-full shadow-inner flex items-center justify-center">
                <span className="display-heading text-2xl text-[var(--purple-deep)]">{total}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[0.65rem] text-[var(--text-muted)] truncate max-w-[100px]">{item.label}</span>
              <span className="text-[0.65rem] font-bold text-[var(--text-secondary)]">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
