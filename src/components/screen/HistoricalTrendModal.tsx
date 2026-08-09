import { useState, useMemo } from "react";
import { X } from "lucide-react";

interface HistoricalTrendModalProps {
  open: boolean;
  onClose: () => void;
  pointName: string;
  deviceName: string;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const timeRangeOptions: { key: TimeRange; label: string; points: number }[] = [
  { key: "1h", label: "最近1小时", points: 60 },
  { key: "6h", label: "最近6小时", points: 72 },
  { key: "24h", label: "最近24小时", points: 96 },
  { key: "7d", label: "最近7天", points: 84 },
];

function generateMockData(pointName: string, range: TimeRange): number[] {
  const config: Record<string, { base: number; amplitude: number }> = {
    有功功率: { base: 152, amplitude: 18 },
    无功功率: { base: 21, amplitude: 8 },
    定子电压: { base: 13.8, amplitude: 0.6 },
    定子电流: { base: 6520, amplitude: 380 },
    轴承温度: { base: 45, amplitude: 12 },
    冷却水流量: { base: 128, amplitude: 15 },
  };
  const cfg = config[pointName] || { base: 50, amplitude: 10 };
  const option = timeRangeOptions.find((o) => o.key === range)!;
  const count = option.points;
  const data: number[] = [];
  let value = cfg.base;
  const seed = pointName.length + range.length;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const wave = Math.sin(t * Math.PI * (2 + (seed % 3))) * cfg.amplitude * 0.5;
    const noise = (Math.sin(i * 13.7 + seed) + Math.cos(i * 7.3)) * cfg.amplitude * 0.15;
    value = cfg.base + wave + noise;
    data.push(Number(value.toFixed(2)));
  }
  return data;
}

export default function HistoricalTrendModal({
  open,
  onClose,
  pointName,
  deviceName,
}: HistoricalTrendModalProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1h");

  const data = useMemo(
    () => generateMockData(pointName, selectedRange),
    [pointName, selectedRange]
  );

  if (!open) return null;

  const width = 760;
  const height = 340;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.1;
  const yRange = yMax - yMin;

  const points = data.map((val, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((val - yMin) / yRange) * chartH;
    return { x, y, val };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const areaD =
    `M${points[0].x.toFixed(2)},${padding.top + chartH} ` +
    points.map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") +
    ` L${points[points.length - 1].x.toFixed(2)},${padding.top + chartH} Z`;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    (yMin + (yRange * i) / (yTicks - 1)).toFixed(2)
  );

  const option = timeRangeOptions.find((o) => o.key === selectedRange)!;
  const unitMap: Record<string, string> = {
    有功功率: "MW",
    无功功率: "MVar",
    定子电压: "kV",
    定子电流: "A",
    轴承温度: "℃",
    冷却水流量: "m³/h",
  };
  const unit = unitMap[pointName] || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col"
        style={{ width: 800, height: 500 }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-white">{pointName}</h3>
            <span className="text-sm text-gray-400">/ {deviceName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedRange(opt.key)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedRange === opt.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-gray-400">
              共 {option.points} 个采样点 · 单位: {unit}
            </div>
          </div>

          <div className="bg-gray-950 rounded border border-gray-800 p-2">
            <svg
              width="100%"
              viewBox={`0 0 ${width} ${height}`}
              className="block"
            >
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {yTickValues.map((val, i) => {
                const y = padding.top + chartH - ((Number(val) - yMin) / yRange) * chartH;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + chartW}
                      y2={y}
                      stroke="#374151"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 4}
                      textAnchor="end"
                      fill="#9ca3af"
                      fontSize="11"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              <path d={areaD} fill="url(#trendGrad)" />

              <path
                d={pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {points.map((p, i) =>
                i % Math.floor(points.length / 8) === 0 || i === points.length - 1 ? (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="#3b82f6"
                    stroke="#1e3a5f"
                    strokeWidth="1"
                  />
                ) : null
              )}

              <line
                x1={padding.left}
                y1={padding.top + chartH}
                x2={padding.left + chartW}
                y2={padding.top + chartH}
                stroke="#4b5563"
                strokeWidth="1"
              />

              <text
                x={padding.left}
                y={height - 10}
                fill="#6b7280"
                fontSize="11"
              >
                起始
              </text>
              <text
                x={padding.left + chartW}
                y={height - 10}
                textAnchor="end"
                fill="#6b7280"
                fontSize="11"
              >
                当前
              </text>
            </svg>
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-3">
            <span>
              最小值:{" "}
              <span className="text-white">{min.toFixed(2)} {unit}</span>
            </span>
            <span>
              最大值:{" "}
              <span className="text-white">{max.toFixed(2)} {unit}</span>
            </span>
            <span>
              平均值:{" "}
              <span className="text-white">
                {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)} {unit}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}