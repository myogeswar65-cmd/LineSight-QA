import React from "react";

/**
 * Semi-circular confidence gauge (0-100) with needle + segmented arc.
 */
export const ConfidenceGauge = ({ value = 0, size = 200 }) => {
  const pct = Math.max(0, Math.min(100, value));
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 8;
  const r = w / 2 - 16;

  const polar = (angleDeg, radius) => {
    const a = (Math.PI * angleDeg) / 180;
    return [cx - radius * Math.cos(a), cy - radius * Math.sin(a)];
  };
  const arcPath = (startPct, endPct, radius) => {
    const a0 = 180 * (startPct / 100);
    const a1 = 180 * (endPct / 100);
    const [x0, y0] = polar(a0, radius);
    const [x1, y1] = polar(a1, radius);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };

  const needleAngle = 180 * (pct / 100);
  const [nx, ny] = polar(needleAngle, r - 10);

  const segments = [
    { from: 0, to: 40, color: "hsl(var(--fail))" },
    { from: 40, to: 70, color: "hsl(var(--warning))" },
    { from: 70, to: 100, color: "hsl(var(--pass))" },
  ];

  return (
    <div className="flex flex-col items-center" data-testid="inspection-confidence-gauge">
      <svg width={w} height={h + 24} viewBox={`0 0 ${w} ${h + 24}`}>
        <path d={arcPath(0, 100, r)} fill="none" stroke="hsl(var(--muted))" strokeWidth={12} strokeLinecap="round" />
        {segments.map((s, i) => (
          <path key={i} d={arcPath(s.from, s.to, r)} fill="none" stroke={s.color} strokeWidth={12} strokeLinecap="round" opacity={0.9} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--foreground))" />
        <text x={cx} y={cy - r / 2} textAnchor="middle" className="font-display" fontSize={size * 0.16} fontWeight={700} fill="hsl(var(--foreground))">
          {Math.round(pct)}%
        </text>
      </svg>
      <div className="-mt-2 text-xs text-muted-foreground">Model confidence</div>
    </div>
  );
};
