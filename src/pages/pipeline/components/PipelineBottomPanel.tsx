import { useState } from "react";
import {
  Boxes,
  ChevronDown,
  ChevronUp,
  GitBranch,
  ListTree,
  Ruler,
} from "lucide-react";
import { message } from "@/components/common/Message";
import pipeImg from "@/assets/管道.png";
import type { Pipeline } from "@/types";

interface PipelineBottomPanelProps {
  pipeline: Pipeline | null;
  scopePipelines: Pipeline[];
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

export default function PipelineBottomPanel({
  pipeline,
  scopePipelines,
  scopeLabel,
}: PipelineBottomPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const total = scopePipelines.length;
  const usageCount = new Set(scopePipelines.map((item) => item.usage)).size;
  const systemCount = new Set(scopePipelines.map((item) => item.system)).size;
  const totalLength = scopePipelines.reduce(
    (sum, item) => sum + (item.length || 0),
    0,
  );
  const averageLength = total === 0 ? 0 : totalLength / total;
  const longestLength = Math.max(
    0,
    ...scopePipelines.map((item) => item.length || 0),
  );
  const materialCounts = Array.from(
    scopePipelines.reduce((counts, item) => {
      const key = item.material || "未填写";
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const dnCounts = Array.from(
    scopePipelines.reduce((counts, item) => {
      const key = item.dn || "未填写";
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const componentCounts = Array.from(
    scopePipelines.reduce((counts, item) => {
      (item.components || []).forEach((component) => {
        counts.set(
          component.type,
          (counts.get(component.type) || 0) + (component.quantity || 1),
        );
      });
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);

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
            {scopeLabel} · 共 {total} 条管路
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
            icon={<img src={pipeImg} alt="model" className="h-3.5 w-3.5 object-contain" />}
            subtitle={pipeline?.code || "请选择管路"}
            accent=""
          >
            {pipeline ? (
              <div
                className="flex h-full w-full cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
                onClick={() => message.info("查看管道模型大图")}
              >
                <img
                  src={pipeImg}
                  alt="管道模型"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-admin-muted">
                请选择管路
              </div>
            )}
          </CardItem>

          <CardItem
            title="清单统计"
            icon={<GitBranch size={14} />}
            subtitle={scopeLabel}
            accent="text-blue-500"
          >
            <div className="grid h-full grid-cols-3 items-center gap-2">
              {[
                { label: "管路总数", value: total, unit: "条" },
                { label: "管路用途", value: usageCount, unit: "类" },
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
            title="管路长度统计"
            icon={<Ruler size={14} />}
            subtitle={scopeLabel}
            accent="text-cyan-500"
          >
            <div className="flex h-full flex-col justify-center gap-2">
              {[
                { label: "总长度", value: totalLength.toFixed(1) },
                { label: "平均长度", value: averageLength.toFixed(1) },
                { label: "最长管路", value: longestLength.toFixed(1) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded bg-gray-50 px-2.5 py-1.5">
                  <span className="text-[10px] text-admin-muted">{item.label}</span>
                  <span className="text-sm font-semibold text-cyan-600">{item.value}m</span>
                </div>
              ))}
            </div>
          </CardItem>

          <CardItem
            title="规格与材质统计"
            icon={<Boxes size={14} />}
            subtitle={`${dnCounts.length}种规格 · ${materialCounts.length}种材质`}
            accent="text-green-500"
          >
            <div className="grid h-full grid-cols-2 gap-2">
              <div className="rounded border border-admin-border bg-gray-50/60 p-2">
                <div className="mb-1.5 text-[10px] text-admin-muted">主要规格</div>
                {dnCounts.slice(0, 3).map(([name, count]) => (
                  <div key={name} className="flex justify-between text-[10px] leading-5">
                    <span className="truncate text-admin-text">{name}</span>
                    <span className="text-green-600">{count}条</span>
                  </div>
                ))}
              </div>
              <div className="rounded border border-admin-border bg-gray-50/60 p-2">
                <div className="mb-1.5 text-[10px] text-admin-muted">主要材质</div>
                {materialCounts.slice(0, 3).map(([name, count]) => (
                  <div key={name} className="flex justify-between text-[10px] leading-5">
                    <span className="truncate text-admin-text">{name}</span>
                    <span className="text-green-600">{count}条</span>
                  </div>
                ))}
              </div>
            </div>
          </CardItem>

          <CardItem
            title="管件统计"
            icon={<Boxes size={14} />}
            subtitle={`共 ${componentCounts.reduce((sum, [, count]) => sum + count, 0)} 个`}
            accent="text-violet-500"
          >
            <div className="grid h-full grid-cols-2 gap-2">
              {componentCounts.slice(0, 4).map(([type, count]) => (
                <div key={type} className="rounded border border-admin-border bg-gray-50/60 p-2">
                  <div className="truncate text-[10px] text-admin-muted">{type}</div>
                  <div className="mt-1 text-lg font-semibold text-violet-600">{count}</div>
                </div>
              ))}
              {componentCounts.length === 0 && (
                <div className="col-span-2 flex items-center justify-center text-xs text-admin-muted">
                  当前层级暂无管件数据
                </div>
              )}
            </div>
          </CardItem>
        </div>
      )}
    </div>
  );
}
