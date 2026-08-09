import { useMemo } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Package,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { Tag } from "@/components/common/Tag";
import { message } from "@/components/common/Message";
import pipeImg from "@/assets/管道.png";
import type { Pipeline } from "@/types";

interface PipelineBottomPanelProps {
  pipeline: Pipeline | null;
}

function CardItem({
  title,
  icon,
  count,
  children,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="border border-admin-border rounded flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="px-2 py-1.5 border-b border-admin-border bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
        <span className={`${accent}`}>{icon}</span>
        <span className="text-xs font-medium text-admin-text truncate">{title}</span>
        <span className="text-xs text-admin-muted ml-auto">
          共 <span className="font-semibold text-admin-text">{count}</span> 条
        </span>
      </div>
      <div className="flex-1 overflow-auto p-2">{children}</div>
    </div>
  );
}

export default function PipelineBottomPanel({
  pipeline,
}: PipelineBottomPanelProps) {
  if (!pipeline) {
    return (
      <div
        className="admin-card flex items-center justify-center text-admin-muted flex-shrink-0"
        style={{ height: 200 }}
      >
        <span className="text-sm">请选择管路查看关联信息</span>
      </div>
    );
  }

  const inspections = [
    { date: "2026-07-30", user: "张工", content: "日常巡检，运行正常", result: "合格" },
    { date: "2026-07-25", user: "李工", content: "压力检测专项巡检", result: "合格" },
    { date: "2026-07-20", user: "张工", content: "发现支架松动", result: "关注" },
  ];

  const defects = [
    { level: "严重", value: 0, color: "#ef4444" },
    { level: "一般", value: 2, color: "#f97316" },
    { level: "轻微", value: 4, color: "#94a3b8" },
  ];

  const maintenances = [
    { date: "2026-06-20", type: "定期检修", content: "管道压力检测、防腐层检查" },
    { date: "2026-03-15", type: "故障维修", content: "法兰连接处泄漏处理" },
  ];

  const spares = [
    { name: "法兰 DN200", stock: 4, unit: "件" },
    { name: "密封垫片", stock: 8, unit: "件" },
    { name: "支架螺栓 M16", stock: 24, unit: "套" },
  ];

  const defectPieOption = useMemo(() => ({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    series: [{
      type: "pie",
      radius: ["45%", "70%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      data: defects.map((d) => ({ name: d.level, value: d.value, itemStyle: { color: d.color } })),
    }],
  }), []);

  const inspectionLineOption = useMemo(() => {
    const days = ["07-24", "07-25", "07-26", "07-27", "07-28", "07-29", "07-30"];
    const scores = [90, 88, 85, 70, 65, 92, 95];
    return {
      tooltip: { trigger: "axis" },
      grid: { top: 10, right: 10, bottom: 20, left: 30 },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { fontSize: 9, color: "#94a3b8" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        min: 50,
        max: 100,
        axisLabel: { fontSize: 9, color: "#94a3b8" },
        splitLine: { lineStyle: { color: "#f1f5f9" } },
      },
      series: [{
        type: "line",
        data: scores,
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { color: "#22c55e", width: 2 },
        itemStyle: { color: "#22c55e" },
        areaStyle: { color: "rgba(34,197,94,0.1)" },
      }],
    };
  }, []);

  const totalDefects = defects.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="admin-card flex flex-col flex-shrink-0"
      style={{ height: 200 }}
    >
      <div className="grid grid-cols-5 gap-2 p-2 h-full">
        {/* 模型图 */}
        <CardItem
          title="模型图"
          icon={<img src={pipeImg} alt="model" className="w-3.5 h-3.5 object-contain" />}
          count={1}
          accent=""
        >
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => message.info("查看管道模型大图")}
          >
            <img
              src={pipeImg}
              alt="管道模型"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </CardItem>

        {/* 巡检记录 - 折线图 */}
        <CardItem
          title="巡检记录"
          icon={<ShieldCheck size={14} className="text-green-500" />}
          count={inspections.length}
          accent="text-green-500"
        >
          <div className="h-full flex flex-col">
            <ReactECharts option={inspectionLineOption} style={{ height: "100%", minHeight: 100 }} />
            <div className="flex gap-1 mt-1 flex-shrink-0">
              {inspections.slice(-2).map((log) => (
                <span
                  key={log.date}
                  className={`text-[10px] px-1 rounded ${log.result === "合格" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}
                >
                  {log.date} {log.result}
                </span>
              ))}
            </div>
          </div>
        </CardItem>

        {/* 管路缺陷 - 饼图 */}
        <CardItem
          title="管路缺陷"
          icon={<AlertTriangle size={14} className="text-red-500" />}
          count={totalDefects}
          accent="text-red-500"
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center min-h-0">
              <ReactECharts option={defectPieOption} style={{ height: "100%", width: "100%", minHeight: 80 }} />
            </div>
            <div className="flex items-center gap-2 mt-1 flex-shrink-0">
              {defects.map((d) => (
                <div key={d.level} className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-admin-muted">{d.level} {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardItem>

        {/* 检修维护 */}
        <CardItem
          title="检修维护"
          icon={<Wrench size={14} className="text-blue-500" />}
          count={maintenances.length}
          accent="text-blue-500"
        >
          <div className="space-y-1.5">
            {maintenances.map((m) => (
              <div
                key={m.date}
                className="border border-admin-border rounded p-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => message.info(`查看维护详情：${m.content}`)}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] text-admin-muted">{m.date}</span>
                  <span className="text-[10px] text-blue-600">{m.type}</span>
                </div>
                <div className="text-xs text-admin-text truncate">{m.content}</div>
              </div>
            ))}
          </div>
        </CardItem>

        {/* 备品备件 */}
        <CardItem
          title="备品备件"
          icon={<Package size={14} className="text-cyan-500" />}
          count={spares.length}
          accent="text-cyan-500"
        >
          <div className="space-y-1.5">
            {spares.map((s) => (
              <div
                key={s.name}
                className="border border-admin-border rounded p-1.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1"
                onClick={() => message.info(`查看备件：${s.name}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-admin-text truncate">{s.name}</div>
                </div>
                <div
                  className={`text-xs font-semibold ${
                    s.stock < 3 ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {s.stock}
                  <span className="text-[10px] text-admin-muted ml-0.5">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardItem>
      </div>
    </div>
  );
}
