import { useState } from "react";
import {
  Activity,
  Boxes,
  ChevronDown,
  ChevronUp,
  Link2,
  ListTree,
} from "lucide-react";
import { message } from "@/components/common/Message";
import equipImg from "@/assets/设备.png";
import type { Equipment } from "@/types";

interface EquipmentBottomPanelProps {
  equipment: Equipment | null;
  scopeEquipments: Equipment[];
  scopeLabel: string;
}

function CardItem({
  title,
  icon,
  subtitle,
  children,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="border border-admin-border rounded flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="px-2 py-1.5 border-b border-admin-border bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
        <span className={`${accent}`}>{icon}</span>
        <span className="text-xs font-medium text-admin-text truncate">{title}</span>
        <span className="text-[10px] text-admin-muted ml-auto truncate">{subtitle}</span>
      </div>
      <div className="flex-1 overflow-auto p-2">{children}</div>
    </div>
  );
}

export default function EquipmentBottomPanel({
  equipment,
  scopeEquipments,
  scopeLabel,
}: EquipmentBottomPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const total = scopeEquipments.length;
  const typeCounts = Array.from(
    scopeEquipments.reduce((counts, item) => {
      counts.set(item.type, (counts.get(item.type) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const systemCount = new Set(scopeEquipments.map((item) => item.system)).size;
  const statusStats = [
    { label: "运行", value: scopeEquipments.filter((item) => item.status === "running").length, color: "bg-green-500" },
    { label: "停止", value: scopeEquipments.filter((item) => item.status === "stopped").length, color: "bg-gray-400" },
    { label: "检修", value: scopeEquipments.filter((item) => item.status === "maintenance").length, color: "bg-orange-500" },
    { label: "故障", value: scopeEquipments.filter((item) => item.status === "fault").length, color: "bg-red-500" },
  ];
  const linkedCount = scopeEquipments.filter(
    (item) => item.codeStatus === "linked",
  ).length;
  const linkedRate = total === 0 ? 0 : Math.round((linkedCount / total) * 100);

  return (
    <div
      className="admin-card flex flex-col flex-shrink-0 overflow-hidden transition-[height] duration-200"
      style={{ height: expanded ? 220 : 38 }}
    >
      <div className="flex h-[38px] flex-shrink-0 items-center justify-between border-b border-admin-border px-3">
        <div className="flex min-w-0 items-center gap-2">
          <ListTree size={14} className="text-admin-primary" />
          <span className="text-xs font-medium text-admin-text">层级统计</span>
          <span className="truncate text-[11px] text-admin-muted">
            {scopeLabel} · 共 {total} 台设备
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-1 text-xs text-admin-primary hover:text-blue-700"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {expanded ? "收起统计" : "展开统计"}
        </button>
      </div>

      {expanded && (
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-2 p-2">
          <CardItem
            title="模型图"
            icon={<img src={equipImg} alt="model" className="h-3.5 w-3.5 object-contain" />}
            subtitle={equipment?.code || "请选择设备"}
            accent=""
          >
            {equipment ? (
              <div
                className="flex h-full w-full cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
                onClick={() => message.info("查看3D模型大图")}
              >
                <img
                  src={equipImg}
                  alt="设备模型"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-admin-muted">
                请选择设备
              </div>
            )}
          </CardItem>

          <CardItem
            title="清单统计"
            icon={<ListTree size={14} />}
            subtitle={scopeLabel}
            accent="text-blue-500"
          >
            <div className="grid h-full grid-cols-3 items-center gap-2">
              {[
                { label: "设备总数", value: total, unit: "台" },
                { label: "设备类型", value: typeCounts.length, unit: "类" },
                { label: "所属系统", value: systemCount, unit: "个" },
              ].map((item) => (
                <div key={item.label} className="rounded border border-admin-border bg-gray-50/60 px-2 py-3 text-center">
                  <div className="text-xl font-semibold text-admin-primary">
                    {item.value}
                    <span className="ml-0.5 text-[10px] font-normal">{item.unit}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-admin-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </CardItem>

          <CardItem
            title="设备类型构成"
            icon={<Boxes size={14} />}
            subtitle={`共 ${typeCounts.length} 类`}
            accent="text-cyan-500"
          >
            <div className="flex h-full flex-col justify-center gap-1.5">
              {typeCounts.slice(0, 4).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-16 truncate text-[10px] text-admin-muted">{type}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full rounded bg-cyan-500"
                      style={{ width: `${total === 0 ? 0 : Math.max((count / total) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold text-admin-text">{count}台</span>
                </div>
              ))}
              {typeCounts.length === 0 && (
                <div className="text-center text-xs text-admin-muted">当前层级暂无设备</div>
              )}
            </div>
          </CardItem>

          <CardItem
            title="运行状态统计"
            icon={<Activity size={14} />}
            subtitle={scopeLabel}
            accent="text-green-500"
          >
            <div className="grid h-full grid-cols-2 gap-2">
              {statusStats.map((item) => (
                <div key={item.label} className="rounded border border-admin-border bg-gray-50/60 p-2">
                  <div className="flex items-center gap-1 text-[10px] text-admin-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                    {item.label}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-admin-text">{item.value}</div>
                </div>
              ))}
            </div>
          </CardItem>

          <CardItem
            title="KKS编码挂接"
            icon={<Link2 size={14} />}
            subtitle={scopeLabel}
            accent="text-violet-500"
          >
            <div className="flex h-full flex-col justify-center">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-admin-muted">当前层级挂接率</div>
                  <div className="mt-1 text-2xl font-semibold text-violet-600">{linkedRate}%</div>
                </div>
                <div className="text-right text-[10px] leading-5 text-admin-muted">
                  <div>已挂接 <span className="font-semibold text-green-600">{linkedCount}</span> 台</div>
                  <div>未挂接 <span className="font-semibold text-orange-600">{total - linkedCount}</span> 台</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded bg-violet-500" style={{ width: `${linkedRate}%` }} />
              </div>
            </div>
          </CardItem>
        </div>
      )}
    </div>
  );
}
