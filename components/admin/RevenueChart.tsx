"use client";

import { useState } from "react";
import { adelaideDate } from "../../lib/adelaideDate";

export function RevenueChart({ data }: { data: { date: string; totalCents: number }[] }) {
  const [range, setRange] = useState<"all" | "month" | "week">("month");

  const todayStr = adelaideDate();
  const adelaide = new Date(`${todayStr}T00:00:00Z`);

  const filtered = data.filter((d) => {
    if (range === "week") {
      const jsDay = adelaide.getUTCDay();
      const offset = jsDay === 0 ? 6 : jsDay - 1;
      const weekStart = new Date(adelaide);
      weekStart.setUTCDate(weekStart.getUTCDate() - offset);
      return d.date >= weekStart.toISOString().split("T")[0];
    }
    if (range === "month") {
      const monthStart = `${adelaide.getUTCFullYear()}-${String(adelaide.getUTCMonth() + 1).padStart(2, "0")}-01`;
      return d.date >= monthStart;
    }
    return true;
  });

  const points = filtered.sort((a, b) => a.date.localeCompare(b.date));
  const totalCents = points.reduce((s, p) => s + p.totalCents, 0);

  // Build cumulative running totals for chart display
  const cumulativePoints: typeof points = [];
  for (const point of points) {
    cumulativePoints.push({ date: point.date, totalCents: (cumulativePoints.at(-1)?.totalCents ?? 0) + point.totalCents });
  }

  // For a single point, duplicate it so the area fills the full width
  const chartPoints =
    cumulativePoints.length === 1
      ? [cumulativePoints[0], cumulativePoints[0]]
      : cumulativePoints;

  const formatCurrency = (c: number) => `$${(c / 100).toFixed(2)}`;
  const formatDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(day)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}`;
  };

  // SVG chart dimensions
  const W = 800;
  const H = 220;
  const padL = 60;
  const padR = 20;
  const padT = 16;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const rawMax = Math.max(...cumulativePoints.map((p) => p.totalCents), 1);

  // Nice Y-axis: round up to a clean tick interval so labels are $50, $100, $200 etc.
  const targetTicks = 4;
  const roughInterval = rawMax / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const normalized = roughInterval / magnitude;
  const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const tickInterval = niceFactor * magnitude;
  const niceMax = Math.ceil(rawMax / tickInterval) * tickInterval;

  const xStep = chartW / (chartPoints.length - 1);
  const toX = (i: number) => padL + i * xStep;
  const toY = (v: number) => padT + chartH - (v / niceMax) * chartH;

  const polyline = chartPoints.map((p, i) => `${toX(i)},${toY(p.totalCents)}`).join(" ");
  const area =
    chartPoints.length > 0
      ? `M${toX(0)},${padT + chartH} ` +
        chartPoints.map((p, i) => `L${toX(i)},${toY(p.totalCents)}`).join(" ") +
        ` L${toX(chartPoints.length - 1)},${padT + chartH} Z`
      : "";

  // Y-axis gridlines at nice intervals from tickInterval up to niceMax
  const yTicks: { y: number; label: string }[] = [];
  for (let v = tickInterval; v <= niceMax; v += tickInterval) {
    yTicks.push({ y: toY(v), label: formatCurrency(v) });
  }

  // X-axis labels: show at most 7 evenly spread (use original cumulativePoints for labels/hits)
  const xLabelIndices: number[] = [];
  if (cumulativePoints.length <= 7) {
    cumulativePoints.forEach((_, i) => xLabelIndices.push(i));
  } else {
    const step = Math.floor(cumulativePoints.length / 6);
    for (let i = 0; i < cumulativePoints.length; i += step) xLabelIndices.push(i);
    if (!xLabelIndices.includes(cumulativePoints.length - 1)) xLabelIndices.push(cumulativePoints.length - 1);
  }

  const [tooltip, setTooltip] = useState<{ i: number; x: number; y: number } | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Revenue</h3>
          <p className="text-sm text-slate-500">
            {points.length} day{points.length !== 1 ? "s" : ""} loaded · Total{" "}
            <span className="font-semibold text-slate-800">{formatCurrency(totalCents)}</span>
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 p-0.5">
          {(["week", "month", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                range === r
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r === "week" ? "This week" : r === "month" ? "This month" : "Loaded history"}
            </button>
          ))}
        </div>
      </div>

      {cumulativePoints.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm text-slate-400">No revenue data for this period</p>
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ minWidth: 300 }}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                  stroke="#e2e8f0" strokeWidth="1"
                />
                <text
                  x={padL - 6} y={t.y + 4}
                  textAnchor="end" fontSize="10" fill="#94a3b8"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* Area fill */}
            {area && <path d={area} fill="url(#revenueGrad)" />}

            {/* Line */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* X-axis labels */}
            {xLabelIndices.map((i) => (
              <text
                key={i}
                x={cumulativePoints.length === 1 ? toX(chartPoints.length - 1) : toX(i)}
                y={H - 8}
                textAnchor="middle" fontSize="10" fill="#94a3b8"
              >
                {formatDate(cumulativePoints[i].date)}
              </text>
            ))}

            {/* Invisible hit targets + dots */}
            {chartPoints.map((p, i) => (
              <g key={i}>
                <circle
                  cx={toX(i)} cy={toY(p.totalCents)}
                  r="4" fill="#2563eb" stroke="#fff" strokeWidth="2"
                  className="opacity-0 transition-opacity"
                  style={{ opacity: tooltip?.i === i ? 1 : 0 }}
                />
                <rect
                  x={toX(i) - xStep / 2} y={padT}
                  width={Math.max(xStep, 20)} height={chartH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setTooltip({ i, x: toX(i), y: toY(p.totalCents) })}
                />
              </g>
            ))}

            {/* Tooltip */}
            {tooltip !== null && chartPoints[tooltip.i] && (() => {
              const p = chartPoints[tooltip.i];
              const tw = 110;
              const th = 40;
              const tx = Math.min(Math.max(tooltip.x, padL + tw / 2), W - padR - tw / 2);
              const ty = Math.max(tooltip.y - th - 8, padT + 2);
              return (
                <g>
                  <rect
                    x={tx - tw / 2} y={ty}
                    width={tw} height={th}
                    rx="7" fill="#0f172a" opacity="0.92"
                  />
                  <text x={tx} y={ty + 15} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600">
                    {formatCurrency(p.totalCents)}
                  </text>
                  <text x={tx} y={ty + 30} textAnchor="middle" fontSize="10" fill="#94a3b8">
                    {formatDate(p.date)}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
}
