import { useState, useEffect } from "react";
import { Home } from "lucide-react";

function Ring({ value, total, color, size = 76, stroke = 7, delay = 0, dark = false, hovered = false }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? value / total : 0;
  const offset = mounted ? c - pct * c : c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={dark ? "#1A3355" : "#eef1f8"}
        strokeWidth={stroke}
      />
      {/* Arc — dessine dans le sens horaire depuis 12h */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)",
          filter: "none",
        }}
      />
    </svg>
  );
}

function StatItem({ s, i, total, dark }) {
  const [hovered, setHovered] = useState(false);
  const [ringKey, setRingKey] = useState(0);

  const handleEnter = () => {
    setHovered(true);
    setRingKey(k => k + 1);
  };
  const handleLeave = () => setHovered(false);

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 cursor-default select-none"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Halo */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-2 rounded-full pointer-events-none"
        style={{
          width: "56px",
          height: "56px",
          background: s.color,
          opacity: dark ? 0.12 : 0.14,
          filter: "blur(18px)",
        }}
      />

      {/* Ring + valeur */}
      <div className="relative">
        <Ring
          key={ringKey}
          value={s.value}
          total={Math.max(total, 1)}
          color={s.color}
          dark={dark}
          hovered={hovered}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xl font-extrabold tabular-nums"
            style={{ color: s.color }}
          >
            {s.value}
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{
          color: dark ? "#8A9BB5" : "#9E9E9E",
        }}
      >
        {s.label}
      </span>
    </div>
  );
}

export default function PropertyStatsCard({
  title = "Mes biens",
  total = 6,
  dark = false,
  stats = [
    { label: "Total",       value: 6, color: "#4B6BFF" },
    { label: "Publiés",     value: 5, color: "#22C55E" },
    { label: "En attente",  value: 1, color: "#F59E0B" },
    { label: "Rejetés",     value: 0, color: "#EF4444" },
  ],
}) {
  const corner = 20;
  const arm = 28;
  const thickness = 2.5;
  const glow = '#4B6BFF';

  const corners = [
    { top: 0, left: 0,     borderTop: thickness, borderLeft: thickness,  borderTopLeftRadius: corner },
    { top: 0, right: 0,    borderTop: thickness, borderRight: thickness, borderTopRightRadius: corner },
    { bottom: 0, left: 0,  borderBottom: thickness, borderLeft: thickness,  borderBottomLeftRadius: corner },
    { bottom: 0, right: 0, borderBottom: thickness, borderRight: thickness, borderBottomRightRadius: corner },
  ];

  return (
    <div
      className="relative"
      style={{
        borderRadius: corner,
        backgroundColor: dark ? "#112440" : "#FAFBFF",
        backgroundImage: dark
          ? `radial-gradient(ellipse at 15% 85%, rgba(75,107,255,0.14) 0%, transparent 45%)`
          : `radial-gradient(ellipse at 10% 90%, rgba(75,107,255,0.12) 0%, transparent 40%)`,
        padding: "20px 24px",
        boxShadow: dark
          ? `0 0 0 1px rgba(75,107,255,0.10), 0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.20)`
          : `0 0 0 1px rgba(75,107,255,0.08), 0 4px 16px rgba(15,23,42,0.07), 0 12px 40px rgba(15,23,42,0.08)`,
      }}
    >
      {/* Corner brackets */}
      {corners.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: arm,
            height: arm,
            borderStyle: 'solid',
            borderColor: 'transparent',
            borderTopWidth:    c.borderTop    || 0,
            borderBottomWidth: c.borderBottom || 0,
            borderLeftWidth:   c.borderLeft   || 0,
            borderRightWidth:  c.borderRight  || 0,
            borderTopColor:    c.borderTop    ? glow : 'transparent',
            borderBottomColor: c.borderBottom ? glow : 'transparent',
            borderLeftColor:   c.borderLeft   ? glow : 'transparent',
            borderRightColor:  c.borderRight  ? glow : 'transparent',
            borderTopLeftRadius:     c.borderTopLeftRadius     || 0,
            borderTopRightRadius:    c.borderTopRightRadius    || 0,
            borderBottomLeftRadius:  c.borderBottomLeftRadius  || 0,
            borderBottomRightRadius: c.borderBottomRightRadius || 0,
            top:    c.top    !== undefined ? c.top    : undefined,
            bottom: c.bottom !== undefined ? c.bottom : undefined,
            left:   c.left   !== undefined ? c.left   : undefined,
            right:  c.right  !== undefined ? c.right  : undefined,
            filter: `drop-shadow(0 0 4px ${glow}AA)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
          style={{ background: "#4B6BFF" }}
        >
          <Home size={15} strokeWidth={2.4} color="#fff" />
        </span>
        <span
          className="text-[14px] font-semibold"
          style={{ color: dark ? "#F0EDE8" : "#1A1A2E" }}
        >
          {title}
        </span>
        <span
          className="ml-auto text-[24px] font-black leading-none"
          style={{ color: "#4B6BFF" }}
        >
          {total}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <StatItem key={s.label} s={s} i={i} total={total} dark={dark} />
        ))}
      </div>
    </div>
  );
}
