import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Layers3,
  Table,
  X,
} from "lucide-react";
import { message } from "@/components/common/Message";

export interface DrillDownData {
  detailType?: "measurement" | "device" | "alarm";
  pointName: string;
  deviceName: string;
  kksCode: string;
  metricValue: string;
  unit: string;
  timestamp: string;
  dataSource: {
    pointId: string;
    pointName: string;
    kksCode: string;
    deviceName: string;
    collectionDevice: string;
    sampleRate: string;
    dataQuality: string;
  };
  formula: {
    description: string;
    formula: string;
    inputs: { name: string; value: string; source: string }[];
  };
  rawData: {
    timestamp: string;
    value: string;
    unit: string;
    quality: string;
  }[];
  abnormal?: {
    isAbnormal: boolean;
    threshold: string;
    actualValue: string;
    rule: string;
    alarmRecord?: {
      time: string;
      level: string;
      status: string;
    };
  };
}

export interface DrillDownNode {
  id: string;
  label: string;
  type: "summary" | "category" | "object" | "event" | "point";
  value?: string;
  unit?: string;
  status?: string;
  description?: string;
  scope?: string;
  children?: DrillDownNode[];
  detail?: DrillDownData;
}

export interface DrillDownSession {
  chartId: string;
  title: string;
  description: string;
  root: DrillDownNode;
}

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  data: DrillDownSession | null;
  onExport?: (data: DrillDownData) => void;
  onLocateBIM?: (kksCode: string) => void;
}

type TabKey = "source" | "formula" | "raw";

export default function DrillDownModal({ open, onClose, data, onExport, onLocateBIM }: DrillDownModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("source");
  const [path, setPath] = useState<DrillDownNode[]>([]);

  useEffect(() => {
    if (open && data) {
      setActiveTab("source");
      setPath([data.root]);
    }
  }, [data, open]);

  if (!open || !data) return null;

  const current = path[path.length - 1] || data.root;
  const detail = current.detail;
  const rawData = detail?.rawData || [];
  const hasFormula = Boolean(
    detail?.formula?.formula &&
    detail.formula.formula !== "—",
  );
  const hasRawData = rawData.length > 0;

  const handleOpenRealtime = () => {
    if (!detail) return;
    message.info(
      `实际项目中：将跳转至“${detail.pointName}”实时监测页面，并自动携带KKS编码、测点编号和当前查询时间范围。`
    );
  };

  const handleExport = () => {
    if (!detail) return;
    onExport?.(detail);
    message.success(
      `实际项目中：将按测点“${detail.dataSource.pointId}”和当前时间范围生成CSV文件，包含数值、单位、质量码及异常标记。`
    );
  };

  const tabs = [
    {
      key: "source" as TabKey,
      label:
        detail?.detailType === "device"
          ? "设备详情"
          : detail?.detailType === "alarm"
            ? "告警详情"
            : "数据源测点信息",
      icon: Database,
      visible: true,
    },
    {
      key: "formula" as TabKey,
      label: "指标计算公式",
      icon: Calculator,
      visible: hasFormula,
    },
    {
      key: "raw" as TabKey,
      label: "原始明细数据",
      icon: Table,
      visible: hasRawData,
    },
  ].filter((tab) => tab.visible);

  const drillInto = (node: DrillDownNode) => {
    if (!node.children?.length && !node.detail) return;
    setPath((prev) => [...prev, node]);
    setActiveTab("source");
  };

  const goToLevel = (index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
    setActiveTab("source");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#0d1b2a] to-[#0a1628] border border-[#40A9FF]/50 shadow-2xl w-[860px] max-h-[88vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#40A9FF]/30 bg-[#40A9FF]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#40A9FF]/30 flex items-center justify-center">
              <Layers3 size={16} className="text-[#40A9FF]" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">{data.title}</h3>
              <div className="text-xs text-screen-muted mt-0.5">{data.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(current.value || detail) && (
              <div className="text-right">
                <div className="text-xs text-screen-muted">当前层级</div>
                <div className="text-lg font-bold text-[#40A9FF]">
                  {current.value || detail?.metricValue}
                  <span className="text-xs font-normal ml-1">
                    {current.unit || detail?.unit}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-screen-muted hover:text-white transition-colors w-7 h-7 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 层级导航 */}
        <div className="px-5 py-2.5 border-b border-[#40A9FF]/20 bg-black/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => path.length > 1 && setPath((prev) => prev.slice(0, -1))}
              disabled={path.length <= 1}
              className="w-7 h-7 flex items-center justify-center border border-[#40A9FF]/30 text-[#40A9FF] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#40A9FF]/15"
              title="返回上一级"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex items-center flex-wrap gap-1 text-xs">
              {path.map((node, index) => (
                <div key={`${node.id}-${index}`} className="flex items-center gap-1">
                  <button
                    onClick={() => goToLevel(index)}
                    className={
                      index === path.length - 1
                        ? "text-white font-medium"
                        : "text-[#40A9FF] hover:underline"
                    }
                  >
                    {node.label}
                  </button>
                  {index < path.length - 1 && (
                    <ChevronRight size={12} className="text-screen-muted" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 异常提示 */}
        {detail?.abnormal?.isAbnormal && (
          <div className="mx-5 mt-3 px-3 py-2 bg-red-500/20 border border-red-500/50 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-red-400 font-medium">异常数据：</span>
              <span className="text-screen-text">
                实际值 {detail.abnormal.actualValue}，阈值 {detail.abnormal.threshold}，判定规则：{detail.abnormal.rule}
              </span>
            </div>
          </div>
        )}

        {detail && (
          <div className="flex border-b border-[#40A9FF]/30 px-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? "text-[#40A9FF] border-[#40A9FF]"
                      : "text-screen-muted hover:text-white border-transparent"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-auto p-5">
          {!detail && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-white font-medium">{current.label}</div>
                  <div className="text-xs text-screen-muted mt-1">
                    {current.description || "选择下级数据继续钻取"}
                  </div>
                </div>
                <div className="px-2.5 py-1 border border-[#40A9FF]/30 text-[#40A9FF] text-xs">
                  第 {path.length} 级
                </div>
              </div>

              <div className="border border-[#40A9FF]/25 bg-black/25 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#40A9FF]/10 text-[#40A9FF]">
                      <th className="text-left px-3 py-2.5">分类/对象</th>
                      <th className="text-left px-3 py-2.5">数据范围</th>
                      <th className="text-left px-3 py-2.5">指标值</th>
                      <th className="text-left px-3 py-2.5">状态</th>
                      <th className="text-right px-3 py-2.5">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(current.children || []).map((node) => {
                      const canDrill = Boolean(node.children?.length || node.detail);
                      return (
                        <tr
                          key={node.id}
                          className={`border-t border-[#40A9FF]/10 ${
                            canDrill ? "hover:bg-[#40A9FF]/10 cursor-pointer" : ""
                          }`}
                          onClick={() => canDrill && drillInto(node)}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Activity size={13} className="text-[#40A9FF]" />
                              <div>
                                <div className="text-screen-text font-medium">{node.label}</div>
                                {node.description && (
                                  <div className="text-[10px] text-screen-muted mt-0.5">{node.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-screen-muted">{node.scope || "—"}</td>
                          <td className="px-3 py-2.5 text-white font-mono">
                            {node.value || "—"} {node.unit || ""}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={
                              node.status?.includes("异常") ||
                              node.status?.includes("离线") ||
                              node.status?.includes("严重")
                                ? "text-red-400"
                                : node.status?.includes("警告") ||
                                    node.status?.includes("亚健康")
                                  ? "text-orange-400"
                                  : "text-green-400"
                            }>
                              {node.status || "正常"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {canDrill ? (
                              <button
                                className="inline-flex items-center gap-1 text-[#40A9FF] hover:text-white"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  drillInto(node);
                                }}
                              >
                                {node.detail ? "查看详情" : "继续下钻"}
                                <ChevronRight size={12} />
                              </button>
                            ) : (
                              <span className="text-screen-muted">无下级</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-screen-muted">
                当前仅展示本层数据。选择有下级维度的行后继续钻取，最终层才开放明细、导出和三维定位。
              </div>
            </div>
          )}

          {detail && activeTab === "source" && (
            <div className="space-y-4">
              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">
                  {detail.detailType === "device"
                    ? "设备基本信息"
                    : detail.detailType === "alarm"
                      ? "告警事件信息"
                      : "测点基本信息"}
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div>
                    <span className="text-screen-muted">测点编号：</span>
                    <span className="text-screen-text font-mono">{detail.dataSource.pointId}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">测点名称：</span>
                    <span className="text-screen-text">{detail.dataSource.pointName}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">KKS编码：</span>
                    <span className="text-[#40A9FF] font-mono">{detail.dataSource.kksCode}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">所属设备：</span>
                    <span className="text-screen-text">{detail.dataSource.deviceName}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">采集装置：</span>
                    <span className="text-screen-text">{detail.dataSource.collectionDevice}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">采样频率：</span>
                    <span className="text-screen-text">{detail.dataSource.sampleRate}</span>
                  </div>
                  <div>
                    <span className="text-screen-muted">数据质量：</span>
                    <span className={detail.dataSource.dataQuality === "正常" ? "text-green-400" : "text-red-400"}>
                      <CheckCircle size={12} className="inline mr-1" />
                      {detail.dataSource.dataQuality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">操作</div>
                <div className="flex gap-2">
                  {detail.detailType === "measurement" && (
                    <button
                      onClick={handleOpenRealtime}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                    >
                      <ExternalLink size={14} />
                      跳转实时监测页面
                    </button>
                  )}
                  {hasRawData && (
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                    >
                      <Download size={14} />
                      导出原始时序数据
                    </button>
                  )}
                  <button
                    onClick={() => onLocateBIM?.(detail.kksCode)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#40A9FF]/20 border border-[#40A9FF]/50 text-[#40A9FF] text-sm hover:bg-[#40A9FF]/30 transition-colors rounded"
                  >
                    <ExternalLink size={14} />
                    3D模型定位
                  </button>
                </div>
              </div>

              {detail.abnormal?.alarmRecord && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded">
                  <div className="text-xs text-red-400 font-medium mb-3">关联报警记录</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-screen-muted">报警时间：</span>
                      <span className="text-screen-text">{detail.abnormal.alarmRecord.time}</span>
                    </div>
                    <div>
                      <span className="text-screen-muted">报警级别：</span>
                      <span className="text-red-400">{detail.abnormal.alarmRecord.level}</span>
                    </div>
                    <div>
                      <span className="text-screen-muted">处理状态：</span>
                      <span className="text-screen-text">{detail.abnormal.alarmRecord.status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {detail && activeTab === "formula" && (
            <div className="space-y-4">
              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">指标计算说明</div>
                <div className="text-sm text-screen-text mb-4">{detail.formula.description}</div>
                <div className="bg-[#0a1628] border border-[#40A9FF]/20 p-3 rounded font-mono text-sm text-green-400">
                  {detail.formula.formula}
                </div>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 p-4 rounded">
                <div className="text-xs text-[#40A9FF] font-medium mb-3">参与运算变量</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-screen-muted border-b border-[#40A9FF]/20">
                      <th className="text-left py-2">变量名</th>
                      <th className="text-left py-2">当前值</th>
                      <th className="text-left py-2">数据来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.formula.inputs.map((input, i) => (
                      <tr key={i} className="border-b border-[#40A9FF]/10">
                        <td className="py-2 text-green-300 font-mono">{input.name}</td>
                        <td className="py-2 text-screen-text">{input.value}</td>
                        <td className="py-2 text-screen-muted">{input.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {detail && activeTab === "raw" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-screen-muted">
                  共 {rawData.length} 条采样数据，展示最近10小时
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 text-xs text-[#40A9FF] hover:text-[#69b1ff] transition-colors"
                >
                  <Download size={12} />
                  导出全部原始数据
                </button>
              </div>

              <div className="bg-black/30 border border-[#40A9FF]/20 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#40A9FF]/10 text-[#40A9FF]">
                      <th className="text-left px-3 py-2">采集时间</th>
                      <th className="text-left px-3 py-2">
                        {detail.pointName} ({detail.unit})
                      </th>
                      <th className="text-left px-3 py-2">数据质量</th>
                      <th className="text-left px-3 py-2">异常标记</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-t border-[#40A9FF]/10 ${
                          row.quality === "异常" ? "bg-red-500/10" : ""
                        }`}
                      >
                        <td className="px-3 py-1.5 text-screen-muted font-mono">{row.timestamp}</td>
                        <td
                          className={`px-3 py-1.5 font-mono ${
                            row.quality === "异常" ? "text-red-400" : "text-screen-text"
                          }`}
                        >
                          {row.value} {row.unit}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.quality === "正常" ? (
                            <span className="text-green-400">● 正常</span>
                          ) : (
                            <span className="text-red-400">● 异常</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.quality === "异常" ? (
                            <span className="text-red-400">超阈值</span>
                          ) : (
                            <span className="text-screen-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#40A9FF]/30 bg-black/30">
          <div className="text-xs text-screen-muted">
            {detail
              ? `数据时间：${detail.timestamp} | 当前位于最终明细层`
              : `当前第 ${path.length} 级 | 下级 ${current.children?.length || 0} 项`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm bg-[#40A9FF]/20 text-[#40A9FF] hover:bg-[#40A9FF]/30 transition-colors rounded"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
